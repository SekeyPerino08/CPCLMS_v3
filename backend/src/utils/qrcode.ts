// ============================================================
// QR Code Generator for Borrow Transactions
// Encodes transaction ID + book accessionNo for return verification
// ============================================================

import QRCode from 'qrcode';

export interface QRPayload {
  txnId: string;
  accessionNo: string;
  userId: string;
  issuedAt: string;
}

/**
 * Generate a QR code as base64 PNG data URL
 * @param payload Data to encode
 * @returns Base64 PNG data URL string
 */
export async function generateQRCode(payload: QRPayload): Promise<string> {
  const json = JSON.stringify(payload);
  return QRCode.toDataURL(json, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });
}

/**
 * Generate a QR code from arbitrary plain text (e.g., a deep-link URL)
 * @param text The text/data to encode
 * @param width Desired pixel width
 * @returns Base64 PNG data URL string
 */
export async function generateQRFromText(text: string, width = 300): Promise<string> {
  return QRCode.toDataURL(text, {
    width,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });
}

/**
 * Decode a QR code string back to payload
 * @param qrCodeData The base64 data URL or raw JSON string
 */
export function decodeQRCode(qrCodeData: string): QRPayload | null {
  try {
    // If it's a data URL, extract the base64 (we can't decode images server-side without sharp)
    // In practice, the scanner returns the decoded text directly
    const jsonStr = qrCodeData.startsWith('data:')
      ? Buffer.from(qrCodeData.split(',')[1], 'base64').toString('utf-8')
      : qrCodeData;
    return JSON.parse(jsonStr) as QRPayload;
  } catch {
    return null;
  }
}

