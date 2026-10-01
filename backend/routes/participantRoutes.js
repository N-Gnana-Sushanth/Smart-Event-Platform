import express from 'express';
import {
  lookupParticipantPortal,
  getParticipantProfile,
  exportParticipantsCsv,
} from '../controllers/participantController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public participant portal lookup
router.get('/lookup', lookupParticipantPortal);

// Authenticated participant profile
router.get('/me', authenticateToken, getParticipantProfile);

// Admin export (Isolated)
router.get('/events/:eventId/export/csv', requireAdmin, exportParticipantsCsv);

export default router;
