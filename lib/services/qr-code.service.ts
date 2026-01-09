import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * QR Code data structure for job check-in
 */
interface QRCodeData {
  application_id: string;
  worker_id: string;
  job_id: string;
  expires_at: string;
  signature: string;
}

/**
 * QR Code Service
 * Generates and validates secure QR codes for job check-in
 * Uses HMAC-SHA256 for tamper protection
 */
export class QRCodeService {
  private static readonly SECRET = process.env.QR_SECRET || 'default-secret-change-in-production';

  /**
   * Generate QR code for job check-in
   * @param applicationId - Job application ID
   * @param workerId - Worker user ID
   * @param jobId - Job ID
   * @param expiresAt - Expiration date (typically shift_start_time + 1 hour)
   * @returns QR code as Data URL (base64 PNG image)
   */
  static async generateQRCode(
    applicationId: string,
    workerId: string,
    jobId: string,
    expiresAt: Date
  ): Promise<string> {
    const data: Omit<QRCodeData, 'signature'> = {
      application_id: applicationId,
      worker_id: workerId,
      job_id: jobId,
      expires_at: expiresAt.toISOString(),
    };

    // Generate HMAC signature for tamper protection
    const signature = this.generateSignature(data);

    const qrData: QRCodeData = { ...data, signature };
    const qrString = JSON.stringify(qrData);

    // Generate QR code as Data URL (base64 PNG)
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 400,
        margin: 2,
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate QR code data
   * Checks signature integrity and expiration
   * @param qrString - QR code data as JSON string
   * @returns Validation result with data or error message
   */
  static validateQRCode(qrString: string): {
    valid: boolean;
    data?: Omit<QRCodeData, 'signature'>;
    error?: string;
  } {
    try {
      // Parse QR data
      const qrData: QRCodeData = JSON.parse(qrString);
      const { signature, ...data } = qrData;

      // Verify signature
      const expectedSignature = this.generateSignature(data);
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature - QR code may be tampered' };
      }

      // Check expiry
      const expiryDate = new Date(data.expires_at);
      if (expiryDate < new Date()) {
        return { valid: false, error: 'QR code expired' };
      }

      // All checks passed
      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' };
    }
  }

  /**
   * Generate HMAC-SHA256 signature for QR data
   * @private
   */
  private static generateSignature(
    data: Omit<QRCodeData, 'signature'>
  ): string {
    const dataString = JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.SECRET)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Generate QR code as raw text (for testing/debugging)
   */
  static async generateQRText(
    applicationId: string,
    workerId: string,
    jobId: string,
    expiresAt: Date
  ): Promise<string> {
    const data: Omit<QRCodeData, 'signature'> = {
      application_id: applicationId,
      worker_id: workerId,
      job_id: jobId,
      expires_at: expiresAt.toISOString(),
    };

    const signature = this.generateSignature(data);
    const qrData: QRCodeData = { ...data, signature };

    return JSON.stringify(qrData);
  }
}
