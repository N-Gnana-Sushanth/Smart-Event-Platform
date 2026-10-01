import prisma from '../config/db.js';
import { sendReminderEmail } from './emailService.js';

/**
 * Check and process upcoming 2-hour event reminders
 */
export async function processUpcomingReminders() {
  try {
    const now = new Date();
    // 2 hours window: from now to now + 2.5 hours
    const windowStart = now;
    const windowEnd = new Date(now.getTime() + (2.5 * 60 * 60 * 1000));

    // Find events happening within window where reminder hasn't been sent
    const upcomingEvents = await prisma.event.findMany({
      where: {
        enableReminder: true,
        reminderSent: false,
        status: { in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'EVENT_LIVE'] },
        eventDate: {
          lte: windowEnd,
        },
      },
      include: {
        registrations: {
          where: {
            passStatus: 'ACTIVE',
          },
        },
      },
    });

    let dispatchedCount = 0;
    for (const event of upcomingEvents) {
      for (const reg of event.registrations) {
        try {
          await sendReminderEmail({ event, registration: reg });
          dispatchedCount++;
        } catch (err) {
          console.error(`Failed to dispatch reminder to ${reg.email}:`, err);
        }
      }

      // Mark reminder sent to prevent duplicate emails
      await prisma.event.update({
        where: { id: event.id },
        data: { reminderSent: true },
      });
    }

    return { processedEvents: upcomingEvents.length, dispatchedCount };
  } catch (err) {
    console.error('Error processing reminders:', err);
    return { error: err.message };
  }
}

/**
 * Start periodic background checking (every 10 minutes)
 */
export function startReminderScheduler() {
  console.log('[Scheduler] Event reminder scheduler initialized (checking every 10 min)');
  setInterval(() => {
    processUpcomingReminders().catch(err => console.error('[Scheduler Error]', err));
  }, 10 * 60 * 1000);
}
