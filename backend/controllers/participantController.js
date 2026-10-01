import prisma from '../config/db.js';
import { generateQrDataUrl } from '../services/qrService.js';

/**
 * Participant Portal (Authenticated)
 * Returns all registrations, passes, certificates, and achievements for the authenticated participant
 */
export async function getParticipantProfile(req, res) {
  try {
    const cleanEmail = req.user.email.toLowerCase().trim();

    // Find registrations for this user email
    const registrations = await prisma.registration.findMany({
      where: { email: cleanEmail },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            slug: true,
            title: true,
            organizationName: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            timezone: true,
            locationOrLink: true,
            status: true,
            primaryColor: true,
            logoUrl: true,
            bannerUrl: true,
          },
        },
        team: {
          select: {
            id: true,
            teamName: true,
            teamCode: true,
            awardPosition: true,
          },
        },
        certificates: {
          select: {
            id: true,
            certificateCode: true,
            certificateType: true,
            awardPosition: true,
            issueDate: true,
            pdfPath: true,
          },
        },
      },
    });

    // Format passes and QR codes
    const formattedRegistrations = await Promise.all(
      registrations.map(async reg => {
        let qrDataUrl = null;
        if (reg.qrToken && reg.passStatus === 'ACTIVE') {
          qrDataUrl = await generateQrDataUrl(reg.qrToken, {
            width: 200,
            darkColor: reg.event.primaryColor || '#0f172a',
          });
        }

        return {
          registrationId: reg.id,
          registrationCode: reg.registrationCode,
          fullName: reg.fullName,
          participantIdCode: reg.participantIdCode,
          organization: reg.organization,
          passStatus: reg.passStatus,
          isCaptain: reg.isCaptain,
          qrDataUrl,
          qrToken: reg.qrToken,
          team: reg.team,
          event: reg.event,
          certificates: reg.certificates,
        };
      })
    );

    // Achievements summary
    const achievements = [];
    registrations.forEach(r => {
      r.certificates?.forEach(cert => {
        if (cert.certificateType === 'WINNER' || cert.awardPosition) {
          achievements.push({
            eventId: r.event.id,
            eventTitle: r.event.title,
            organizationName: r.event.organizationName,
            awardPosition: cert.awardPosition || 'Winner',
            certificateCode: cert.certificateCode,
            issueDate: cert.issueDate,
          });
        }
      });
      if (r.team?.awardPosition) {
        achievements.push({
          eventId: r.event.id,
          eventTitle: r.event.title,
          organizationName: r.event.organizationName,
          awardPosition: `${r.team.awardPosition === 1 ? '1st' : r.team.awardPosition === 2 ? '2nd' : '3rd'} Place Team Award (${r.team.teamName})`,
          issueDate: r.event.eventDate,
        });
      }
    });

    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: cleanEmail,
      },
      registrations: formattedRegistrations,
      achievements,
    });
  } catch (err) {
    console.error('Participant profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve participant profile' });
  }
}

/**
 * Public participant lookup endpoint
 */
export async function lookupParticipantPortal(req, res) {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const registrations = await prisma.registration.findMany({
      where: { email: cleanEmail },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            slug: true,
            title: true,
            organizationName: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            timezone: true,
            locationOrLink: true,
            status: true,
            primaryColor: true,
            logoUrl: true,
            bannerUrl: true,
          },
        },
        team: {
          select: {
            id: true,
            teamName: true,
            teamCode: true,
          },
        },
        certificates: {
          select: {
            id: true,
            certificateCode: true,
            certificateType: true,
            awardPosition: true,
            issueDate: true,
            pdfPath: true,
          },
        },
      },
    });

    const formatted = await Promise.all(
      registrations.map(async reg => {
        let qrDataUrl = null;
        if (reg.qrToken && reg.passStatus === 'ACTIVE') {
          qrDataUrl = await generateQrDataUrl(reg.qrToken, {
            width: 200,
            darkColor: reg.event.primaryColor || '#0f172a',
          });
        }

        return {
          registrationId: reg.id,
          registrationCode: reg.registrationCode,
          fullName: reg.fullName,
          participantIdCode: reg.participantIdCode,
          organization: reg.organization,
          passStatus: reg.passStatus,
          isCaptain: reg.isCaptain,
          qrDataUrl,
          qrToken: reg.qrToken,
          team: reg.team,
          event: reg.event,
          certificates: reg.certificates,
        };
      })
    );

    res.json({
      email: cleanEmail,
      registrations: formatted,
    });
  } catch (err) {
    console.error('Participant lookup error:', err);
    res.status(500).json({ error: 'Failed to lookup participant portal' });
  }
}

/**
 * Export Event Participants to CSV (Sanitized filename with Event Name, T-shirt size removed)
 */
export async function exportParticipantsCsv(req, res) {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Multi-tenant check
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: { team: true },
      orderBy: { createdAt: 'asc' },
    });

    // Clean headers (T-Shirt Size completely removed)
    const headers = [
      'Registration Code',
      'Full Name',
      'Participant ID / Roll No.',
      'Email Address',
      'Organization / Institution',
      'Phone Number',
      'Team Name',
      'Team Code',
      'Is Team Captain',
      'Pass Status',
      'Eligibility Status',
      'Registered Timestamp',
    ];

    const rows = registrations.map(r => [
      `"${r.registrationCode}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${r.participantIdCode.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.organization.replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      `"${(r.team ? r.team.teamName : '').replace(/"/g, '""')}"`,
      `"${r.team?.teamCode || ''}"`,
      r.isCaptain ? 'Yes' : 'No',
      r.passStatus,
      r.eligibilityStatus,
      `"${new Date(r.createdAt).toLocaleString('en-US')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');

    // Sanitize event title for filename
    const sanitizedTitle = event.title
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const filename = `${sanitizedTitle}_Participants.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Failed to export participants' });
  }
}
