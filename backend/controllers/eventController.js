import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/db.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Helper to auto-update event status based on current date/time
 */
export async function syncEventStatuses() {
  const now = new Date();
  // Automatically mark events whose eventDate has passed and are still open/live as COMPLETED
  await prisma.event.updateMany({
    where: {
      status: { in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'EVENT_LIVE'] },
      eventDate: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // 24 hours past event date
    },
    data: { status: 'COMPLETED' },
  });
}

/**
 * Get aggregate dashboard statistics for the authenticated organizer ONLY
 */
export async function getDashboardStats(req, res) {
  try {
    const organizerId = req.user.id;
    await syncEventStatuses();

    const totalEvents = await prisma.event.count({ where: { organizerId } });
    const draftEvents = await prisma.event.count({ where: { organizerId, status: 'DRAFT' } });
    const regOpenEvents = await prisma.event.count({ where: { organizerId, status: 'REGISTRATION_OPEN' } });
    const regClosedEvents = await prisma.event.count({ where: { organizerId, status: 'REGISTRATION_CLOSED' } });
    const liveEvents = await prisma.event.count({ where: { organizerId, status: 'EVENT_LIVE' } });
    const completedEvents = await prisma.event.count({ where: { organizerId, status: 'COMPLETED' } });
    const archivedEvents = await prisma.event.count({ where: { organizerId, status: 'ARCHIVED' } });

    // Events owned by organizer
    const userEvents = await prisma.event.findMany({
      where: { organizerId },
      select: { id: true },
    });
    const eventIds = userEvents.map(e => e.id);

    const totalRegistrations = await prisma.registration.count({ where: { eventId: { in: eventIds } } });
    const activeRegistrations = await prisma.registration.count({ where: { eventId: { in: eventIds }, passStatus: 'ACTIVE' } });
    const totalTeams = await prisma.team.count({ where: { eventId: { in: eventIds } } });
    const totalVolunteers = await prisma.volunteer.count({ where: { eventId: { in: eventIds } } });
    const pendingVolunteerRequests = await prisma.volunteerRequest.count({ where: { eventId: { in: eventIds }, status: 'PENDING' } });

    const certificatesGenerated = await prisma.certificate.count({ where: { eventId: { in: eventIds } } });
    const certificatesSent = await prisma.certificate.count({ where: { eventId: { in: eventIds }, emailStatus: 'SENT' } });
    const certificatesPending = await prisma.certificate.count({ where: { eventId: { in: eventIds }, emailStatus: 'PENDING' } });
    const certificatesFailed = await prisma.certificate.count({ where: { eventId: { in: eventIds }, emailStatus: 'FAILED' } });

    res.json({
      events: {
        total: totalEvents,
        draft: draftEvents,
        registrationOpen: regOpenEvents,
        registrationClosed: regClosedEvents,
        live: liveEvents,
        completed: completedEvents,
        archived: archivedEvents,
      },
      registrations: {
        total: totalRegistrations,
        active: activeRegistrations,
        teams: totalTeams,
      },
      volunteers: {
        total: totalVolunteers,
        pendingRequests: pendingVolunteerRequests,
      },
      certificates: {
        generated: certificatesGenerated,
        sent: certificatesSent,
        pending: certificatesPending,
        failed: certificatesFailed,
      },
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
}

/**
 * List events for the authenticated organizer ONLY (Multi-tenant isolation)
 */
export async function getAllEvents(req, res) {
  try {
    const { status, search, category } = req.query;
    const organizerId = req.user.id;
    await syncEventStatuses();

    const where = { organizerId };

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search } },
            { organizationName: { contains: search } },
            { locationOrLink: { contains: search } },
          ],
        },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      include: {
        _count: {
          select: {
            registrations: true,
            teams: true,
            volunteers: true,
            certificates: true,
          },
        },
      },
    });

    res.json({ events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to list events' });
  }
}

/**
 * List public published events (Filters out completed/past events like 2007 from upcoming lists)
 */
export async function getPublicEvents(req, res) {
  try {
    await syncEventStatuses();
    const now = new Date();

    const events = await prisma.event.findMany({
      where: {
        status: { in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'EVENT_LIVE'] },
        eventDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), // Today onwards
        },
      },
      orderBy: { eventDate: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        type: true,
        status: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        timezone: true,
        locationOrLink: true,
        organizationName: true,
        logoUrl: true,
        bannerUrl: true,
        primaryColor: true,
        secondaryColor: true,
        regCloseDate: true,
        isTeamEvent: true,
        maxTeamMembers: true,
        _count: {
          select: { registrations: true },
        },
      },
    });

    res.json({ events });
  } catch (err) {
    console.error('Error fetching public events:', err);
    res.status(500).json({ error: 'Failed to list public events' });
  }
}

/**
 * Get event by slug (Public page view)
 */
export async function getEventBySlug(req, res) {
  try {
    const { slug } = req.params;
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        customFields: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { registrations: true, teams: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if registration deadline passed and auto-update status if needed
    if (event.regCloseDate && new Date() > new Date(event.regCloseDate) && event.status === 'REGISTRATION_OPEN') {
      event.status = 'REGISTRATION_CLOSED';
      await prisma.event.update({
        where: { id: event.id },
        data: { status: 'REGISTRATION_CLOSED' },
      });
    }

    // Do NOT return volunteerPasswordHash to public clients!
    const { volunteerPasswordHash, ...safeEvent } = event;

    res.json({ event: safeEvent });
  } catch (err) {
    console.error('Error fetching event by slug:', err);
    res.status(500).json({ error: 'Failed to retrieve event' });
  }
}

/**
 * Get event by ID (Admin detailed management view with strict ownership check)
 */
export async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        customFields: {
          orderBy: { orderIndex: 'asc' },
        },
        teams: true,
        templates: true,
        _count: {
          select: {
            registrations: true,
            teams: true,
            volunteers: true,
            volunteerRequests: true,
            certificates: true,
            emailLogs: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Authorization check
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    res.json({ event });
  } catch (err) {
    console.error('Error fetching event by ID:', err);
    res.status(500).json({ error: 'Failed to retrieve event details' });
  }
}

/**
 * Create a new event
 */
export async function createEvent(req, res) {
  try {
    const {
      title,
      description,
      category,
      type,
      eventDate,
      startTime,
      endTime,
      timezone,
      locationOrLink,
      organizationName,
      contactName,
      contactEmail,
      contactPhone,
      websiteUrl,
      socialLinks,
      regOpenDate,
      regCloseDate,
      maxRegistrations,
      isTeamEvent,
      maxTeamMembers,
      requireCaptain,
      allowEditAfterSubmission,
      volunteerPassword,
      primaryColor,
      secondaryColor,
      signatureNames,
      customFields,
    } = req.body;

    if (!title || !eventDate || !organizationName || !contactEmail) {
      return res.status(400).json({ error: 'Title, date, organization, and contact email are required' });
    }

    // Backend validation: reject past event date
    const parsedDate = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDate < today) {
      return res.status(400).json({
        error: 'This event date has already passed. Please select a future date.',
      });
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.event.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Hash volunteer password if provided
    let volunteerPasswordHash = null;
    if (volunteerPassword && volunteerPassword.trim()) {
      volunteerPasswordHash = await bcrypt.hash(volunteerPassword.trim(), 10);
    }

    const event = await prisma.event.create({
      data: {
        slug,
        title: title.trim(),
        description: description || '',
        category: category || 'Hackathons',
        type: type || 'HYBRID',
        status: 'REGISTRATION_OPEN',
        eventDate: parsedDate,
        startTime: startTime || '09:00 AM',
        endTime: endTime || '05:00 PM',
        timezone: timezone || 'UTC',
        locationOrLink: locationOrLink || 'Online / TBD',
        organizationName: organizationName.trim(),
        contactName: contactName || 'Organizer',
        contactEmail: contactEmail.toLowerCase().trim(),
        contactPhone: contactPhone || null,
        websiteUrl: websiteUrl || null,
        socialLinksJson: socialLinks ? JSON.stringify(socialLinks) : null,
        regOpenDate: regOpenDate ? new Date(regOpenDate) : new Date(),
        regCloseDate: regCloseDate ? new Date(regCloseDate) : null,
        maxRegistrations: maxRegistrations ? parseInt(maxRegistrations, 10) : null,
        isTeamEvent: Boolean(isTeamEvent),
        maxTeamMembers: maxTeamMembers ? parseInt(maxTeamMembers, 10) : 4,
        requireCaptain: requireCaptain !== undefined ? Boolean(requireCaptain) : true,
        allowEditAfterSubmission: Boolean(allowEditAfterSubmission),
        volunteerPasswordHash,
        primaryColor: primaryColor || '#2563eb',
        secondaryColor: secondaryColor || '#0f172a',
        signatureNamesJson: signatureNames ? JSON.stringify(signatureNames) : JSON.stringify(['Event Director', 'Executive Dean']),
        organizerId: req.user.id,
      },
    });

    // Create custom registration fields if provided (T-Shirt Size removed)
    if (Array.isArray(customFields) && customFields.length > 0) {
      for (let i = 0; i < customFields.length; i++) {
        const cf = customFields[i];
        if (cf.fieldName && cf.label) {
          await prisma.customRegistrationField.create({
            data: {
              eventId: event.id,
              fieldName: slugify(cf.fieldName),
              label: cf.label,
              fieldType: cf.fieldType || 'TEXT',
              optionsJson: cf.options ? JSON.stringify(cf.options) : null,
              isRequired: Boolean(cf.isRequired),
              orderIndex: i,
            },
          });
        }
      }
    }

    res.status(201).json({ event });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
}

/**
 * Update event with ownership check and past date validation
 */
export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.event.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existing.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const data = { ...req.body };

    if (data.eventDate) {
      const parsedDate = new Date(data.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Only check past date if event is not already completed/archived
      if (parsedDate < today && !['COMPLETED', 'ARCHIVED'].includes(existing.status)) {
        return res.status(400).json({
          error: 'This event date has already passed. Please select a future date.',
        });
      }
      data.eventDate = parsedDate;
    }

    if (data.volunteerPassword) {
      data.volunteerPasswordHash = await bcrypt.hash(data.volunteerPassword.trim(), 10);
      delete data.volunteerPassword;
    }

    if (data.regOpenDate) data.regOpenDate = new Date(data.regOpenDate);
    if (data.regCloseDate) data.regCloseDate = new Date(data.regCloseDate);
    if (data.socialLinks) {
      data.socialLinksJson = JSON.stringify(data.socialLinks);
      delete data.socialLinks;
    }
    if (data.signatureNames) {
      data.signatureNamesJson = JSON.stringify(data.signatureNames);
      delete data.signatureNames;
    }
    if (data.maxRegistrations !== undefined) {
      data.maxRegistrations = data.maxRegistrations ? parseInt(data.maxRegistrations, 10) : null;
    }
    if (data.maxTeamMembers !== undefined) {
      data.maxTeamMembers = parseInt(data.maxTeamMembers, 10);
    }

    // Remove relations/readonly fields
    delete data.id;
    delete data.organizerId;
    delete data.customFields;
    delete data.registrations;
    delete data._count;

    const updated = await prisma.event.update({
      where: { id },
      data,
    });

    res.json({ event: updated });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
}

/**
 * Update event status (Draft, Registration Open, Closed, Live, Completed, Archived)
 */
export async function updateEventStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'EVENT_LIVE', 'COMPLETED', 'ARCHIVED'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Event not found' });
    if (existing.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status },
    });

    res.json({ event: updated });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update event status' });
  }
}

/**
 * Delete event with ownership check
 */
export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.event.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existing.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    await prisma.event.delete({
      where: { id },
    });
    res.json({ success: true, message: `Event "${existing.title}" deleted successfully` });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}

/**
 * Reset Volunteer Password (Admin only - sets new password, hashes it, never retrieves old plaintext)
 */
export async function resetVolunteerPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    // Generate password if none provided
    const passwordToSet = (newPassword && newPassword.trim()) || `vol-${crypto.randomBytes(4).toString('hex')}`;
    const volunteerPasswordHash = await bcrypt.hash(passwordToSet, 10);

    await prisma.event.update({
      where: { id },
      data: { volunteerPasswordHash },
    });

    res.json({
      success: true,
      message: 'Volunteer access password reset successfully.',
      volunteerPassword: passwordToSet,
      newPassword: passwordToSet,
    });
  } catch (err) {
    console.error('Reset volunteer password error:', err);
    res.status(500).json({ error: 'Failed to reset volunteer password' });
  }
}

/**
 * Cleanup Event Passes (12 hours post-event or manual trigger)
 * Cleans temporary pass tokens and marks passStatus as EXPIRED
 * CRITICAL: Preserves Certificates, Teams, Registrations, and Certificate Verification!
 */
export async function cleanupEventPasses(req, res) {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    // Clean pass status and nullify temporary qrToken for active registrations of this event
    const updatedRegistrations = await prisma.registration.updateMany({
      where: {
        eventId: id,
        passStatus: 'ACTIVE',
      },
      data: {
        passStatus: 'EXPIRED',
        qrToken: null,
      },
    });

    await prisma.event.update({
      where: { id },
      data: {
        passesCleanedAt: new Date(),
        status: event.status === 'EVENT_LIVE' ? 'COMPLETED' : event.status,
      },
    });

    res.json({
      success: true,
      message: `Cleaned temporary pass data for ${updatedRegistrations.count} registration(s). Certificates and public credential verification remain fully preserved.`,
      cleanedCount: updatedRegistrations.count,
    });
  } catch (err) {
    console.error('Cleanup passes error:', err);
    res.status(500).json({ error: 'Failed to cleanup event passes' });
  }
}
