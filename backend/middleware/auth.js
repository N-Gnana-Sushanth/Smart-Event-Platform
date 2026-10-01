import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'ADMIN') {
      return next();
    }
    return res.status(403).json({ error: 'Admin authorization required' });
  });
}

export function authenticateVolunteer(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Volunteer authorization token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired volunteer session' });
    }

    // Allow Admin or Volunteer with matching scope
    if (payload.role === 'ADMIN' || payload.role === 'VOLUNTEER') {
      req.volunteer = payload;
      return next();
    }

    return res.status(403).json({ error: 'Unauthorized role for QR scanner' });
  });
}
