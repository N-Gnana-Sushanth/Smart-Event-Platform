import express from 'express';
import {
  volunteerLogin,
  submitVolunteerRequest,
  getVolunteerRequests,
  updateVolunteerRequestStatus,
  getApprovedVolunteers,
} from '../controllers/volunteerController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public volunteer actions
router.post('/authorize', volunteerLogin);
router.post('/login', volunteerLogin);
router.post('/requests', submitVolunteerRequest);

// Admin management
router.get('/events/:eventId/requests', requireAdmin, getVolunteerRequests);
router.patch('/requests/:id/status', requireAdmin, updateVolunteerRequestStatus);
router.get('/events/:eventId/approved', requireAdmin, getApprovedVolunteers);

export default router;
