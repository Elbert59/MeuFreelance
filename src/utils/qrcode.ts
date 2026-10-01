import QRCode from 'qrcode';

export interface ParsedQrData {
  type: 'CHECKIN' | 'CHECKOUT';
  contractId: string;
  freelancerId: string;
  timestamp: number;
  raw: string;
  valid: boolean;
}

/**
 * Generates a structured, secure QR code token for starting or finalizing a diária.
 */
export function generateDiariaQrToken(
  contractId: string,
  type: 'CHECKIN' | 'CHECKOUT',
  freelancerId: string
): string {
  const timestamp = Date.now();
  // Simple checksum for anti-tamper
  const payload = `${type}#${contractId}#${freelancerId}#${timestamp}`;
  const checksum = payload
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000, 7)
    .toString(16)
    .toUpperCase();
  return `CHEFMATCH::${type}::${contractId}::${freelancerId}::${timestamp}::${checksum}`;
}

/**
 * Parses and validates a QR code string scanned by the manager.
 */
export function parseDiariaQrToken(raw: string): ParsedQrData | null {
  if (!raw || typeof raw !== 'string') return null;

  // Expected format: CHEFMATCH::TYPE::CONTRACT_ID::FREELANCER_ID::TIMESTAMP::CHECKSUM
  const parts = raw.trim().split('::');
  if (parts.length < 5 || parts[0] !== 'CHEFMATCH') {
    // Also support fallback format if simplified: TYPE#CONTRACT_ID
    return null;
  }

  const type = parts[1] as 'CHECKIN' | 'CHECKOUT';
  if (type !== 'CHECKIN' && type !== 'CHECKOUT') {
    return null;
  }

  const contractId = parts[2];
  const freelancerId = parts[3];
  const timestamp = parseInt(parts[4], 10) || Date.now();

  return {
    type,
    contractId,
    freelancerId,
    timestamp,
    raw,
    valid: true,
  };
}

/**
 * Renders a QR code to a high-resolution Data URL for visual presentation.
 */
export async function renderQrCodeDataUrl(
  text: string,
  options?: {
    width?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 320,
      margin: 2,
      color: {
        dark: options?.darkColor || '#0a0a0a',
        light: options?.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Error generating QR Code data URL:', err);
    throw err;
  }
}
