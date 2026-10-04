import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PORT, CLIENT_URL } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import participantRoutes from './routes/participantRoutes.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

const app = express();

// CORS configuration supporting CLIENT_URL and local dev
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.netlify.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
const uploadsDir = path.resolve('backend/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Smart Event Management & Digital Credential Platform',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/participants', participantRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred on the server',
  });
});

// Start background 2-hour reminder scheduler
startReminderScheduler();

app.listen(PORT, () => {
  console.log(`[Server] Smart Event Backend running on http://localhost:${PORT}`);
});
