import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import prisma from '../config/db.js';
import { decryptCredential } from '../utils/crypto.js';
import {
  EMAIL_PROVIDER,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  SMTP_FROM_NAME,
  SUPPORT_EMAIL,
  CLIENT_URL,
} from '../config/env.js';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Global fallback / system transporter
 */
export function createSystemTransporter() {
  if (SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return null;
}

/**
 * Create a dedicated nodemailer transporter for a specific organizer
 */
export function createOrganizerTransporter(config) {
  if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPassword) {
    return null;
  }

  let plainPassword = '';

  try {
    plainPassword = decryptCredential(config.smtpPassword);
  } catch (err) {
    console.error(
      `[SMTP Decryption Error] Failed to decrypt SMTP password for organizer ${config.userId}:`,
      err.message
    );
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: parseInt(config.smtpPort, 10) || 587,
    secure:
      Boolean(config.secure) ||
      parseInt(config.smtpPort, 10) === 465,
    auth: {
      user: config.smtpUser,
      pass: plainPassword,
    },
  });
}

/**
 * Verify SMTP connection for a specific organizer
 */
export async function verifyOrganizerSmtpConnection({
  organizerId,
  configOverride = null,
}) {
  let host;
  let port;
  let user;
  let pass;
  let secure;

  if (configOverride) {
    host = configOverride.smtpHost;
    port = parseInt(configOverride.smtpPort, 10) || 587;
    user = configOverride.smtpUser;
    secure =
      Boolean(configOverride.secure) || port === 465;

    if (configOverride.smtpPassword) {
      pass = configOverride.smtpPassword;
    } else if (organizerId) {
      const savedConfig =
        await prisma.organizerEmailConfig.findUnique({
          where: { userId: organizerId },
        });

      if (savedConfig?.smtpPassword) {
        pass = decryptCredential(savedConfig.smtpPassword);
      }
    }
  } else if (organizerId) {
    const savedConfig =
      await prisma.organizerEmailConfig.findUnique({
        where: { userId: organizerId },
      });

    if (!savedConfig) {
      return {
        success: false,
        connected: false,
        message:
          'SMTP configuration missing. Please configure your email sender settings first.',
      };
    }

    host = savedConfig.smtpHost;
    port = parseInt(savedConfig.smtpPort, 10) || 587;
    user = savedConfig.smtpUser;
    secure =
      Boolean(savedConfig.secure) || port === 465;

    try {
      pass = decryptCredential(savedConfig.smtpPassword);
    } catch (e) {
      return {
        success: false,
        connected: false,
        message:
          'Failed to decrypt stored SMTP credentials.',
      };
    }
  } else {
    return {
      success: false,
      connected: false,
      message:
        'No organizer or configuration specified for SMTP verification.',
    };
  }

  if (!host || !user || !pass) {
    return {
      success: false,
      connected: false,
      message:
        'SMTP verification failed: Host, Username, and Password are required.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    await transporter.verify();

    if (organizerId) {
      await prisma.organizerEmailConfig.updateMany({
        where: { userId: organizerId },
        data: {
          isVerified: true,
        },
      });
    }

    return {
      success: true,
      connected: true,
      message:
        'SMTP connection verified successfully. Your mail server is ready to deliver event emails.',
    };
  } catch (err) {
    console.error(
      `[SMTP Verify Error for organizer ${
        organizerId || 'custom'
      }]:`,
      err
    );

    return {
      success: false,
      connected: false,
      message: `SMTP verification failed. Please check your credentials and host settings: ${
        err.message || 'Connection error'
      }`,
    };
  }
}

/**
 * Legacy/System SMTP verification
 */
export async function verifySmtpConnection() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return {
      success: false,
      message:
        'System SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not configured.',
    };
  }

  try {
    const testTransporter = createSystemTransporter();

    if (!testTransporter) {
      return {
        success: false,
        message:
          'Could not create system SMTP transporter.',
      };
    }

    await testTransporter.verify();

    return {
      success: true,
      message:
        'System SMTP connection verified successfully.',
    };
  } catch (err) {
    return {
      success: false,
      message: `System SMTP verification failed: ${
        err.message || 'Connection error'
      }`,
    };
  }
}

/**
 * Dispatch Email with Per-Organizer Sender Architecture
 */
export async function dispatchEmail({
  organizerId = null,
  eventId = null,
  registrationId = null,
  recipientEmail,
  subject,
  htmlContent,
  emailType,
  attachments = [],
  existingLogId = null,
}) {
  let status = 'SENT';
  let errorMessage = null;
  let resolvedOrganizerId = organizerId;
  let senderEmail = null;
  let senderDisplayName = null;

  // If eventId is provided but organizerId is not,
  // look up the organizer
  if (eventId && !resolvedOrganizerId) {
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        organizerId: true,
      },
    });

    if (event) {
      resolvedOrganizerId = event.organizerId;
    }
  }

  // Organizer-owned email
  if (resolvedOrganizerId) {
    const emailConfig =
      await prisma.organizerEmailConfig.findUnique({
        where: {
          userId: resolvedOrganizerId,
        },
      });

    if (!emailConfig) {
      status = 'FAILED';

      errorMessage =
        'Email sending configuration not configured for this organizer';

      console.warn(
        `[EMAIL UNCONFIGURED] Organizer ${resolvedOrganizerId} has no email sender configured. Skipping dispatch to ${recipientEmail}`
      );

      let log;

      if (existingLogId) {
        log = await prisma.emailLog.update({
          where: {
            id: existingLogId,
          },
          data: {
            organizerId: resolvedOrganizerId,
            senderEmail: null,
            status: 'FAILED',
            errorMessage,
          },
        });
      } else {
        log = await prisma.emailLog.create({
          data: {
            organizerId: resolvedOrganizerId,
            senderEmail: null,
            eventId: eventId || null,
            registrationId: registrationId || null,
            recipientEmail,
            subject,
            emailType,
            status: 'FAILED',
            errorMessage,
          },
        });
      }

      const error = new Error(errorMessage);
      error.log = log;

      throw error;
    }

    senderEmail = emailConfig.senderEmail;

    senderDisplayName =
      emailConfig.senderDisplayName ||
      'Event Organizer';

    try {
      /**
       * RESEND
       */
      if (EMAIL_PROVIDER === 'resend') {
        if (!resend) {
          throw new Error(
            'RESEND_API_KEY is not configured'
          );
        }

        const resendPayload = {
          from: `${senderDisplayName} <${senderEmail}>`,
          to: [recipientEmail],
          subject,
          html: htmlContent,
        };

        if (attachments?.length) {
          const resendAttachments = attachments
            .filter(
              (attachment) => attachment?.content
            )
            .map((attachment) => ({
              filename:
                attachment.filename || 'attachment',
              content: attachment.content,
            }));

          if (resendAttachments.length) {
            resendPayload.attachments =
              resendAttachments;
          }
        }

        const { data, error } =
          await resend.emails.send(
            resendPayload
          );

        if (error) {
          throw new Error(
            error.message ||
              'Resend email delivery failed'
          );
        }

        console.log(
          `[EMAIL SENT via Resend] From: ${senderEmail} -> To: ${recipientEmail} | Subject: ${subject} | ID: ${
            data?.id || 'unknown'
          }`
        );
      }

      /**
       * SMTP
       */
      else if (EMAIL_PROVIDER === 'smtp') {
        const transporter =
          createOrganizerTransporter(
            emailConfig
          );

        if (!transporter) {
          throw new Error(
            'Failed to create organizer SMTP transporter. Check credentials.'
          );
        }

        await transporter.sendMail({
          from: `"${senderDisplayName}" <${senderEmail}>`,
          to: recipientEmail,
          subject,
          html: htmlContent,
          attachments,
        });

        console.log(
          `[EMAIL SENT via Organizer SMTP] From: ${senderEmail} -> To: ${recipientEmail} | Subject: ${subject}`
        );
      }

      /**
       * MOCK
       */
      else {
        console.log(
          `[MOCK EMAIL DISPATCHED] Type: ${emailType} | From: ${senderEmail} | To: ${recipientEmail} | Subject: ${subject}`
        );
      }
    } catch (err) {
      console.error(
        `[EMAIL DISPATCH ERROR] Type: ${emailType} | From: ${senderEmail} -> To: ${recipientEmail}:`,
        err
      );

      status = 'FAILED';

      errorMessage =
        err.message || 'Email delivery failed';
    }
  }

  // Platform-level email
  else {
    senderEmail = EMAIL_FROM;
    senderDisplayName = SMTP_FROM_NAME;

    try {
      /**
       * RESEND
       */
      if (EMAIL_PROVIDER === 'resend') {
        if (!resend) {
          throw new Error(
            'RESEND_API_KEY is not configured'
          );
        }

        const resendPayload = {
          from: `${senderDisplayName} <${senderEmail}>`,
          to: [recipientEmail],
          subject,
          html: htmlContent,
        };

        if (attachments?.length) {
          const resendAttachments = attachments
            .filter(
              (attachment) => attachment?.content
            )
            .map((attachment) => ({
              filename:
                attachment.filename || 'attachment',
              content: attachment.content,
            }));

          if (resendAttachments.length) {
            resendPayload.attachments =
              resendAttachments;
          }
        }

        const { data, error } =
          await resend.emails.send(
            resendPayload
          );

        if (error) {
          throw new Error(
            error.message ||
              'Resend email delivery failed'
          );
        }

        console.log(
          `[EMAIL SENT via Resend] From: ${senderEmail} -> To: ${recipientEmail} | Subject: ${subject} | ID: ${
            data?.id || 'unknown'
          }`
        );
      }

      /**
       * SMTP
       */
      else if (EMAIL_PROVIDER === 'smtp') {
        const transporter =
          createSystemTransporter();

        if (transporter) {
          await transporter.sendMail({
            from: `"${senderDisplayName}" <${senderEmail}>`,
            to: recipientEmail,
            subject,
            html: htmlContent,
            attachments,
          });

          console.log(
            `[EMAIL SENT via System SMTP] From: ${senderEmail} -> To: ${recipientEmail} | Subject: ${subject}`
          );
        } else {
          throw new Error(
            'System SMTP not configured'
          );
        }
      }

      /**
       * MOCK
       */
      else {
        console.log(
          `[MOCK EMAIL DISPATCHED] Type: ${emailType} | To: ${recipientEmail} | Subject: ${subject}`
        );
      }
    } catch (err) {
      console.error(
        `[SYSTEM EMAIL ERROR] Type: ${emailType} | To: ${recipientEmail}:`,
        err
      );

      status = 'FAILED';

      errorMessage =
        err.message || 'Email delivery failed';
    }
  }

  // Record email in EmailLog
  let log;

  if (existingLogId) {
    log = await prisma.emailLog.update({
      where: {
        id: existingLogId,
      },
      data: {
        organizerId:
          resolvedOrganizerId || null,
        senderEmail,
        eventId: eventId || null,
        registrationId:
          registrationId || null,
        recipientEmail,
        subject,
        emailType,
        status,
        errorMessage,
        retryCount: {
          increment: 1,
        },
        sentAt: new Date(),
      },
    });
  } else {
    log = await prisma.emailLog.create({
      data: {
        organizerId:
          resolvedOrganizerId || null,
        senderEmail,
        eventId: eventId || null,
        registrationId:
          registrationId || null,
        recipientEmail,
        subject,
        emailType,
        status,
        errorMessage,
      },
    });
  }

  if (status === 'FAILED') {
    const error = new Error(
      errorMessage || 'Email dispatch failed'
    );

    error.log = log;

    throw error;
  }

  return log;
}

/**
 * Send Welcome Email after registration
 */
export async function sendWelcomeEmail({
  event,
  registration,
}) {
  const passUrl = `${CLIENT_URL}/pass/${registration.registrationCode}`;

  const subject = `Registration Confirmed: ${event.title}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background-color: ${
        event.primaryColor || '#2563eb'
      }; padding: 32px 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Registration Confirmed!</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">${
          event.organizationName || 'Event Host'
        }</p>
      </div>

      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <p style="margin-top: 0; font-size: 15px;">
          Dear <strong>${registration.fullName}</strong>,
        </p>

        <p style="font-size: 14px; color: #475569;">
          Your registration for <strong>${event.title}</strong>
          has been successfully confirmed.
          Your digital pass and entry credentials have been generated.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="margin-top: 0; margin-bottom: 12px; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
            Registration Details
          </h3>

          <p style="margin: 6px 0; font-size: 13px;">
            <strong>Registration Code:</strong>
            <span style="font-family: monospace; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">
              ${registration.registrationCode}
            </span>
          </p>

          <p style="margin: 6px 0; font-size: 13px;">
            <strong>Participant ID:</strong>
            ${registration.participantIdCode}
          </p>

          <p style="margin: 6px 0; font-size: 13px;">
            <strong>Event Date:</strong>
            ${new Date(event.eventDate).toLocaleDateString(
              'en-US',
              {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }
            )}
            (${event.startTime} - ${event.endTime})
          </p>

          <p style="margin: 6px 0; font-size: 13px;">
            <strong>Timezone:</strong>
            ${event.timezone || 'UTC'}
          </p>

          <p style="margin: 6px 0; font-size: 13px;">
            <strong>Venue / Link:</strong>
            ${event.locationOrLink}
          </p>

          ${
            registration.team
              ? `<p style="margin: 6px 0; font-size: 13px;">
                  <strong>Team Name:</strong>
                  ${registration.team.teamName}
                  (${registration.team.teamCode})
                </p>`
              : ''
          }
        </div>

        <p style="font-size: 14px; color: #475569;">
          Access your secure digital pass below.
          Present this QR pass at the entrance on event day for verification:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a
            href="${passUrl}"
            style="background-color: ${
              event.primaryColor || '#2563eb'
            }; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;"
          >
            View & Download Digital Pass
          </a>
        </div>

        <div style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; line-height: 1.5;">
          <p style="margin: 0;">
            <strong>Notice:</strong>
            Please save your Registration Code.
            If you need support, contact
            <a
              href="mailto:${SUPPORT_EMAIL}"
              style="color: #2563eb; text-decoration: none;"
            >
              ${SUPPORT_EMAIL}
            </a>.
          </p>
        </div>
      </div>
    </div>
  `;

  return await dispatchEmail({
    organizerId: event.organizerId,
    eventId: event.id,
    registrationId: registration.id,
    recipientEmail: registration.email,
    subject,
    htmlContent,
    emailType: 'WELCOME',
  });
}

/**
 * Send 2-hour event reminder email
 */
export async function sendReminderEmail({
  event,
  registration,
}) {
  const passUrl = `${CLIENT_URL}/pass/${registration.registrationCode}`;

  const subject = `Reminder: ${event.title} begins in 2 hours!`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">

      <div style="background-color: #0f172a; padding: 32px 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">
          Event Starts in ~2 Hours
        </h1>

        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">
          ${event.title}
        </p>
      </div>

      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <p style="margin-top: 0; font-size: 15px;">
          Hello <strong>${registration.fullName}</strong>,
        </p>

        <p style="font-size: 14px; color: #475569;">
          This is a quick reminder that
          <strong>${event.title}</strong>
          is starting in approximately 2 hours.
        </p>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Start Time:</strong>
            ${event.startTime}
            (${event.timezone || 'UTC'})
          </p>

          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Venue / Access:</strong>
            ${event.locationOrLink}
          </p>

          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Registration Code:</strong>
            <span style="font-family: monospace; font-weight: 700;">
              ${registration.registrationCode}
            </span>
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a
            href="${passUrl}"
            style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;"
          >
            Open Digital Pass
          </a>
        </div>
      </div>
    </div>
  `;

  return await dispatchEmail({
    organizerId: event.organizerId,
    eventId: event.id,
    registrationId: registration.id,
    recipientEmail: registration.email,
    subject,
    htmlContent,
    emailType: 'REMINDER',
  });
}

/**
 * Send Certificate Email
 */
export async function sendCertificateEmail({
  event,
  certificate,
  registration,
}) {
  const verifyUrl =
    `${CLIENT_URL}/verify/${certificate.certificateCode}`;

  const subject =
    `Your Certificate for ${event.title} is Ready!`;

  const isWinner =
    certificate.certificateType === 'WINNER';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">

      <div style="background-color: #10b981; padding: 32px 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">
          ${
            isWinner
              ? 'Certificate of Achievement'
              : 'Certificate of Participation'
          }
        </h1>

        <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">
          ${event.title}
        </p>
      </div>

      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">

        <p style="margin-top: 0; font-size: 15px;">
          Dear <strong>${certificate.recipientName}</strong>,
        </p>

        <p style="font-size: 14px; color: #475569;">
          Congratulations!
          Your official digital credential for
          <strong>${event.title}</strong>
          has been issued and conferred.
        </p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">

          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Credential Type:</strong>
            ${certificate.certificateType}
            ${
              certificate.awardPosition
                ? ` (${certificate.awardPosition})`
                : ''
            }
          </p>

          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Certificate ID:</strong>
            <span style="font-family: monospace; font-weight: 700; color: #059669;">
              ${certificate.certificateCode}
            </span>
          </p>

          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Issued by:</strong>
            ${event.organizationName || 'Event Host'}
          </p>
        </div>

        <p style="font-size: 14px; color: #475569;">
          Your certificate includes a tamper-proof verification QR code
          that can be verified publicly by institutions and organizations.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a
            href="${verifyUrl}"
            style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;"
          >
            View & Verify Certificate
          </a>
        </div>
      </div>
    </div>
  `;

  return await dispatchEmail({
    organizerId: event.organizerId,
    eventId: event.id,
    registrationId:
      registration?.id ||
      certificate.registrationId ||
      null,
    recipientEmail:
      registration?.email ||
      certificate.registration?.email,
    subject,
    htmlContent,
    emailType: 'CERTIFICATE',
  });
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail({
  user,
  resetToken,
}) {
  const resetUrl =
    `${CLIENT_URL}/reset-password/${resetToken}`;

  const subject =
    'Password Reset Request — Smart Event Platform';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">

      <div style="background-color: #1e293b; padding: 32px 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">
          Password Reset Request
        </h1>

        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 13px;">
          Smart Event Platform
        </p>
      </div>

      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">

        <p style="margin-top: 0; font-size: 15px;">
          Hello <strong>${user.name}</strong>,
        </p>

        <p style="font-size: 14px; color: #475569;">
          We received a request to reset the password for your account
          associated with <strong>${user.email}</strong>.
        </p>

        <p style="font-size: 14px; color: #475569;">
          Click the button below to create a new password.
          This single-use link expires in 1 hour:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a
            href="${resetUrl}"
            style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;"
          >
            Reset My Password
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
          If you did not request this password reset,
          you can safely ignore this email.
          Your current password remains secure.
        </p>
      </div>
    </div>
  `;

  return await dispatchEmail({
    organizerId: null,
    eventId: null,
    registrationId: null,
    recipientEmail: user.email,
    subject,
    htmlContent,
    emailType: 'PASSWORD_RESET',
  });
}

/**
 * Send Test Email
 */
export async function sendOrganizerTestEmail({
  organizerId,
  toEmail,
}) {
  const config =
    await prisma.organizerEmailConfig.findUnique({
      where: {
        userId: organizerId,
      },
    });

  if (!config) {
    throw new Error(
      'Email sending configuration is not configured. Please save your email settings before sending a test email.'
    );
  }

  const subject =
    `SMTP Test Verification Email — ${new Date().toLocaleTimeString()}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">

      <h2 style="color: #059669; margin-top: 0;">
        SMTP Test Email Delivered Successfully!
      </h2>

      <p style="color: #334155; font-size: 14px;">
        This email confirms that your organizer SMTP server connection,
        credentials, and outbound delivery pipeline are functioning correctly.
      </p>

      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; color: #64748b;">

        <div>
          <strong>Timestamp:</strong>
          ${new Date().toISOString()}
        </div>

        <div>
          <strong>Sender:</strong>
          ${config.senderDisplayName || 'Organizer'}
          &lt;${config.senderEmail}&gt;
        </div>

        <div>
          <strong>SMTP Host:</strong>
          ${config.smtpHost}:${config.smtpPort}
        </div>

        <div>
          <strong>Recipient:</strong>
          ${toEmail}
        </div>

      </div>
    </div>
  `;

  return await dispatchEmail({
    organizerId,
    eventId: null,
    registrationId: null,
    recipientEmail: toEmail,
    subject,
    htmlContent,
    emailType: 'TEST',
  });
}

/**
 * Legacy test email helper
 */
export async function sendTestEmail({ toEmail }) {
  return await sendOrganizerTestEmail({
    organizerId: null,
    toEmail,
  });
}

/**
 * Retry a failed email by ID
 */
export async function retryEmailLog(emailLogId) {
  const log = await prisma.emailLog.findUnique({
    where: {
      id: emailLogId,
    },
    include: {
      event: true,
      registration: true,
    },
  });

  if (!log) {
    throw new Error('Email log not found');
  }

  const organizerId =
    log.organizerId ||
    log.event?.organizerId;

  const updatedLog = await dispatchEmail({
    organizerId,
    eventId: log.eventId,
    registrationId: log.registrationId,
    recipientEmail: log.recipientEmail,
    subject: log.subject,
    htmlContent: `<p>Re-delivered email: ${log.subject}</p>`,
    emailType: log.emailType,
    existingLogId: emailLogId,
  });

  return updatedLog;
}