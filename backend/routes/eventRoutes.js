import express from 'express';
import {
  getAllEvents,
  getPublicEvents,
  getEventBySlug,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getDashboardStats,
  resetVolunteerPassword,
  cleanupEventPasses,
} from '../controllers/eventController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/public', getPublicEvents);
router.get('/slug/:slug', getEventBySlug);

// Protected Admin routes
router.get('/dashboard/stats', requireAdmin, getDashboardStats);
router.get('/', requireAdmin, getAllEvents);
router.get('/:id', requireAdmin, getEventById);
router.post('/', requireAdmin, createEvent);
router.put('/:id', requireAdmin, updateEvent);
router.patch('/:id/status', requireAdmin, updateEventStatus);
router.delete('/:id', requireAdmin, deleteEvent);
router.post('/:id/reset-volunteer-password', requireAdmin, resetVolunteerPassword);
router.post('/:id/cleanup-passes', requireAdmin, cleanupEventPasses);

export default router;
