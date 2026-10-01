import express from 'express';
import {
  getCertificateSuggestions,
  uploadCustomTemplate,
  previewSampleCertificate,
  generateCertificates,
  verifyCertificatePublic,
  downloadCertificatePdf,
  downloadCertificatesZip,
  downloadCombinedPdf,
  distributeCertificateEmails,
} from '../controllers/certificateController.js';
import { requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public Verification Endpoint: /api/certificates/verify/:code
router.get('/verify/:code', verifyCertificatePublic);

// Public/Direct download
router.get('/:id/download', downloadCertificatePdf);

// Admin Certificate Operations
router.get('/events/:eventId/ai-suggestions', requireAdmin, getCertificateSuggestions);
router.post('/events/:eventId/upload-template', requireAdmin, upload.single('templateFile'), uploadCustomTemplate);
router.post('/events/:eventId/preview', requireAdmin, previewSampleCertificate);
router.post('/events/:eventId/generate', requireAdmin, generateCertificates);
router.get('/events/:eventId/download/zip', requireAdmin, downloadCertificatesZip);
router.get('/events/:eventId/download/combined-pdf', requireAdmin, downloadCombinedPdf);
router.post('/events/:eventId/distribute-emails', requireAdmin, distributeCertificateEmails);

export default router;
