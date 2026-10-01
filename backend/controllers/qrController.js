import prisma from '../config/db.js';

/**
 * Secure QR Verification Endpoint
 * IMPORTANT:
 * 1. Verification ONLY checks pass status (VALID, INVALID, REVOKED, CANCELLED).
 * 2. It DOES NOT record attendance or check-in timestamps.
 * 3. Zero database check-in mutations occur here.
 */
export async function verifyQrToken(req, res) {
  try {
    const { qrToken, eventId } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        status: 'INVALID',
        message: 'QR Token is missing from verification request',
      });
    }

    // Look up registration by unpredictable cryptographically secure token
    const registration = await prisma.registration.findUnique({
      where: { qrToken: qrToken.trim() },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organizationName: true,
            eventDate: true,
            type: true,
          },
        },
        team: {
          select: {
            id: true,
            teamName: true,
            teamCode: true,
          },
        },
      },
    });

    // 1. Token doesn't exist
    if (!registration) {
      return res.json({
        status: 'INVALID',
        message: 'Invalid QR / Registration Not Found',
      });
    }

    // 2. Token belongs to a different event
    if (eventId && registration.eventId !== eventId) {
      return res.json({
        status: 'INVALID',
        message: 'Registration belongs to a different event',
        eventTitle: registration.event.title,
      });
    }

    // 3. Pass is Revoked
    if (registration.passStatus === 'REVOKED') {
      return res.json({
        status: 'REVOKED',
        message: 'This pass has been revoked by the event organizer',
        participant: {
          fullName: registration.fullName,
          participantIdCode: registration.participantIdCode,
          registrationCode: registration.registrationCode,
          eventTitle: registration.event.title,
        },
      });
    }

    // 4. Registration is Cancelled
    if (registration.passStatus === 'CANCELLED') {
      return res.json({
        status: 'CANCELLED',
        message: 'Registration Cancelled',
        participant: {
          fullName: registration.fullName,
          participantIdCode: registration.participantIdCode,
          registrationCode: registration.registrationCode,
          eventTitle: registration.event.title,
        },
      });
    }

    // 5. Pass is ACTIVE -> VALID
    return res.json({
      status: 'VALID',
      message: 'Valid Registration',
      participant: {
        fullName: registration.fullName,
        participantIdCode: registration.participantIdCode,
        email: registration.email,
        organization: registration.organization,
        registrationCode: registration.registrationCode,
        isCaptain: registration.isCaptain,
        teamName: registration.team?.teamName || null,
        eventTitle: registration.event.title,
        organizationName: registration.event.organizationName,
      },
    });
  } catch (err) {
    console.error('QR verification error:', err);
    res.status(500).json({
      status: 'INVALID',
      message: 'Internal server error during verification',
    });
  }
}
