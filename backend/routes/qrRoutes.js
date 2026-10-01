import express from 'express';
import { verifyQrToken } from '../controllers/qrController.js';
import { authenticateVolunteer } from '../middleware/auth.js';

const router = express.Router();

// QR Verification: Accessible by authenticated volunteer or admin
// Validates token and checks status (VALID, REVOKED, CANCELLED, INVALID)
// IMPORTANT: Never saves attendance or check-in timestamps
router.post('/verify', authenticateVolunteer, verifyQrToken);

export default router;
