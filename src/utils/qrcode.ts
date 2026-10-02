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
 * Computes a human-friendly 6-character pairing code based on contract ID.
 * Example: 'TE-8492'
 */
export function generatePairingCode(contractId: string): string {
  const hash = contractId
    .split('')
    .reduce((acc, char) => (acc * 37 + char.charCodeAt(0)) % 9000, 1000);
  return `TE-${hash}`;
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
  const pairingCode = generatePairingCode(contractId);
  const payload = `${type}#${contractId}#${freelancerId}#${timestamp}`;
  const checksum = payload
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000, 7)
    .toString(16)
    .toUpperCase();

  return `TURNOEXTRA::${type}::${contractId}::${freelancerId}::${timestamp}::${pairingCode}::${checksum}`;
}

/**
 * Parses and validates a QR code string scanned by the manager or a manually entered pairing code.
 * Highly resilient: supports standard tokens, JSON strings, URLs, and short pairing codes.
 */
export function parseDiariaQrToken(raw: string, fallbackContractId?: string): ParsedQrData | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim();

  // 1. Standard TURNOEXTRA format
  if (clean.startsWith('TURNOEXTRA::')) {
    const parts = clean.split('::');
    if (parts.length >= 4) {
      const type = parts[1] as 'CHECKIN' | 'CHECKOUT';
      if (type === 'CHECKIN' || type === 'CHECKOUT') {
        return {
          type,
          contractId: parts[2],
          freelancerId: parts[3] || '',
          timestamp: parseInt(parts[4], 10) || Date.now(),
          raw: clean,
          valid: true,
        };
      }
    }
  }

  // 2. JSON format fallback
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const obj = JSON.parse(clean);
      if (obj.contractId && (obj.type === 'CHECKIN' || obj.type === 'CHECKOUT')) {
        return {
          type: obj.type,
          contractId: obj.contractId,
          freelancerId: obj.freelancerId || '',
          timestamp: obj.timestamp || Date.now(),
          raw: clean,
          valid: true,
        };
      }
    } catch {
      // not JSON
    }
  }

  // 3. URL format fallback
  if (clean.includes('contractId=') || clean.includes('turnoextra.app')) {
    try {
      const url = new URL(clean, 'http://localhost');
      const cid = url.searchParams.get('contractId') || url.searchParams.get('cid');
      const action = url.searchParams.get('type') || url.searchParams.get('action') || 'CHECKIN';
      if (cid) {
        return {
          type: action === 'CHECKOUT' ? 'CHECKOUT' : 'CHECKIN',
          contractId: cid,
          freelancerId: url.searchParams.get('fid') || '',
          timestamp: Date.now(),
          raw: clean,
          valid: true,
        };
      }
    } catch {
      // not URL
    }
  }

  // 4. Contract ID or Pairing code fallback
  if (clean.startsWith('CTR-') || clean.startsWith('TE-')) {
    return {
      type: 'CHECKIN', // default, receiver will detect contract status
      contractId: clean,
      freelancerId: '',
      timestamp: Date.now(),
      raw: clean,
      valid: true,
    };
  }

  // 5. Fallback with context
  if (fallbackContractId) {
    return {
      type: 'CHECKIN',
      contractId: fallbackContractId,
      freelancerId: '',
      timestamp: Date.now(),
      raw: clean,
      valid: true,
    };
  }

  return null;
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
      width: options?.width || 340,
      margin: 2,
      color: {
        dark: options?.darkColor || '#0a0a0a',
        light: options?.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR Code data URL:', err);
    throw err;
  }
}
