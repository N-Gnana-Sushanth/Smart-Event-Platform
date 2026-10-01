import prisma from '../config/db.js';
import {
  retryEmailLog,
  verifyOrganizerSmtpConnection,
  verifySmtpConnection,
  sendOrganizerTestEmail,
} from '../services/emailService.js';
import { encryptCredential } from '../utils/crypto.js';
import { processUpcomingReminders } from '../services/reminderScheduler.js';
import { SUPPORT_EMAIL } from '../config/env.js';

/**
 * Get Authenticated Organizer's Email Configuration
 * Endpoint: GET /api/emails/config
 * Strict multi-tenant isolation: Only returns the current organizer's config.
 * Never returns decrypted SMTP password or secret keys!
 */
export async function getOrganizerConfig(req, res) {
  try {
    const userId = req.user.id;
    const config = await prisma.organizerEmailConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      return res.json({
        configured: false,
        config: null,
      });
    }

    res.json({
      configured: true,
      config: {
        id: config.id,
        senderEmail: config.senderEmail,
        senderDisplayName: config.senderDisplayName,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        secure: config.secure,
        isVerified: config.isVerified,
        hasPassword: Boolean(config.smtpPassword),
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  } catch (err) {
    console.error('Get organizer email config error:', err);
    res.status(500).json({ error: 'Failed to retrieve email configuration' });
  }
}

/**
 * Save or Update Authenticated Organizer's Email Configuration
 * Endpoint: POST /api/emails/config or PUT /api/emails/config
 * Strict multi-tenant isolation: Encrypts SMTP password server-side before saving.
 */
export async function saveOrganizerConfig(req, res) {
  try {
    const userId = req.user.id;
    const {
      senderEmail,
      senderDisplayName,
      smtpHost,
      smtpPort = 587,
      smtpUser,
      smtpPassword,
      secure = false,
    } = req.body;

    if (!senderEmail || !smtpHost || !smtpUser) {
      return res.status(400).json({
        error: 'Sender Email, SMTP Host, and SMTP Username are required.',
      });
    }

    const existing = await prisma.organizerEmailConfig.findUnique({
      where: { userId },
    });

    let encryptedPassword = existing?.smtpPassword;

    if (smtpPassword && typeof smtpPassword === 'string' && smtpPassword.trim().length > 0) {
      encryptedPassword = encryptCredential(smtpPassword.trim());
    } else if (!existing) {
      return res.status(400).json({
        error: 'SMTP Password is required for initial email configuration.',
      });
    }

    const portNum = parseInt(smtpPort, 10) || 587;
    const isSecure = Boolean(secure) || portNum === 465;

    const savedConfig = await prisma.organizerEmailConfig.upsert({
      where: { userId },
      create: {
        userId,
        senderEmail: senderEmail.toLowerCase().trim(),
        senderDisplayName: senderDisplayName ? senderDisplayName.trim() : null,
        smtpHost: smtpHost.trim(),
        smtpPort: portNum,
        smtpUser: smtpUser.trim(),
        smtpPassword: encryptedPassword,
        secure: isSecure,
        isVerified: false,
      },
      update: {
        senderEmail: senderEmail.toLowerCase().trim(),
        senderDisplayName: senderDisplayName ? senderDisplayName.trim() : null,
        smtpHost: smtpHost.trim(),
        smtpPort: portNum,
        smtpUser: smtpUser.trim(),
        smtpPassword: encryptedPassword,
        secure: isSecure,
      },
    });

    res.json({
      success: true,
      message: 'Email configuration saved successfully.',
      config: {
        id: savedConfig.id,
        senderEmail: savedConfig.senderEmail,
        senderDisplayName: savedConfig.senderDisplayName,
        smtpHost: savedConfig.smtpHost,
        smtpPort: savedConfig.smtpPort,
        smtpUser: savedConfig.smtpUser,
        secure: savedConfig.secure,
        isVerified: savedConfig.isVerified,
        hasPassword: Boolean(savedConfig.smtpPassword),
        createdAt: savedConfig.createdAt,
        updatedAt: savedConfig.updatedAt,
      },
    });
  } catch (err) {
    console.error('Save organizer email config error:', err);
    res.status(500).json({ error: 'Failed to save email configuration' });
  }
}

/**
 * Verify SMTP Connection for Authenticated Organizer
 * Endpoint: POST /api/emails/verify-smtp
 */
export async function verifySmtp(req, res) {
  try {
    const userId = req.user.id;
    const configOverride = req.body && Object.keys(req.body).length > 0 ? req.body : null;

    const result = await verifyOrganizerSmtpConnection({
      organizerId: userId,
      configOverride,
    });

    res.json(result);
  } catch (err) {
    console.error('Verify SMTP error:', err);
    res.status(500).json({ success: false, connected: false, message: 'Internal error during SMTP verification' });
  }
}

/**
 * Send Test Email using Authenticated Organizer's SMTP Configuration
 * Endpoint: POST /api/emails/send-test
 */
export async function sendTest(req, res) {
  try {
    const userId = req.user.id;
    const { toEmail, recipientEmail } = req.body;
    const targetEmail = (recipientEmail || toEmail || req.user.email || '').toLowerCase().trim();

    if (!targetEmail) {
      return res.status(400).json({ error: 'Recipient email address is required' });
    }

    const result = await sendOrganizerTestEmail({
      organizerId: userId,
      toEmail: targetEmail,
    });

    res.json({
      success: true,
      message: `Test email dispatched to ${targetEmail}. Status: SENT.`,
      log: result,
    });
  } catch (err) {
    console.error('Send test email error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to send test email.',
    });
  }
}

/**
 * Get Email Logs (Organizer Scoped)
 * Endpoint: GET /api/emails/logs
 */
export async function getEmailLogs(req, res) {
  try {
    const { eventId, status, emailType, search } = req.query;
    const userId = req.user.id;

    // Get events owned by this organizer
    const userEvents = await prisma.event.findMany({
      where: { organizerId: userId },
      select: { id: true },
    });
    const userEventIds = userEvents.map(e => e.id);

    const where = {
      OR: [
        { organizerId: userId },
        { eventId: { in: userEventIds } },
      ],
    };

    if (eventId && eventId !== 'ALL') {
      if (!userEventIds.includes(eventId)) {
        return res.status(403).json({ error: 'Unauthorized to view email logs for this event' });
      }
      where.eventId = eventId;
    }

    if (status && status !== 'ALL') where.status = status;
    if (emailType && emailType !== 'ALL') where.emailType = emailType;
    if (search) {
      where.AND = [
        {
          OR: [
            { recipientEmail: { contains: search } },
            { subject: { contains: search } },
            { senderEmail: { contains: search } },
          ],
        },
      ];
    }

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      include: {
        event: {
          select: { title: true, organizationName: true },
        },
      },
    });

    res.json({ logs });
  } catch (err) {
    console.error('Get email logs error:', err);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
}

/**
 * Retry failed email (Organizer Scoped)
 */
export async function retryEmail(req, res) {
  try {
    const { id } = req.params;
    const log = await prisma.emailLog.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!log) {
      return res.status(404).json({ error: 'Email log not found' });
    }

    // Strict multi-tenant check
    const isOwner = log.organizerId === req.user.id || log.event?.organizerId === req.user.id;
    if (!isOwner && log.eventId !== 'SYSTEM') {
      return res.status(403).json({ error: 'Unauthorized to retry this email log' });
    }

    const result = await retryEmailLog(id);
    res.json({ success: true, log: result, message: 'Email retry attempt succeeded.' });
  } catch (err) {
    console.error('Retry email error:', err);
    res.status(500).json({ error: err.message || 'Failed to retry email delivery' });
  }
}

/**
 * Trigger manual reminder check
 */
export async function triggerReminderCheck(req, res) {
  try {
    const result = await processUpcomingReminders();
    res.json({ success: true, result });
  } catch (err) {
    console.error('Reminder trigger error:', err);
    res.status(500).json({ error: 'Failed to execute reminder job' });
  }
}

/**
 * Get Support and Email Config Info (No secrets exposed!)
 */
export async function getEmailConfigInfo(req, res) {
  res.json({
    supportEmail: SUPPORT_EMAIL,
    fromEmail: process.env.EMAIL_FROM || 'Smart Event Platform <noreply@smartevent.io>',
    smtpHost: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    smtpPort: parseInt(process.env.SMTP_PORT || '2525', 10),
    smtpConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
  });
}

