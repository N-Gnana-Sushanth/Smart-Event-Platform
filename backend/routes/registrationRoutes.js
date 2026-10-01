import express from 'express';
import {
  registerSolo,
  registerTeam,
  getPassByCode,
  getEventRegistrations,
  updatePassStatus,
  updateEligibility,
} from '../controllers/registrationController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public registration & pass viewing
router.post('/events/:eventId/register/solo', registerSolo);
router.post('/events/:eventId/register/team', registerTeam);
router.get('/pass/:code', getPassByCode);

// Admin registration management
router.get('/events/:eventId/participants', requireAdmin, getEventRegistrations);
router.patch('/:id/pass-status', requireAdmin, updatePassStatus);
router.patch('/:id/eligibility', requireAdmin, updateEligibility);

export default router;
