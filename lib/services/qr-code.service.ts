import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * QR Code data structure for job check-in (NEW FLOW)
 * Owner generates QR per job → Worker scans to check-in
 */
interface JobQRCodeData {
  job_id: string;
  owner_id: string;
  secret_key: string;
  created_at: string;
}

/**
 * Check-in validation result
 */
interface CheckinValidationResult {
  valid: boolean;
  jobId?: string;
  ownerId?: string;
  error?: string;
  errorCode?: 'INVALID_FORMAT' | 'INVALID_SIGNATURE' | 'EXPIRED' | 'GPS_OUT_OF_RANGE' | 'NOT_APPROVED' | 'ALREADY_CHECKED_IN';
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
  // NEW FLOW: Owner generates QR for Job
  // ==========================================

  /**
   * Generate QR code for a job (Owner side)
   * @param jobId - Job ID
   * @param ownerId - Owner user ID
   * @returns QR code as Data URL (base64 PNG image)
   */
  static async generateJobQR(jobId: string, ownerId: string): Promise<{
    qrDataUrl: string;
    qrData: string;
    secretKey: string;
  }> {
    const secretKey = crypto.randomBytes(16).toString('hex');

    const data: JobQRCodeData = {
      job_id: jobId,
      owner_id: ownerId,
      secret_key: secretKey,
      created_at: new Date().toISOString(),
    };

    // Generate signature for tamper protection
    const signature = this.generateJobQRSignature(data);
    const qrPayload = {
      ...data,
      signature,
      version: 2, // New flow version
    };

    const qrString = JSON.stringify(qrPayload);

    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 400,
        margin: 2,
        color: {
          dark: '#1e293b', // slate-800
          light: '#ffffff',
        },
      });

      return {
        qrDataUrl: qrCodeDataURL,
        qrData: qrString,
        secretKey,
      };
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate scanned QR code (Worker side)
   * @param qrString - Scanned QR code data
   * @param expectedSecretKey - Secret key from database to verify
   */
  static validateJobQR(qrString: string, expectedSecretKey?: string): CheckinValidationResult {
    try {
      const qrData = JSON.parse(qrString);

      // Check version (new flow uses version 2)
      if (qrData.version !== 2) {
        return { valid: false, error: 'QR code phiên bản cũ, vui lòng liên hệ quản lý', errorCode: 'INVALID_FORMAT' };
      }

      const { signature, version, ...data } = qrData;

      // Verify signature
      const expectedSignature = this.generateJobQRSignature(data);
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Mã QR không hợp lệ', errorCode: 'INVALID_SIGNATURE' };
      }

      // Verify secret key if provided
      if (expectedSecretKey && data.secret_key !== expectedSecretKey) {
        return { valid: false, error: 'Mã QR không khớp với job', errorCode: 'INVALID_SIGNATURE' };
      }

      return {
        valid: true,
        jobId: data.job_id,
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
   * Generate HMAC-SHA256 signature for job QR data
   */
  private static generateJobQRSignature(data: JobQRCodeData): string {
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
