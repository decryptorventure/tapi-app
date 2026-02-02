/**
 * Storage Service
 * Centralized file upload handling with comprehensive error management
 */

import { createUntypedClient } from '@/lib/supabase/client';

// Bucket configuration
export const STORAGE_BUCKETS = {
    avatars: {
        name: 'avatars',
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        path: (userId: string) => `avatars/${userId}`,
    },
    videos: {
        name: 'videos',
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        path: (userId: string) => `videos/${userId}`,
    },
    restaurants: {
        name: 'restaurants',
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        path: (userId: string) => `restaurants/${userId}`,
    },
    verifications: {
        name: 'verifications',
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        path: (userId: string) => `verifications/${userId}`,
    },
    jobs: {
        name: 'jobs',
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        path: (userId: string) => `jobs/${userId}`,
    },
} as const;

export type BucketName = keyof typeof STORAGE_BUCKETS;

// Error types
export type StorageErrorCode =
    | 'FILE_TOO_LARGE'
    | 'INVALID_FILE_TYPE'
    | 'BUCKET_NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'NETWORK_ERROR'
    | 'STORAGE_FULL'
    | 'UNKNOWN_ERROR';

export interface StorageError {
    code: StorageErrorCode;
    message: string;
    details?: string;
}

export interface UploadResult {
    success: boolean;
    url?: string;
    path?: string;
    error?: StorageError;
}

/**
 * Get user-friendly error message for storage errors
 */
function getErrorMessage(error: any, bucket: BucketName): StorageError {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorStatus = error?.statusCode || error?.status;

    // Bucket doesn't exist
    if (errorMessage.includes('bucket') && errorMessage.includes('not found')) {
        return {
            code: 'BUCKET_NOT_FOUND',
            message: 'Hệ thống lưu trữ chưa được cấu hình. Vui lòng liên hệ hỗ trợ.',
            details: `Bucket "${bucket}" chưa tồn tại`,
        };
    }

    // Permission denied / RLS policy
    if (errorMessage.includes('policy') || errorMessage.includes('permission') || errorStatus === 403) {
        return {
            code: 'PERMISSION_DENIED',
            message: 'Bạn không có quyền tải lên file này.',
            details: error.message,
        };
    }

    // Storage quota exceeded
    if (errorMessage.includes('quota') || errorMessage.includes('storage')) {
        return {
            code: 'STORAGE_FULL',
            message: 'Dung lượng lưu trữ đã đầy. Vui lòng xóa bớt file cũ.',
            details: error.message,
        };
    }

    // Network error
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || !navigator.onLine) {
        return {
            code: 'NETWORK_ERROR',
            message: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.',
            details: error.message,
        };
    }

    // Unknown error
    return {
        code: 'UNKNOWN_ERROR',
        message: 'Có lỗi xảy ra khi tải lên. Vui lòng thử lại sau.',
        details: error.message,
    };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate file before upload
 */
function validateFile(
    file: File,
    bucket: BucketName
): StorageError | null {
    const config = STORAGE_BUCKETS[bucket];

    // Check file size
    if (file.size > config.maxSize) {
        return {
            code: 'FILE_TOO_LARGE',
            message: `File quá lớn. Kích thước tối đa là ${formatFileSize(config.maxSize)}.`,
            details: `File size: ${formatFileSize(file.size)}`,
        };
    }

    // Check file type
    if (!(config.allowedTypes as readonly string[]).includes(file.type)) {
        const allowedExts = config.allowedTypes
            .map(t => t.split('/')[1].toUpperCase())
            .join(', ');
        return {
            code: 'INVALID_FILE_TYPE',
            message: `Định dạng file không hợp lệ. Chấp nhận: ${allowedExts}`,
            details: `File type: ${file.type}`,
        };
    }

    return null;
}

/**
 * Storage Service
 */
export const StorageService = {
    /**
     * Upload a file to storage
     * @param bucket - Target bucket name
     * @param file - File to upload
     * @param userId - User ID for path generation
     * @param customPath - Optional custom file path
     * @returns Upload result with URL or error
     */
    async upload(
        bucket: BucketName,
        file: File,
        userId: string,
        customPath?: string
    ): Promise<UploadResult> {
        // Validate file
        const validationError = validateFile(file, bucket);
        if (validationError) {
            return { success: false, error: validationError };
        }

        const supabase = createUntypedClient();
        const config = STORAGE_BUCKETS[bucket];

        // Generate file path
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = customPath || `${config.path(userId)}/${fileName}`;

        try {
            // Check if bucket exists by trying to list (lightweight check)
            const { error: listError } = await supabase.storage
                .from(config.name)
                .list('', { limit: 1 });

            if (listError && listError.message.includes('not found')) {
                return {
                    success: false,
                    error: {
                        code: 'BUCKET_NOT_FOUND',
                        message: `Bucket "${config.name}" chưa được tạo. Vui lòng liên hệ admin.`,
                    },
                };
            }

            // Upload file
            const { error: uploadError } = await supabase.storage
                .from(config.name)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                return {
                    success: false,
                    error: getErrorMessage(uploadError, bucket),
                };
            }

            // Get public URL
            const { data } = supabase.storage
                .from(config.name)
                .getPublicUrl(filePath);

            return {
                success: true,
                url: data.publicUrl,
                path: filePath,
            };
        } catch (error: any) {
            console.error(`Storage upload error [${bucket}]:`, error);
            return {
                success: false,
                error: getErrorMessage(error, bucket),
            };
        }
    },

    /**
     * Upload with retry logic
     * @param bucket - Target bucket name
     * @param file - File to upload
     * @param userId - User ID
     * @param maxRetries - Maximum retry attempts (default 3)
     */
    async uploadWithRetry(
        bucket: BucketName,
        file: File,
        userId: string,
        maxRetries = 3
    ): Promise<UploadResult> {
        let lastError: StorageError | undefined;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const result = await this.upload(bucket, file, userId);

            if (result.success) {
                return result;
            }

            lastError = result.error;

            // Don't retry for validation errors
            if (
                lastError?.code === 'FILE_TOO_LARGE' ||
                lastError?.code === 'INVALID_FILE_TYPE' ||
                lastError?.code === 'PERMISSION_DENIED' ||
                lastError?.code === 'BUCKET_NOT_FOUND'
            ) {
                return result;
            }

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        return {
            success: false,
            error: lastError || {
                code: 'UNKNOWN_ERROR',
                message: 'Không thể upload file sau nhiều lần thử.',
            },
        };
    },

    /**
     * Delete a file from storage
     */
    async delete(bucket: BucketName, filePath: string): Promise<{ success: boolean; error?: string }> {
        const supabase = createUntypedClient();
        const config = STORAGE_BUCKETS[bucket];

        try {
            const { error } = await supabase.storage
                .from(config.name)
                .remove([filePath]);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get bucket configuration
     */
    getBucketConfig(bucket: BucketName) {
        return STORAGE_BUCKETS[bucket];
    },

    /**
     * Check if bucket exists
     */
    async checkBucketExists(bucket: BucketName): Promise<boolean> {
        const supabase = createUntypedClient();
        const config = STORAGE_BUCKETS[bucket];

        try {
            const { error } = await supabase.storage
                .from(config.name)
                .list('', { limit: 1 });

            return !error;
        } catch {
            return false;
        }
    },
};
