import { createUntypedClient } from '@/lib/supabase/client';

/**
 * Verification Service
 * Handles document upload and verification for identity and business licenses
 */
export class VerificationService {
  /**
   * Upload identity documents (ID card/passport front and back)
   * @param userId - User ID
   * @param frontFile - Front image file
   * @param backFile - Back image file
   * @param idNumber - Optional ID number
   * @param issueDate - Optional issue date
   * @returns Success status and error message if failed
   */
  static async uploadIdentityDocuments(
    userId: string,
    frontFile: File,
    backFile: File,
    idNumber?: string,
    issueDate?: Date
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createUntypedClient();

    try {
      // Upload front image
      const frontPath = `identity/${userId}/front-${Date.now()}.jpg`;
      const { error: frontError } = await supabase.storage
        .from('verifications')
        .upload(frontPath, frontFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (frontError) {
        console.error('Front image upload error:', frontError);
        throw new Error('Lỗi tải ảnh mặt trước');
      }

      // Upload back image
      const backPath = `identity/${userId}/back-${Date.now()}.jpg`;
      const { error: backError } = await supabase.storage
        .from('verifications')
        .upload(backPath, backFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (backError) {
        console.error('Back image upload error:', backError);
        throw new Error('Lỗi tải ảnh mặt sau');
      }

      // Get public URLs
      const { data: frontUrl } = supabase.storage
        .from('verifications')
        .getPublicUrl(frontPath);

      const { data: backUrl } = supabase.storage
        .from('verifications')
        .getPublicUrl(backPath);

      // Insert verification record
      const { error: insertError } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: userId,
          id_front_url: frontUrl.publicUrl,
          id_back_url: backUrl.publicUrl,
          id_number: idNumber || null,
          issue_date: issueDate || null,
          status: 'pending',
        });

      if (insertError) {
        console.error('Insert verification error:', insertError);
        throw new Error('Lỗi lưu thông tin xác thực');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Identity upload error:', error);
      return {
        success: false,
        error: error.message || 'Lỗi tải lên tài liệu',
      };
    }
  }

  /**
   * Upload business license document
   * @param ownerId - Owner user ID
   * @param licenseFile - Business license image/PDF file
   * @param licenseNumber - Business license number
   * @returns Success status and error message if failed
   */
  static async uploadBusinessLicense(
    ownerId: string,
    licenseFile: File,
    licenseNumber: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createUntypedClient();

    try {
      // Upload license file
      const fileExtension = licenseFile.name.split('.').pop() || 'jpg';
      const licensePath = `business/${ownerId}/license-${Date.now()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(licensePath, licenseFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('License upload error:', uploadError);
        throw new Error('Lỗi tải giấy phép');
      }

      // Get public URL
      const { data: licenseUrl } = supabase.storage
        .from('verifications')
        .getPublicUrl(licensePath);

      // Insert verification record
      const { error: insertError } = await supabase
        .from('business_verifications')
        .insert({
          owner_id: ownerId,
          license_url: licenseUrl.publicUrl,
          license_number: licenseNumber,
          status: 'pending',
        });

      if (insertError) {
        console.error('Insert business verification error:', insertError);
        throw new Error('Lỗi lưu thông tin giấy phép');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Business license upload error:', error);
      return {
        success: false,
        error: error.message || 'Lỗi tải lên giấy phép',
      };
    }
  }

  /**
   * Get verification status for user
   * @param userId - User ID
   * @param type - Verification type ('identity' or 'business')
   * @returns Verification record or null
   */
  static async getVerificationStatus(
    userId: string,
    type: 'identity' | 'business'
  ) {
    const supabase = createUntypedClient();

    if (type === 'identity') {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Get identity verification error:', error);
        return null;
      }

      return data;
    } else {
      const { data, error } = await supabase
        .from('business_verifications')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Get business verification error:', error);
        return null;
      }

      return data;
    }
  }

  /**
   * Check if user has verified identity
   * @param userId - User ID
   * @returns True if identity is verified
   */
  static async isIdentityVerified(userId: string): Promise<boolean> {
    const verification = await this.getVerificationStatus(userId, 'identity');
    return verification?.status === 'verified';
  }

  /**
   * Check if owner has verified business license
   * @param ownerId - Owner user ID
   * @returns True if business is verified
   */
  static async isBusinessVerified(ownerId: string): Promise<boolean> {
    const verification = await this.getVerificationStatus(ownerId, 'business');
    return verification?.status === 'verified';
  }
}
