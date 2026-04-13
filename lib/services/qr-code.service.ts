import crypto from 'crypto';
import QRCode from 'qrcode';

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

/**
 * QR Code Service (Refactored for Owner-generates-Worker-scans flow)
 * Uses HMAC-SHA256 for tamper protection
 */
export class QRCodeService {
  private static readonly SECRET = process.env.QR_SECRET || 'default-secret-change-in-production';
  private static readonly GPS_RADIUS_METERS = parseInt(process.env.GPS_RADIUS_METERS || '200');

  /**
   * Validate QR_SECRET is properly configured
   */
  private static validateSecret(): void {
    const secret = process.env.QR_SECRET;
    if (!secret || secret === 'default-secret-change-in-production') {
      const message = '[QR] CRITICAL: QR_SECRET not set or using default value';
      console.error(message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('QR_SECRET must be configured in production');
      }
    }
  }

  private static secretValidated = false;
  private static ensureSecretValidated(): void {
    if (!this.secretValidated && typeof window === 'undefined') {
      this.validateSecret();
      this.secretValidated = true;
    }
  }

  // ==========================================
  // NEW FLOW: Static Owner QR
  // ==========================================

  /**
   * Generate static QR code for an Owner
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

    // Generate signature for tamper protection
    const signature = this.generateOwnerQRSignature(data);
    const qrPayload = {
      ...data,
      signature,
      version: 3, // Version 3 for Owner-level static QR
    };

    const qrString = JSON.stringify(qrPayload);

    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 500,
        margin: 2,
        color: {
          dark: '#1e293b', // slate-800
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
   * Validate scanned Owner QR code (Worker side)
   * @param qrString - Scanned QR code data
   */
  static validateOwnerQR(qrString: string): CheckinValidationResult {
    try {
      const qrData = JSON.parse(qrString);

      // Check signature first
      const { signature, version, ...data } = qrData;

      let isValidSignature = false;
      try {
        const expectedSignature = this.generateOwnerQRSignature(data as any);
        if (signature === expectedSignature) {
          isValidSignature = true;
        }
      } catch (e) { }

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
    const R = 6371000; // Earth's radius in meters
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

  /**
   * Generate HMAC-SHA256 signature for Owner QR data
   */
  private static generateOwnerQRSignature(data: OwnerQRCodeData): string {
    this.ensureSecretValidated();
    const dataString = JSON.stringify(data);
    return crypto.createHmac('sha256', this.SECRET).update(dataString).digest('hex');
  }

  // ==========================================
  // LEGACY: Worker generates QR (deprecated)
  // Keep for backward compatibility during transition
  // ==========================================

  /**
   * @deprecated Use generateJobQR instead
   */
  static async generateQRCode(
    applicationId: string,
    workerId: string,
    jobId: string,
    expiresAt: Date
  ): Promise<string> {
    console.warn('[QR] generateQRCode is deprecated. Use generateJobQR for new flow.');

    const data = {
      application_id: applicationId,
      worker_id: workerId,
      job_id: jobId,
      expires_at: expiresAt.toISOString(),
    };

    const signature = this.generateLegacySignature(data);
    const qrData = { ...data, signature };
    const qrString = JSON.stringify(qrData);

    try {
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
   * @deprecated Use validateJobQR instead
   */
  static validateQRCode(qrString: string): {
    valid: boolean;
    data?: { application_id: string; worker_id: string; job_id: string; expires_at: string };
    error?: string;
  } {
    try {
      const qrData = JSON.parse(qrString);

      // New flow QR codes have version field
      if (qrData.version === 2) {
        return { valid: false, error: 'Use validateJobQR for new QR codes' };
      }

      const { signature, ...data } = qrData;
      const expectedSignature = this.generateLegacySignature(data);

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

  private static generateLegacySignature(data: Record<string, any>): string {
    this.ensureSecretValidated();
    const dataString = JSON.stringify(data);
    return crypto.createHmac('sha256', this.SECRET).update(dataString).digest('hex');
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

    const signature = this.generateLegacySignature(data);
    return JSON.stringify({ ...data, signature });
  }
}
