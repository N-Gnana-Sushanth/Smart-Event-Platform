import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';

/**
 * Volunteer Login via Event Password
 * Grants scoped volunteer authorization for a specific event
 */
export async function volunteerLogin(req, res) {
  try {
    const { eventSlugOrId, name, identifier, eventPassword } = req.body;

    if (!eventSlugOrId || !identifier || !eventPassword) {
      return res.status(400).json({ error: 'Event, Volunteer Identifier, and Event Password are required' });
    }

    // Find event
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: eventSlugOrId }, { slug: eventSlugOrId }],
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.volunteerPasswordHash) {
      return res.status(400).json({ error: 'Volunteer access password is not configured for this event' });
    }

    // Validate event password
    const isPasswordValid = await bcrypt.compare(eventPassword, event.volunteerPasswordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid event password for volunteer access' });
    }

    // Check if user is approved volunteer or registered participant
    const cleanId = identifier.trim().toLowerCase();
    const approvedVolunteer = await prisma.volunteer.findFirst({
      where: {
        eventId: event.id,
        OR: [
          { volunteerIdCode: { equals: identifier.trim() } },
          { email: { equals: cleanId } },
        ],
      },
    });

    const registeredParticipant = await prisma.registration.findFirst({
      where: {
        eventId: event.id,
        OR: [
          { participantIdCode: { equals: identifier.trim() } },
          { email: { equals: cleanId } },
          { registrationCode: { equals: identifier.trim() } },
        ],
      },
    });

    if (!approvedVolunteer && !registeredParticipant) {
      return res.status(403).json({
        error: 'Volunteer identification not found for this event. Please enter an approved Volunteer ID, Participant ID, or registered email.',
      });
    }

    const volunteerName = name?.trim() || approvedVolunteer?.name || registeredParticipant?.fullName || 'Event Volunteer';

    // Issue event-scoped volunteer token
    const token = jwt.sign(
      {
        role: 'VOLUNTEER',
        eventId: event.id,
        eventTitle: event.title,
        volunteerName,
        volunteerId: approvedVolunteer?.volunteerIdCode || registeredParticipant?.participantIdCode || identifier,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      volunteer: {
        name: volunteerName,
        eventId: event.id,
        eventTitle: event.title,
        organizationName: event.organizationName,
      },
    });
  } catch (err) {
    console.error('Volunteer login error:', err);
    res.status(500).json({ error: 'Volunteer authentication failed' });
  }
}

/**
 * Submit volunteer request (From participant after registration)
 */
export async function submitVolunteerRequest(req, res) {
  try {
    const { eventId, registrationId, name, participantIdCode, email } = req.body;

    if (!eventId || !registrationId || !name || !email) {
      return res.status(400).json({ error: 'Missing required volunteer request parameters' });
    }

    const existing = await prisma.volunteerRequest.findFirst({
      where: { eventId, registrationId },
    });

    if (existing) {
      return res.json({ message: 'Volunteer request already received', request: existing });
    }

    const request = await prisma.volunteerRequest.create({
      data: {
        eventId,
        registrationId,
        name: name.trim(),
        participantIdCode: participantIdCode || 'N/A',
        email: email.toLowerCase().trim(),
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, request });
  } catch (err) {
    console.error('Submit volunteer request error:', err);
    res.status(500).json({ error: 'Failed to submit volunteer request' });
  }
}

/**
 * Get volunteer requests for an event (Admin with ownership check)
 */
export async function getVolunteerRequests(req, res) {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const requests = await prisma.volunteerRequest.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: { registration: true },
    });
    res.json({ requests });
  } catch (err) {
    console.error('Get volunteer requests error:', err);
    res.status(500).json({ error: 'Failed to fetch volunteer requests' });
  }
}

/**
 * Update volunteer request status (Admin with ownership check)
 */
export async function updateVolunteerRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['PENDING', 'CONTACTED', 'ACCEPTED', 'REJECTED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const request = await prisma.volunteerRequest.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!request) return res.status(404).json({ error: 'Volunteer request not found' });
    if (request.event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const updated = await prisma.volunteerRequest.update({
      where: { id },
      data: { status },
    });

    // If accepted, ensure entry exists in approved Volunteer table
    if (status === 'ACCEPTED') {
      const existingVolunteer = await prisma.volunteer.findFirst({
        where: { eventId: request.eventId, email: request.email },
      });

      if (!existingVolunteer) {
        const year = new Date().getFullYear();
        const code = `VOL-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
        await prisma.volunteer.create({
          data: {
            eventId: request.eventId,
            name: request.name,
            volunteerIdCode: code,
            email: request.email,
          },
        });
      }
    }

    res.json({ success: true, request: updated });
  } catch (err) {
    console.error('Update volunteer request status error:', err);
    res.status(500).json({ error: 'Failed to update volunteer request' });
  }
}

/**
 * Get approved volunteers for an event (Admin with ownership check)
 */
export async function getApprovedVolunteers(req, res) {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this event' });
    }

    const volunteers = await prisma.volunteer.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ volunteers });
  } catch (err) {
    console.error('Get approved volunteers error:', err);
    res.status(500).json({ error: 'Failed to fetch approved volunteers' });
  }
}
