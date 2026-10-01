import prisma from '../config/db.js';
import {
  generateSecureQrToken,
  generateRegistrationCode,
  generateTeamCode,
  generateQrDataUrl,
} from '../services/qrService.js';
import { sendWelcomeEmail } from '../services/emailService.js';

/**
 * Register Solo Participant
 */
export async function registerSolo(req, res) {
  try {
    const { eventId } = req.params;
    const {
      fullName,
      participantIdCode,
      email,
      organization,
      phone,
      customFieldValues,
      volunteerOptIn,
    } = req.body;

    if (!fullName || !participantIdCode || !email || !organization) {
      return res.status(400).json({ error: 'Name, Participant ID, Email, and Organization are required' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        customFields: true,
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check event registration status
    if (!['REGISTRATION_OPEN', 'EVENT_LIVE'].includes(event.status)) {
      return res.status(400).json({ error: `Registrations are currently closed (Status: ${event.status})` });
    }

    // Check registration deadline
    if (event.regCloseDate && new Date() > new Date(event.regCloseDate)) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    // Check capacity
    if (event.maxRegistrations && event._count.registrations >= event.maxRegistrations) {
      return res.status(400).json({ error: 'Event has reached maximum registration capacity' });
    }

    // Check duplicate email
    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.registration.findFirst({
      where: {
        eventId,
        email: cleanEmail,
      },
    });

    if (existing) {
      return res.status(400).json({
        error: 'A registration with this email address already exists for this event',
        registrationCode: existing.registrationCode,
      });
    }

    // Generate unique codes
    let registrationCode = generateRegistrationCode();
    while (await prisma.registration.findUnique({ where: { registrationCode } })) {
      registrationCode = generateRegistrationCode();
    }
    const qrToken = generateSecureQrToken();

    const registration = await prisma.registration.create({
      data: {
        registrationCode,
        eventId,
        fullName: fullName.trim(),
        participantIdCode: participantIdCode.trim(),
        email: cleanEmail,
        organization: organization.trim(),
        phone: phone || null,
        passStatus: 'ACTIVE',
        qrToken,
        volunteerOptIn: Boolean(volunteerOptIn),
        customFieldValuesJson: customFieldValues ? JSON.stringify(customFieldValues) : null,
      },
    });

    // Create volunteer request if opted in
    if (volunteerOptIn) {
      await prisma.volunteerRequest.create({
        data: {
          eventId,
          registrationId: registration.id,
          name: registration.fullName,
          participantIdCode: registration.participantIdCode,
          email: registration.email,
          status: 'PENDING',
        },
      });
    }

    // Send Welcome Email asynchronously
    sendWelcomeEmail({ event, registration }).catch(err => {
      console.error('Welcome email dispatch error:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration: {
        id: registration.id,
        registrationCode: registration.registrationCode,
        fullName: registration.fullName,
        email: registration.email,
        qrToken: registration.qrToken,
      },
    });
  } catch (err) {
    console.error('Solo registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

/**
 * Register Team
 */
export async function registerTeam(req, res) {
  try {
    const { eventId } = req.params;
    const { teamName, captainIndex = 0, members, volunteerOptIn } = req.body;

    if (!teamName || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Team name and at least one team member are required' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.isTeamEvent) {
      return res.status(400).json({ error: 'This event is configured for individual registrations only' });
    }

    if (!['REGISTRATION_OPEN', 'EVENT_LIVE'].includes(event.status)) {
      return res.status(400).json({ error: 'Registrations are closed for this event' });
    }

    if (event.regCloseDate && new Date() > new Date(event.regCloseDate)) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    if (members.length > event.maxTeamMembers) {
      return res.status(400).json({ error: `Team exceeds maximum size of ${event.maxTeamMembers} members` });
    }

    // Check capacity for all members
    if (event.maxRegistrations && (event._count.registrations + members.length) > event.maxRegistrations) {
      return res.status(400).json({ error: 'Not enough registration slots remaining for the entire team' });
    }

    // Check duplicate emails
    const emails = members.map(m => m.email.toLowerCase().trim());
    const existingUsers = await prisma.registration.findMany({
      where: {
        eventId,
        email: { in: emails },
      },
    });

    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: `Email ${existingUsers[0].email} is already registered for this event`,
      });
    }

    // Create Team
    let teamCode = generateTeamCode();
    while (await prisma.team.findUnique({ where: { teamCode } })) {
      teamCode = generateTeamCode();
    }

    const team = await prisma.team.create({
      data: {
        teamCode,
        eventId,
        teamName: teamName.trim(),
        status: 'ACTIVE',
      },
    });

    const createdRegistrations = [];

    // Create member registrations
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const isCaptain = i === parseInt(captainIndex, 10);
      let regCode = generateRegistrationCode();
      while (await prisma.registration.findUnique({ where: { registrationCode: regCode } })) {
        regCode = generateRegistrationCode();
      }
      const qrToken = generateSecureQrToken();

      const reg = await prisma.registration.create({
        data: {
          registrationCode: regCode,
          eventId,
          teamId: team.id,
          fullName: m.fullName.trim(),
          participantIdCode: m.participantIdCode.trim(),
          email: m.email.toLowerCase().trim(),
          organization: m.organization?.trim() || event.organizationName,
          phone: m.phone || null,
          passStatus: 'ACTIVE',
          qrToken,
          isCaptain,
          volunteerOptIn: Boolean(volunteerOptIn && isCaptain),
          customFieldValuesJson: m.customFieldValues ? JSON.stringify(m.customFieldValues) : null,
        },
      });

      if (isCaptain) {
        await prisma.team.update({
          where: { id: team.id },
          data: { captainRegistrationId: reg.id },
        });

        if (volunteerOptIn) {
          await prisma.volunteerRequest.create({
            data: {
              eventId,
              registrationId: reg.id,
              name: reg.fullName,
              participantIdCode: reg.participantIdCode,
              email: reg.email,
              status: 'PENDING',
            },
          });
        }
      }

      createdRegistrations.push(reg);

      // Send welcome email to each team member
      sendWelcomeEmail({ event, registration: { ...reg, team } }).catch(e => {
        console.error('Failed team welcome email:', e);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Team registered successfully',
      team: {
        id: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        membersCount: createdRegistrations.length,
      },
      registrations: createdRegistrations.map(r => ({
        registrationCode: r.registrationCode,
        fullName: r.fullName,
        email: r.email,
        isCaptain: r.isCaptain,
      })),
    });
  } catch (err) {
    console.error('Team registration error:', err);
    res.status(500).json({ error: 'Failed to register team' });
  }
}

/**
 * Get Digital Pass data by Registration Code (Public / Participant view)
 */
export async function getPassByCode(req, res) {
  try {
    const { code } = req.params;
    const registration = await prisma.registration.findUnique({
      where: { registrationCode: code },
      include: {
        event: true,
        team: true,
      },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Digital pass not found' });
    }

    // Generate QR Code containing ONLY the secure QR token if active
    let qrDataUrl = null;
    if (registration.qrToken && registration.passStatus === 'ACTIVE') {
      qrDataUrl = await generateQrDataUrl(registration.qrToken, {
        darkColor: registration.event.primaryColor || '#0f172a',
        lightColor: '#ffffff',
        width: 280,
      });
    }

    res.json({
      pass: {
        registrationCode: registration.registrationCode,
        fullName: registration.fullName,
        participantIdCode: registration.participantIdCode,
        organization: registration.organization,
        passStatus: registration.passStatus,
        isCaptain: registration.isCaptain,
        qrDataUrl,
        qrToken: registration.qrToken,
        createdAt: registration.createdAt,
      },
      team: registration.team ? {
        teamName: registration.team.teamName,
        teamCode: registration.team.teamCode,
      } : null,
      event: {
        id: registration.event.id,
        title: registration.event.title,
        slug: registration.event.slug,
        organizationName: registration.event.organizationName,
        logoUrl: registration.event.logoUrl,
        bannerUrl: registration.event.bannerUrl,
        eventDate: registration.event.eventDate,
        startTime: registration.event.startTime,
        endTime: registration.event.endTime,
        timezone: registration.event.timezone,
        locationOrLink: registration.event.locationOrLink,
        type: registration.event.type,
        primaryColor: registration.event.primaryColor,
        secondaryColor: registration.event.secondaryColor,
      },
    });
  } catch (err) {
    console.error('Get pass error:', err);
    res.status(500).json({ error: 'Failed to load digital pass' });
  }
}

/**
 * Get event registrations (Admin view with multi-tenant isolation)
 */
export async function getEventRegistrations(req, res) {
  try {
    const { eventId } = req.params;
    const { search, passStatus, eligibilityStatus } = req.query;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const where = { eventId };
    if (passStatus && passStatus !== 'ALL') where.passStatus = passStatus;
    if (eligibilityStatus && eligibilityStatus !== 'ALL') where.eligibilityStatus = eligibilityStatus;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { participantIdCode: { contains: search } },
        { registrationCode: { contains: search } },
        { organization: { contains: search } },
      ];
    }

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        team: true,
        certificates: true,
      },
    });

    res.json({ registrations });
  } catch (err) {
    console.error('Get registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
}

/**
 * Revoke or update pass status (Admin with ownership check)
 */
export async function updatePassStatus(req, res) {
  try {
    const { id } = req.params;
    const { passStatus } = req.body; // ACTIVE, REVOKED, CANCELLED

    const allowed = ['ACTIVE', 'REVOKED', 'CANCELLED', 'EXPIRED'];
    if (!allowed.includes(passStatus)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }

    const reg = await prisma.registration.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { passStatus },
    });

    res.json({ success: true, registration: updated });
  } catch (err) {
    console.error('Update pass status error:', err);
    res.status(500).json({ error: 'Failed to update pass status' });
  }
}

/**
 * Update eligibility status (Admin with ownership check)
 */
export async function updateEligibility(req, res) {
  try {
    const { id } = req.params;
    const { eligibilityStatus } = req.body; // APPROVED, PENDING, REJECTED

    const reg = await prisma.registration.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { eligibilityStatus },
    });

    res.json({ success: true, registration: updated });
  } catch (err) {
    console.error('Update eligibility error:', err);
    res.status(500).json({ error: 'Failed to update eligibility' });
  }
}
