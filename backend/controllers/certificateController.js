import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import prisma from '../config/db.js';
import { generateCertificateCode, generateQrDataUrl } from '../services/qrService.js';
import { generateCertificatePdf, generateCombinedCertificatesPdf, saveCertificatePdf } from '../services/pdfService.js';
import { generateCertificateSuggestions } from '../services/aiService.js';
import { sendCertificateEmail } from '../services/emailService.js';

function sanitizeFilename(text) {
  return text
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Get Certificate Design Suggestions (with seed for multiple regenerations)
 */
export async function getCertificateSuggestions(req, res) {
  try {
    const { eventId } = req.params;
    const { seed } = req.query;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const suggestions = await generateCertificateSuggestions({
      eventTitle: event.title,
      organization: event.organizationName,
      category: event.category,
      type: event.type,
      primaryColor: event.primaryColor,
      seed: seed ? parseInt(seed, 10) : undefined,
    });

    res.json({ suggestions });
  } catch (err) {
    console.error('AI suggestions error:', err);
    res.status(500).json({ error: 'Failed to generate design suggestions' });
  }
}

/**
 * Upload Custom Template Asset (Admin with ownership check)
 */
export async function uploadCustomTemplate(req, res) {
  try {
    const { eventId } = req.params;
    const { name } = req.body;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File upload is required' });
    }

    const assetUrl = `/uploads/${req.file.filename}`;
    const template = await prisma.certificateTemplate.create({
      data: {
        eventId,
        name: name || 'Custom Uploaded Template',
        designType: 'CUSTOM_UPLOAD',
        backgroundAssetUrl: assetUrl,
        templateConfigJson: JSON.stringify({
          customAsset: assetUrl,
          uploadedAt: new Date(),
        }),
        isApproved: true,
      },
    });

    res.status(201).json({ template });
  } catch (err) {
    console.error('Upload template error:', err);
    res.status(500).json({ error: 'Failed to upload custom template' });
  }
}

/**
 * Generate Sample Preview PDF with live participant or demo data
 */
export async function previewSampleCertificate(req, res) {
  try {
    const { eventId } = req.params;
    const { templateConfig, certificateType = 'PARTICIPANT', awardPosition } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    // Pick first active registration or mock sample
    const sampleReg = await prisma.registration.findFirst({
      where: { eventId, passStatus: 'ACTIVE' },
    });

    const sampleCert = {
      certificateCode: 'CERT-SAMPLE-PREVIEW',
      recipientName: sampleReg?.fullName || 'Alex Morgan',
      certificateType,
      awardPosition: awardPosition || (certificateType === 'WINNER' ? '1st Place' : null),
      issueDate: new Date(),
    };

    const pdfBuffer = await generateCertificatePdf({
      certificate: sampleCert,
      event,
      templateConfig: templateConfig || {},
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="sample-preview.pdf"');
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: 'Failed to generate sample preview' });
  }
}

/**
 * Bulk Generate Certificates (Admin with ownership check)
 */
export async function generateCertificates(req, res) {
  try {
    const { eventId } = req.params;
    const {
      eligibilityMode = 'ALL', // 'ALL', 'APPROVED', 'CUSTOM'
      selectedRegistrationIds = [],
      winnerAssignments = [], // [{ registrationId, teamId, position: '1st Place' | '2nd Place' | '3rd Place' }]
      templateConfig = {},
      distributeEmail = false,
    } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    // 1. Determine eligible registrations
    const where = { eventId };
    if (eligibilityMode === 'APPROVED') {
      where.eligibilityStatus = 'APPROVED';
    } else if (eligibilityMode === 'CUSTOM' && selectedRegistrationIds.length > 0) {
      where.id = { in: selectedRegistrationIds };
    }

    const eligibleRegistrations = await prisma.registration.findMany({
      where,
      include: { team: true },
    });

    if (eligibleRegistrations.length === 0) {
      return res.status(400).json({ error: 'No eligible participants found for certificate generation' });
    }

    // Build winner lookup maps
    const individualWinnerMap = new Map();
    const teamWinnerMap = new Map();

    winnerAssignments.forEach(w => {
      if (w.registrationId) individualWinnerMap.set(w.registrationId, w.position);
      if (w.teamId) teamWinnerMap.set(w.teamId, w.position);
    });

    // Save template configuration
    const template = await prisma.certificateTemplate.create({
      data: {
        eventId,
        name: templateConfig.name || templateConfig.themeName || 'Custom Color Design',
        designType: 'AI_GENERATED',
        templateConfigJson: JSON.stringify(templateConfig),
        isApproved: true,
      },
    });

    const generatedCertificates = [];

    // 2. Generate certificate for each eligible participant
    for (const reg of eligibleRegistrations) {
      // Determine if winner
      let certType = 'PARTICIPANT';
      let awardPos = null;

      if (individualWinnerMap.has(reg.id)) {
        certType = 'WINNER';
        awardPos = individualWinnerMap.get(reg.id);
      } else if (reg.teamId && teamWinnerMap.has(reg.teamId)) {
        certType = 'WINNER';
        awardPos = teamWinnerMap.get(reg.teamId);
      }

      // Check if certificate already exists
      let cert = await prisma.certificate.findFirst({
        where: {
          eventId,
          registrationId: reg.id,
          certificateType: certType,
        },
      });

      let certCode = cert ? cert.certificateCode : generateCertificateCode();
      while (!cert && (await prisma.certificate.findUnique({ where: { certificateCode: certCode } }))) {
        certCode = generateCertificateCode();
      }

      const certData = {
        certificateCode: certCode,
        recipientName: reg.fullName,
        organization: reg.organization || event.organizationName,
        certificateType: certType,
        awardPosition: awardPos,
        issueDate: new Date(),
      };

      // Generate PDF using custom template colors
      const pdfBytes = await generateCertificatePdf({
        certificate: certData,
        event,
        templateConfig,
      });

      // Save PDF file to backend/uploads/certificates/
      const cleanName = sanitizeFilename(reg.fullName);
      const filename = `${cleanName}_${certCode}.pdf`;
      const pdfPath = await saveCertificatePdf(pdfBytes, filename);

      if (cert) {
        cert = await prisma.certificate.update({
          where: { id: cert.id },
          data: {
            awardPosition: awardPos,
            templateId: template.id,
            pdfPath,
            updatedAt: new Date(),
          },
        });
      } else {
        cert = await prisma.certificate.create({
          data: {
            certificateCode: certCode,
            eventId,
            registrationId: reg.id,
            recipientName: reg.fullName,
            organization: reg.organization || event.organizationName,
            certificateType: certType,
            awardPosition: awardPos,
            templateId: template.id,
            pdfPath,
            emailStatus: 'PENDING',
          },
        });
      }

      generatedCertificates.push(cert);

      // Distribute email if requested
      if (distributeEmail) {
        sendCertificateEmail({ event, certificate: cert, registration: reg })
          .then(async () => {
            await prisma.certificate.update({
              where: { id: cert.id },
              data: { emailStatus: 'SENT', emailSentAt: new Date() },
            });
          })
          .catch(async () => {
            await prisma.certificate.update({
              where: { id: cert.id },
              data: { emailStatus: 'FAILED' },
            });
          });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${generatedCertificates.length} certificates`,
      count: generatedCertificates.length,
      certificates: generatedCertificates.map(c => ({
        id: c.id,
        certificateCode: c.certificateCode,
        recipientName: c.recipientName,
        certificateType: c.certificateType,
        awardPosition: c.awardPosition,
        pdfPath: c.pdfPath,
      })),
    });
  } catch (err) {
    console.error('Generate certificates error:', err);
    res.status(500).json({ error: 'Failed to generate certificates' });
  }
}

/**
 * Public Certificate Verification
 * Endpoint: /api/certificates/verify/:code
 * Publicly verifiable by anyone with the certificate ID or QR code
 */
export async function verifyCertificatePublic(req, res) {
  try {
    const { code } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { certificateCode: code.trim().toUpperCase() },
      include: {
        event: {
          select: {
            title: true,
            organizationName: true,
            eventDate: true,
            category: true,
            type: true,
            logoUrl: true,
          },
        },
        registration: {
          select: {
            participantIdCode: true,
            organization: true,
            team: {
              select: { teamName: true },
            },
          },
        },
      },
    });

    if (!cert) {
      return res.status(404).json({
        verified: false,
        message: 'Certificate not found. The credential ID could not be validated.',
      });
    }

    res.json({
      valid: true,
      verified: true,
      certificate: {
        certificateCode: cert.certificateCode,
        recipientName: cert.recipientName,
        certificateType: cert.certificateType,
        awardPosition: cert.awardPosition,
        issueDate: cert.issueDate,
        pdfPath: cert.pdfPath,
      },
      event: {
        title: cert.event.title,
        organizationName: cert.event.organizationName,
        eventDate: cert.event.eventDate,
        category: cert.event.category,
        type: cert.event.type,
        logoUrl: cert.event.logoUrl,
      },
      participant: {
        participantIdCode: cert.registration?.participantIdCode,
        organization: cert.organization,
        teamName: cert.registration?.team?.teamName || null,
      },
    });
  } catch (err) {
    console.error('Verify certificate error:', err);
    res.status(500).json({ error: 'Internal server error during certificate verification' });
  }
}

/**
 * Download single certificate PDF
 */
export async function downloadCertificatePdf(req, res) {
  try {
    const { id } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: { event: true, template: true },
    });

    if (!cert) return res.status(404).json({ error: 'Certificate not found' });

    if (cert.pdfPath) {
      const fullPath = path.resolve('backend' + cert.pdfPath);
      if (fs.existsSync(fullPath)) {
        return res.download(fullPath, path.basename(fullPath));
      }
    }

    let templateConfig = {};
    if (cert.template?.templateConfigJson) {
      try {
        templateConfig = JSON.parse(cert.template.templateConfigJson);
      } catch (e) {}
    }

    // Generate on the fly if file missing
    const pdfBytes = await generateCertificatePdf({
      certificate: cert,
      event: cert.event,
      templateConfig,
    });

    const safeName = sanitizeFilename(cert.recipientName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_${cert.certificateCode}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Download certificate error:', err);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
}

/**
 * Bulk Download: ZIP of individual PDFs (with sanitized event name in filename)
 */
export async function downloadCertificatesZip(req, res) {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const certificates = await prisma.certificate.findMany({
      where: { eventId },
      include: { template: true },
    });

    if (certificates.length === 0) {
      return res.status(404).json({ error: 'No certificates found for this event' });
    }

    const safeEventTitle = sanitizeFilename(event.title);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeEventTitle}_Certificates.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const cert of certificates) {
      if (cert.pdfPath) {
        const fullPath = path.resolve('backend' + cert.pdfPath);
        if (fs.existsSync(fullPath)) {
          archive.file(fullPath, { name: path.basename(fullPath) });
          continue;
        }
      }

      let templateConfig = {};
      if (cert.template?.templateConfigJson) {
        try {
          templateConfig = JSON.parse(cert.template.templateConfigJson);
        } catch (e) {}
      }

      const pdfBytes = await generateCertificatePdf({ certificate: cert, event, templateConfig });
      const cleanName = sanitizeFilename(cert.recipientName);
      archive.append(Buffer.from(pdfBytes), { name: `${cleanName}_${cert.certificateCode}.pdf` });
    }

    await archive.finalize();
  } catch (err) {
    console.error('Bulk ZIP download error:', err);
    res.status(500).json({ error: 'Failed to generate bulk ZIP' });
  }
}

/**
 * Bulk Download: Single Combined Multi-page PDF (with sanitized event name)
 */
export async function downloadCombinedPdf(req, res) {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const certificates = await prisma.certificate.findMany({
      where: { eventId },
      include: { template: true },
    });

    if (certificates.length === 0) {
      return res.status(404).json({ error: 'No certificates found for this event' });
    }

    const items = certificates.map(cert => {
      let templateConfig = {};
      if (cert.template?.templateConfigJson) {
        try {
          templateConfig = JSON.parse(cert.template.templateConfigJson);
        } catch (e) {}
      }
      return {
        certificate: cert,
        event,
        templateConfig,
      };
    });

    const mergedPdfBytes = await generateCombinedCertificatesPdf(items);
    const safeEventTitle = sanitizeFilename(event.title);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeEventTitle}_Combined_Certificates.pdf"`);
    res.send(Buffer.from(mergedPdfBytes));
  } catch (err) {
    console.error('Combined PDF error:', err);
    res.status(500).json({ error: 'Failed to generate combined PDF' });
  }
}

/**
 * Distribute certificate emails (retry or bulk send with real status)
 */
export async function distributeCertificateEmails(req, res) {
  try {
    const { eventId } = req.params;
    const { certificateIds } = req.body;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const where = { eventId };
    if (Array.isArray(certificateIds) && certificateIds.length > 0) {
      where.id = { in: certificateIds };
    } else {
      where.emailStatus = { in: ['PENDING', 'FAILED'] };
    }

    const certs = await prisma.certificate.findMany({
      where,
      include: { registration: true },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const cert of certs) {
      try {
        await sendCertificateEmail({
          event,
          certificate: cert,
          registration: cert.registration,
        });
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { emailStatus: 'SENT', emailSentAt: new Date() },
        });
        sentCount++;
      } catch (err) {
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { emailStatus: 'FAILED' },
        });
        failedCount++;
      }
    }

    res.json({ success: true, processed: certs.length, sent: sentCount, failed: failedCount });
  } catch (err) {
    console.error('Distribute emails error:', err);
    res.status(500).json({ error: 'Failed to distribute certificate emails' });
  }
}
