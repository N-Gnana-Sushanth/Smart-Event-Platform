import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * Generate a cryptographically secure, unpredictable QR credential token
 */
export function generateSecureQrToken() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Generate unique registration code: REG-YYYY-XXXXXX
 */
export function generateRegistrationCode() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REG-${year}-${randomPart}`;
}

/**
 * Generate unique team code: TEAM-YYYY-XXXX
 */
export function generateTeamCode() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TEAM-${year}-${randomPart}`;
}

/**
 * Generate unique certificate code: CERT-YYYY-XXXXXX
 */
export function generateCertificateCode() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CERT-${year}-${randomPart}`;
}

/**
 * Generate QR code as Data URL
 */
export async function generateQrDataUrl(text, options = {}) {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: options.width || 300,
      color: {
        dark: options.darkColor || '#0f172a',
        light: options.lightColor || '#ffffff',
      },
      ...options,
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

/**
 * Generate QR code as PNG Buffer
 */
export async function generateQrBuffer(text, options = {}) {
  try {
    return await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: options.width || 300,
      color: {
        dark: options.darkColor || '#0f172a',
        light: options.lightColor || '#ffffff',
      },
      ...options,
    });
  } catch (err) {
    console.error('Error generating QR buffer:', err);
    throw err;
  }
}
