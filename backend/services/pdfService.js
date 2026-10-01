import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { generateQrBuffer } from './qrService.js';
import { CLIENT_URL } from '../config/env.js';

// Helper to convert hex to rgb
function hexToRgb(hex) {
  if (!hex) return rgb(0.12, 0.23, 0.54);
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0.1 : r, isNaN(g) ? 0.1 : g, isNaN(b) ? 0.1 : b);
}

/**
 * Generate a single high-quality Certificate PDF
 */
export async function generateCertificatePdf({ certificate, event, templateConfig = {} }) {
  const pdfDoc = await PDFDocument.create();

  // Standard A4 landscape: 842 x 595 points
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  // Embed fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Theme colors - respects custom selections
  const primaryColor = hexToRgb(templateConfig.primaryColor || event.primaryColor || '#1e3a8a');
  const accentGold = hexToRgb(templateConfig.accentColor || '#d97706');
  const textDark = hexToRgb(templateConfig.textColor || '#0f172a');
  const textMuted = hexToRgb('#64748b');

  // 1. Draw outer decorative background & border
  // Outer margin: 24pt
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: primaryColor,
    borderWidth: 3,
    color: rgb(0.99, 0.99, 1.0),
  });

  // Inner margin border: 34pt
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: accentGold,
    borderWidth: 1,
  });

  // Corner decorative flourishes
  const cornerSize = 20;
  const corners = [
    { x: 38, y: height - 38 },
    { x: width - 38 - cornerSize, y: height - 38 },
    { x: 38, y: 38 + cornerSize },
    { x: width - 38 - cornerSize, y: 38 + cornerSize },
  ];
  corners.forEach(c => {
    page.drawSquare({
      x: c.x,
      y: c.y - cornerSize,
      size: cornerSize,
      color: accentGold,
      opacity: 0.15,
    });
  });

  // 2. Organization Header
  const orgText = (event.organizationName || 'GLOBAL CREDENTIAL AUTHORITY').toUpperCase();
  const orgWidth = fontBold.widthOfTextAtSize(orgText, 14);
  page.drawText(orgText, {
    x: (width - orgWidth) / 2,
    y: height - 80,
    size: 14,
    font: fontBold,
    color: primaryColor,
  });

  // 3. Certificate Title
  const isWinner = certificate.certificateType === 'WINNER';
  const title = isWinner ? 'CERTIFICATE OF ACHIEVEMENT' : 'CERTIFICATE OF PARTICIPATION';
  const titleWidth = fontTimesBold.widthOfTextAtSize(title, 28);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 125,
    size: 28,
    font: fontTimesBold,
    color: isWinner ? accentGold : primaryColor,
  });

  // Subtitle / Award Badge (No broken question mark symbols)
  if (isWinner && certificate.awardPosition) {
    const awardText = `[ ${certificate.awardPosition.toUpperCase()} ]`;
    const awardWidth = fontBold.widthOfTextAtSize(awardText, 14);
    page.drawText(awardText, {
      x: (width - awardWidth) / 2,
      y: height - 150,
      size: 14,
      font: fontBold,
      color: accentGold,
    });
  }

  // 4. "This is proudly presented to"
  const presentedText = 'THIS IS PROUDLY PRESENTED TO';
  const presentedWidth = fontRegular.widthOfTextAtSize(presentedText, 11);
  page.drawText(presentedText, {
    x: (width - presentedWidth) / 2,
    y: height - 185,
    size: 11,
    font: fontRegular,
    color: textMuted,
  });

  // 5. Recipient Name (Large, Bold, Centered)
  const recipient = certificate.recipientName || 'Participant Name';
  const recipientWidth = fontTimesBold.widthOfTextAtSize(recipient, 30);
  page.drawText(recipient, {
    x: (width - recipientWidth) / 2,
    y: height - 230,
    size: 30,
    font: fontTimesBold,
    color: textDark,
  });

  // Underline for recipient name
  const lineStart = (width - Math.max(recipientWidth + 40, 300)) / 2;
  const lineEnd = lineStart + Math.max(recipientWidth + 40, 300);
  page.drawLine({
    start: { x: lineStart, y: height - 238 },
    end: { x: lineEnd, y: height - 238 },
    thickness: 1.5,
    color: accentGold,
  });

  // 6. Recipient Organization & Narrative
  let narrative = '';
  if (isWinner) {
    narrative = `for outstanding excellence and securing ${certificate.awardPosition || 'an award'} in ${event.title}`;
  } else {
    narrative = `for active participation and successful contribution to ${event.title}`;
  }
  const narrativeWidth = fontOblique.widthOfTextAtSize(narrative, 13);
  page.drawText(narrative, {
    x: (width - Math.min(narrativeWidth, width - 120)) / 2,
    y: height - 275,
    size: 13,
    font: fontOblique,
    color: textDark,
  });

  // Event category / date mention (No broken question mark symbols)
  const issueDateStr = new Date(certificate.issueDate || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const subNarrative = `Held on ${new Date(event.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | Category: ${event.category || 'General'}`;
  const subWidth = fontRegular.widthOfTextAtSize(subNarrative, 10);
  page.drawText(subNarrative, {
    x: (width - subWidth) / 2,
    y: height - 300,
    size: 10,
    font: fontRegular,
    color: textMuted,
  });

  // 7. Embed Verification QR Code
  // Verification URL: /verify/CERT-2026-XXXXXX
  const verifyUrl = `${CLIENT_URL}/verify/${certificate.certificateCode}`;
  const qrBuffer = await generateQrBuffer(verifyUrl, {
    width: 160,
    darkColor: '#0f172a',
    lightColor: '#ffffff',
  });
  const qrImage = await pdfDoc.embedPng(qrBuffer);

  const qrSize = 75;
  const qrX = width / 2 - qrSize / 2;
  const qrY = 100;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // QR Label & Certificate ID
  const qrLabel = 'Scan to Verify Credential';
  const qrLabelWidth = fontRegular.widthOfTextAtSize(qrLabel, 8);
  page.drawText(qrLabel, {
    x: (width - qrLabelWidth) / 2,
    y: qrY - 12,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  const certIdText = `ID: ${certificate.certificateCode}`;
  const certIdWidth = fontBold.widthOfTextAtSize(certIdText, 9);
  page.drawText(certIdText, {
    x: (width - certIdWidth) / 2,
    y: qrY - 24,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });

  // 8. Signatures
  let sigNames = ['Dr. Event Director', 'Authorized Signatory'];
  try {
    if (event.signatureNamesJson) {
      const parsed = JSON.parse(event.signatureNamesJson);
      if (Array.isArray(parsed) && parsed.length > 0) sigNames = parsed;
    }
  } catch (e) {}

  // Left signature
  page.drawLine({
    start: { x: 90, y: 125 },
    end: { x: 260, y: 125 },
    thickness: 1,
    color: textMuted,
  });
  page.drawText(sigNames[0] || 'Event Organizer', {
    x: 90,
    y: 110,
    size: 10,
    font: fontBold,
    color: textDark,
  });
  page.drawText('Official Signatory', {
    x: 90,
    y: 98,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  // Right signature
  page.drawLine({
    start: { x: width - 260, y: 125 },
    end: { x: width - 90, y: 125 },
    thickness: 1,
    color: textMuted,
  });
  page.drawText(sigNames[1] || 'Academic / Program Dean', {
    x: width - 260,
    y: 110,
    size: 10,
    font: fontBold,
    color: textDark,
  });
  page.drawText(`Issued: ${issueDateStr}`, {
    x: width - 260,
    y: 98,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  return await pdfDoc.save();
}

/**
 * Generate a single combined PDF containing all certificates as pages
 */
export async function generateCombinedCertificatesPdf(certItems) {
  const mergedPdf = await PDFDocument.create();

  for (const item of certItems) {
    const singlePdfBytes = await generateCertificatePdf(item);
    const loadedPdf = await PDFDocument.load(singlePdfBytes);
    const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Save certificate buffer to disk
 */
export async function saveCertificatePdf(pdfBuffer, filename) {
  const uploadDir = path.resolve('backend/uploads/certificates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
  return `/uploads/certificates/${filename}`;
}
