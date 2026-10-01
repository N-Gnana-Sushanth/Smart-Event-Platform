import express from 'express';
import {
  login,
  register,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);
router.get('/me', authenticateToken, getMe);

export default router;
