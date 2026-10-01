import express from 'express';
import {
  getOrganizerConfig,
  saveOrganizerConfig,
  getEmailLogs,
  retryEmail,
  triggerReminderCheck,
  verifySmtp,
  sendTest,
  getEmailConfigInfo,
} from '../controllers/emailController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/config-info', getEmailConfigInfo);
router.get('/config', requireAdmin, getOrganizerConfig);
router.post('/config', requireAdmin, saveOrganizerConfig);
router.put('/config', requireAdmin, saveOrganizerConfig);
router.get('/logs', requireAdmin, getEmailLogs);
router.post('/logs/:id/retry', requireAdmin, retryEmail);
router.post('/reminders/run', requireAdmin, triggerReminderCheck);
router.post('/verify-smtp', requireAdmin, verifySmtp);
router.post('/send-test', requireAdmin, sendTest);

export default router;

