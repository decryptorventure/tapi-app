/**
 * Review Service
 * Manages two-way ratings between workers and owners
 * Inspired by Timee's rating and review system
 */

import { createClient } from '@/lib/supabase/client';

export interface Review {
    id: string;
    applicationId: string;
    jobId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    tags: string[];
    comment?: string;
    isPublic: boolean;
    createdAt: Date;
    // Joined data
    reviewerName?: string;
    reviewerAvatar?: string;
    revieweeName?: string;
    jobTitle?: string;
}

export interface CreateReviewInput {
    applicationId: string;
    jobId: string;
    revieweeId: string;
    rating: number;
    tags?: string[];
    comment?: string;
    isPublic?: boolean;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    topTags: Array<{ tag: string; count: number }>;
}

// Predefined tags
export const WORKER_TAGS = [
    { code: 'punctual', label: 'Đúng giờ', icon: '⏰' },
    { code: 'hardworking', label: 'Chăm chỉ', icon: '💪' },
    { code: 'friendly', label: 'Thân thiện', icon: '😊' },
    { code: 'skilled', label: 'Có kỹ năng', icon: '🎯' },
    { code: 'professional', label: 'Chuyên nghiệp', icon: '👔' },
    { code: 'communicative', label: 'Giao tiếp tốt', icon: '💬' },
    { code: 'reliable', label: 'Đáng tin cậy', icon: '🛡️' },
    { code: 'fast_learner', label: 'Học nhanh', icon: '📚' },
];

export const OWNER_TAGS = [
    { code: 'clear_instructions', label: 'Hướng dẫn rõ ràng', icon: '📋' },
    { code: 'friendly', label: 'Thân thiện', icon: '😊' },
    { code: 'fair_payment', label: 'Thanh toán đúng hẹn', icon: '💰' },
    { code: 'safe_workplace', label: 'Môi trường an toàn', icon: '🛡️' },
    { code: 'organized', label: 'Có tổ chức', icon: '📁' },
    { code: 'respectful', label: 'Tôn trọng', icon: '🤝' },
    { code: 'flexible', label: 'Linh hoạt', icon: '🔄' },
    { code: 'good_facilities', label: 'Cơ sở vật chất tốt', icon: '🏪' },
];

export const ReviewService = {
    /**
     * Create a new review
     */
    async createReview(
        reviewerId: string,
        input: CreateReviewInput
    ): Promise<{ success: boolean; review?: Review; error?: string }> {
        const supabase = createClient();

        try {
            // Check if already reviewed
            const { data: existing } = await supabase
                .from('reviews')
                .select('id')
                .eq('application_id', input.applicationId)
                .eq('reviewer_id', reviewerId)
                .single();

            if (existing) {
                return {
                    success: false,
                    error: 'Bạn đã đánh giá ca làm này rồi',
                };
            }

            // Validate rating
            if (input.rating < 1 || input.rating > 5) {
                return { success: false, error: 'Rating phải từ 1-5' };
            }

            // Create review
            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    application_id: input.applicationId,
                    job_id: input.jobId,
                    reviewer_id: reviewerId,
                    reviewee_id: input.revieweeId,
                    rating: input.rating,
                    tags: input.tags || [],
                    comment: input.comment,
                    is_public: input.isPublic ?? true,
                })
                .select()
                .single();

            if (error) throw error;

            // Notify reviewee
            await this.notifyReviewee(input.revieweeId, input.rating);

            return {
                success: true,
                review: this.mapReview(data),
            };
        } catch (error: any) {
            console.error('Create review error:', error);
            return {
                success: false,
                error: error.message || 'Có lỗi xảy ra',
            };
        }
    },

    /**
     * Get reviews for a user (received)
     */
    async getReceivedReviews(
        userId: string,
        limit: number = 20
    ): Promise<Review[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                reviewer:profiles!reviewer_id (full_name, avatar_url),
                job:jobs (title)
            `)
            .eq('reviewee_id', userId)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map((r: any) => ({
            ...this.mapReview(r),
            reviewerName: r.reviewer?.full_name,
            reviewerAvatar: r.reviewer?.avatar_url,
            jobTitle: r.job?.title,
        }));
    },

    /**
     * Get reviews given by a user
     */
    async getGivenReviews(
        userId: string,
        limit: number = 20
    ): Promise<Review[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                reviewee:profiles!reviewee_id (full_name, avatar_url),
                job:jobs (title)
            `)
            .eq('reviewer_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map((r: any) => ({
            ...this.mapReview(r),
            revieweeName: r.reviewee?.full_name,
            jobTitle: r.job?.title,
        }));
    },

    /**
     * Get review stats for a user
     */
    async getReviewStats(userId: string): Promise<ReviewStats> {
        const supabase = createClient();

        // Get all reviews
        const { data: reviews } = await supabase
            .from('reviews')
            .select('rating, tags')
            .eq('reviewee_id', userId)
            .eq('is_public', true);

        if (!reviews || reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                topTags: [],
            };
        }

        // Calculate average
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const average = Math.round((sum / reviews.length) * 10) / 10;

        // Calculate distribution
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
            distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });

        // Count tags
        const tagCounts: Record<string, number> = {};
        reviews.forEach(r => {
            (r.tags || []).forEach((tag: string) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const topTags = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            averageRating: average,
            totalReviews: reviews.length,
            ratingDistribution: distribution,
            topTags,
        };
    },

    /**
     * Check if user has reviewed an application
     */
    async hasReviewed(
        applicationId: string,
        reviewerId: string
    ): Promise<boolean> {
        const supabase = createClient();

        const { data } = await supabase
            .from('reviews')
            .select('id')
            .eq('application_id', applicationId)
            .eq('reviewer_id', reviewerId)
            .single();

        return !!data;
    },

    /**
     * Get pending reviews (applications user hasn't reviewed yet)
     */
    async getPendingReviews(userId: string): Promise<Array<{
        applicationId: string;
        jobTitle: string;
        revieweeId: string;
        revieweeName: string;
        completedAt: Date;
    }>> {
        const supabase = createClient();

        // Get user role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (!profile) return [];

        const isWorker = profile.role === 'worker';

        // Get IDs of applications already reviewed by this user
        const { data: reviewedApps } = await supabase
            .from('reviews')
            .select('application_id')
            .eq('reviewer_id', userId);

        const reviewedIds = (reviewedApps || []).map(r => r.application_id);

        // Get completed applications without review
        if (isWorker) {
            const { data } = await supabase
                .from('job_applications')
                .select(`
                    id,
                    job:jobs (title, owner_id, owner:profiles!owner_id (full_name))
                `)
                .eq('worker_id', userId)
                .eq('status', 'completed');

            if (!data) return [];

            return data
                .filter((app: any) => !reviewedIds.includes(app.id))
                .map((app: any) => ({
                    applicationId: app.id,
                    jobTitle: app.job?.title,
                    revieweeId: app.job?.owner_id,
                    revieweeName: app.job?.owner?.full_name,
                    completedAt: new Date(),
                }));
        } else {
            // Get owner's jobs first
            const { data: ownerJobs } = await supabase
                .from('jobs')
                .select('id')
                .eq('owner_id', userId);

            if (!ownerJobs || ownerJobs.length === 0) return [];

            const jobIds = ownerJobs.map(j => j.id);

            // Owner reviewing workers
            const { data } = await supabase
                .from('job_applications')
                .select(`
                    id,
                    worker_id,
                    worker:profiles!worker_id (full_name),
                    job:jobs (title)
                `)
                .eq('status', 'completed')
                .in('job_id', jobIds);

            if (!data) return [];

            return data
                .filter((app: any) => !reviewedIds.includes(app.id))
                .map((app: any) => ({
                    applicationId: app.id,
                    jobTitle: app.job?.title,
                    revieweeId: app.worker_id,
                    revieweeName: app.worker?.full_name,
                    completedAt: new Date(),
                }));
        }
    },

    /**
     * Notify reviewee about new review
     */
    async notifyReviewee(revieweeId: string, rating: number): Promise<void> {
        const supabase = createClient();

        const stars = '⭐'.repeat(rating);
        await supabase.from('notifications').insert({
            user_id: revieweeId,
            type: 'new_review',
            title: 'Đánh giá mới',
            content: `Bạn nhận được đánh giá ${stars}`,
            data: { rating },
            is_read: false,
        });
    },

    /**
     * Map database record to TypeScript type
     */
    mapReview(data: any): Review {
        return {
            id: data.id,
            applicationId: data.application_id,
            jobId: data.job_id,
            reviewerId: data.reviewer_id,
            revieweeId: data.reviewee_id,
            rating: data.rating,
            tags: data.tags || [],
            comment: data.comment,
            isPublic: data.is_public,
            createdAt: new Date(data.created_at),
        };
    },
};
