import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Production security enforcement: require critical secrets from environment variables
if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length === 0) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set in production.');
  }
  if (!process.env.EMAIL_CREDENTIAL_ENCRYPTION_KEY || process.env.EMAIL_CREDENTIAL_ENCRYPTION_KEY.trim().length === 0) {
    throw new Error('FATAL SECURITY ERROR: EMAIL_CREDENTIAL_ENCRYPTION_KEY environment variable must be set in production.');
  }
}

// Development placeholders (strictly used for local offline development/testing only)
const DEV_FALLBACK_JWT_SECRET = 'dev-only-insecure-jwt-secret-do-not-use-in-production-12345';
const DEV_FALLBACK_ENCRYPTION_KEY = 'dev-only-insecure-encryption-key-32bytes-sample-test';

export const PORT = parseInt(process.env.PORT || '5000', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || DEV_FALLBACK_JWT_SECRET;
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
export const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'mock';
export const SMTP_HOST = process.env.SMTP_HOST || 'smtp.mailtrap.io';
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || '2525', 10);
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Smart Event Platform <noreply@smartevent.io>';
export const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Smart Event Platform';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@smartevent.io';
export const AI_PROVIDER = process.env.AI_PROVIDER || 'mock';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const EMAIL_CREDENTIAL_ENCRYPTION_KEY = process.env.EMAIL_CREDENTIAL_ENCRYPTION_KEY || DEV_FALLBACK_ENCRYPTION_KEY;

