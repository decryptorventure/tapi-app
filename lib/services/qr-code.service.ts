/**
 * QR Code data structure for job check-in (NEW OWNER FLOW)
 * Owner has 1 static QR → Worker scans to check-in for any job at this restaurant
 */
interface OwnerQRCodeData {
  owner_id: string;
  type: 'owner_checkin';
  created_at: string;
}

/**
 * Check-in validation result
 */
interface CheckinValidationResult {
  valid: boolean;
  ownerId?: string;
  error?: string;
  errorCode?: 'INVALID_FORMAT' | 'INVALID_SIGNATURE' | 'EXPIRED';
}

/**
 * GPS Coordinates
 */
interface Coordinates {
  latitude: number;
  longitude: number;
}

const isBrowser = typeof window !== 'undefined';

/**
 * Get the QR secret — works on both server and client.
 * Server: process.env.QR_SECRET (private)
 * Client: process.env.NEXT_PUBLIC_QR_SECRET (public)
 */
function getQRSecret(): string {
  if (isBrowser) {
    return process.env.NEXT_PUBLIC_QR_SECRET || 'default-secret-change-in-production';
  }
  return process.env.QR_SECRET || process.env.NEXT_PUBLIC_QR_SECRET || 'default-secret-change-in-production';
}

/**
 * Browser-compatible HMAC-SHA256 using Web Crypto API
 */
async function hmacSHA256Browser(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Server-side HMAC-SHA256 using Node.js crypto
 */
function hmacSHA256Server(secret: string, message: string): string {
  const nodeCrypto = require('crypto');
  return nodeCrypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Universal HMAC-SHA256 — auto-picks browser or server implementation
 */
async function hmacSHA256(secret: string, message: string): Promise<string> {
  if (isBrowser) {
    return hmacSHA256Browser(secret, message);
  }
  return hmacSHA256Server(secret, message);
}

/**
 * Synchronous HMAC-SHA256 — ONLY for server-side use
 */
function hmacSHA256Sync(secret: string, message: string): string {
  if (isBrowser) {
    throw new Error('hmacSHA256Sync cannot be used in browser. Use hmacSHA256 (async) instead.');
  }
  return hmacSHA256Server(secret, message);
}

/**
 * QR Code Service (Refactored for Owner-generates-Worker-scans flow)
 * Uses HMAC-SHA256 for tamper protection
 * Supports both server (Node.js crypto) and client (Web Crypto API)
 */
export class QRCodeService {
  private static readonly GPS_RADIUS_METERS = parseInt(process.env.GPS_RADIUS_METERS || '200');

  // ==========================================
  // NEW FLOW: Static Owner QR
  // ==========================================

  /**
   * Generate static QR code for an Owner (SERVER-SIDE ONLY)
   * @param ownerId - Owner user ID
   * @returns QR code as Data URL (base64 PNG image)
   */
  static async generateOwnerQR(ownerId: string): Promise<{
    qrDataUrl: string;
    qrData: string;
  }> {
    const data: OwnerQRCodeData = {
      owner_id: ownerId,
      type: 'owner_checkin',
      created_at: new Date().toISOString(),
    };

    const secret = getQRSecret();
    const dataString = JSON.stringify(data);
    const signature = await hmacSHA256(secret, dataString);

    const qrPayload = {
      ...data,
      signature,
      version: 3,
    };

    const qrString = JSON.stringify(qrPayload);

    try {
      const QRCode = (await import('qrcode')).default;
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 500,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      });

      return {
        qrDataUrl: qrCodeDataURL,
        qrData: qrString,
      };
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate Owner QR code');
    }
  }

  /**
   * Validate scanned Owner QR code (CLIENT-SIDE — Worker scans)
   * Uses async Web Crypto API for browser compatibility
   * @param qrString - Scanned QR code data
   */
  static async validateOwnerQRAsync(qrString: string): Promise<CheckinValidationResult> {
    try {
      const qrData = JSON.parse(qrString);
      const { signature, version, ...data } = qrData;

      // Validate signature using async HMAC
      let isValidSignature = false;
      try {
        const secret = getQRSecret();
        const dataString = JSON.stringify(data);
        const expectedSignature = await hmacSHA256(secret, dataString);
        if (signature === expectedSignature) {
          isValidSignature = true;
        }
      } catch (e) {
        console.error('[QR] Signature validation error:', e);
      }

      if (!isValidSignature) {
        return { valid: false, error: 'Mã QR không hợp lệ hoặc đã bị thay đổi', errorCode: 'INVALID_SIGNATURE' };
      }

      // Check mandatory fields
      if (data.type !== 'owner_checkin' || !data.owner_id) {
        return { valid: false, error: 'Dữ liệu QR không đúng định dạng nhà hàng', errorCode: 'INVALID_FORMAT' };
      }

      return {
        valid: true,
        ownerId: data.owner_id,
      };
    } catch (error) {
      return { valid: false, error: 'Định dạng QR không đúng', errorCode: 'INVALID_FORMAT' };
    }
  }

  /**
   * Validate scanned Owner QR code (SERVER-SIDE — synchronous)
   * @deprecated Use validateOwnerQRAsync for client-side validation
   */
  static validateOwnerQR(qrString: string): CheckinValidationResult {
    if (isBrowser) {
      console.warn('[QR] validateOwnerQR (sync) called in browser — this will fail! Use validateOwnerQRAsync instead.');
      return { valid: false, error: 'Internal error: sync validation not supported in browser', errorCode: 'INVALID_SIGNATURE' };
    }

    try {
      const qrData = JSON.parse(qrString);
      const { signature, version, ...data } = qrData;

      let isValidSignature = false;
      try {
        const secret = getQRSecret();
        const dataString = JSON.stringify(data);
        const expectedSignature = hmacSHA256Sync(secret, dataString);
        if (signature === expectedSignature) {
          isValidSignature = true;
        }
      } catch (e) {
        console.error('[QR] Signature validation error:', e);
      }

      if (!isValidSignature) {
        return { valid: false, error: 'Mã QR không hợp lệ hoặc đã bị thay đổi', errorCode: 'INVALID_SIGNATURE' };
      }

      if (data.type !== 'owner_checkin' || !data.owner_id) {
        return { valid: false, error: 'Dữ liệu QR không đúng định dạng nhà hàng', errorCode: 'INVALID_FORMAT' };
      }

      return {
        valid: true,
        ownerId: data.owner_id,
      };
    } catch (error) {
      return { valid: false, error: 'Định dạng QR không đúng', errorCode: 'INVALID_FORMAT' };
    }
  }

  /**
   * Validate GPS location is within allowed radius
   * @param workerLocation - Worker's GPS coordinates
   * @param restaurantLocation - Restaurant's GPS coordinates
   * @returns Whether worker is within allowed range
   */
  static validateGPSLocation(
    workerLocation: Coordinates,
    restaurantLocation: Coordinates
  ): { valid: boolean; distanceMeters: number; error?: string } {
    const distance = this.calculateDistanceMeters(workerLocation, restaurantLocation);

    if (distance > this.GPS_RADIUS_METERS) {
      return {
        valid: false,
        distanceMeters: distance,
        error: `Bạn đang cách nhà hàng ${Math.round(distance)}m. Vui lòng đến gần hơn (tối đa ${this.GPS_RADIUS_METERS}m).`,
      };
    }

    return { valid: true, distanceMeters: distance };
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  static calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371000;
    const lat1Rad = (coord1.latitude * Math.PI) / 180;
    const lat2Rad = (coord2.latitude * Math.PI) / 180;
    const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // ==========================================
  // LEGACY: Worker generates QR (deprecated)
  // Keep for backward compatibility during transition
  // ==========================================

  /**
   * @deprecated Use generateOwnerQR instead
   */
  static async generateQRCode(
    applicationId: string,
    workerId: string,
    jobId: string,
    expiresAt: Date
  ): Promise<string> {
    console.warn('[QR] generateQRCode is deprecated. Use generateOwnerQR for new flow.');

    const data = {
      application_id: applicationId,
      worker_id: workerId,
      job_id: jobId,
      expires_at: expiresAt.toISOString(),
    };

    const secret = getQRSecret();
    const signature = hmacSHA256Sync(secret, JSON.stringify(data));
    const qrData = { ...data, signature };
    const qrString = JSON.stringify(qrData);

    try {
      const QRCode = (await import('qrcode')).default;
      return await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 400,
        margin: 2,
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * @deprecated Use validateOwnerQRAsync instead
   */
  static validateQRCode(qrString: string): {
    valid: boolean;
    data?: { application_id: string; worker_id: string; job_id: string; expires_at: string };
    error?: string;
  } {
    try {
      const qrData = JSON.parse(qrString);

      if (qrData.version === 2 || qrData.version === 3) {
        return { valid: false, error: 'Use validateOwnerQRAsync for new QR codes' };
      }

      const { signature, ...data } = qrData;
      const secret = getQRSecret();

      let expectedSignature: string;
      if (isBrowser) {
        // Cannot do sync HMAC in browser — reject gracefully
        return { valid: false, error: 'Legacy QR validation not supported in browser' };
      }
      expectedSignature = hmacSHA256Sync(secret, JSON.stringify(data));

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature - QR code may be tampered' };
      }

      const expiryDate = new Date(data.expires_at);
      if (expiryDate < new Date()) {
        return { valid: false, error: 'QR code expired' };
      }

      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' };
    }
  }

  /**
   * @deprecated
   */
  static async generateQRText(
    applicationId: string,
    workerId: string,
    jobId: string,
    expiresAt: Date
  ): Promise<string> {
    const data = {
      application_id: applicationId,
      worker_id: workerId,
      job_id: jobId,
      expires_at: expiresAt.toISOString(),
    };

    const secret = getQRSecret();
    const signature = hmacSHA256Sync(secret, JSON.stringify(data));
    return JSON.stringify({ ...data, signature });
  }
}
