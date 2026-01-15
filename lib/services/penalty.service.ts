import { createUntypedClient } from '@/lib/supabase/client';

/**
 * Penalty reasons and their score impacts
 * Based on Timee model, adjusted for Vietnam market
 */
export enum PenaltyReason {
    // Negative impacts
    NO_SHOW = 'no_show', // -20 points, ban after 3 times
    LATE_CANCEL_3H = 'late_cancel_3h', // -7 points
    LATE_CANCEL_12H = 'late_cancel_12h', // -5 points
    LATE_CANCEL_24H = 'late_cancel_24h', // -2 points
    LATE_CHECKIN = 'late_checkin', // -3 points
    EARLY_CHECKOUT = 'early_checkout', // -2 points
    OWNER_COMPLAINT = 'owner_complaint', // -5 points

    // Positive impacts
    COMPLETION = 'completion', // +1 point
    EXCELLENT_REVIEW = 'excellent_review', // +2 points (5-star)
    ON_TIME_STREAK = 'on_time_streak', // +3 points (5 consecutive on-time)
    RECOVERY = 'recovery', // +1 point per completed job after penalty
}

/**
 * Score changes for each penalty reason
 */
export const PENALTY_SCORES: Record<PenaltyReason, number> = {
    [PenaltyReason.NO_SHOW]: -20,
    [PenaltyReason.LATE_CANCEL_3H]: -7,
    [PenaltyReason.LATE_CANCEL_12H]: -5,
    [PenaltyReason.LATE_CANCEL_24H]: -2,
    [PenaltyReason.LATE_CHECKIN]: -3,
    [PenaltyReason.EARLY_CHECKOUT]: -2,
    [PenaltyReason.OWNER_COMPLAINT]: -5,
    [PenaltyReason.COMPLETION]: 1,
    [PenaltyReason.EXCELLENT_REVIEW]: 2,
    [PenaltyReason.ON_TIME_STREAK]: 3,
    [PenaltyReason.RECOVERY]: 1,
};

/**
 * Human-readable labels for penalty reasons
 */
export const PENALTY_LABELS: Record<PenaltyReason, string> = {
    [PenaltyReason.NO_SHOW]: 'Không đến làm (No-show)',
    [PenaltyReason.LATE_CANCEL_3H]: 'Hủy gấp (dưới 3 giờ)',
    [PenaltyReason.LATE_CANCEL_12H]: 'Hủy muộn (dưới 12 giờ)',
    [PenaltyReason.LATE_CANCEL_24H]: 'Hủy cận ca (dưới 24 giờ)',
    [PenaltyReason.LATE_CHECKIN]: 'Check-in muộn',
    [PenaltyReason.EARLY_CHECKOUT]: 'Check-out sớm',
    [PenaltyReason.OWNER_COMPLAINT]: 'Khiếu nại từ chủ quán',
    [PenaltyReason.COMPLETION]: 'Hoàn thành ca làm',
    [PenaltyReason.EXCELLENT_REVIEW]: 'Đánh giá xuất sắc',
    [PenaltyReason.ON_TIME_STREAK]: 'Đúng giờ 5 lần liên tiếp',
    [PenaltyReason.RECOVERY]: 'Phục hồi điểm tin cậy',
};

/**
 * Freeze status for workers
 */
export interface FreezeStatus {
    isFrozen: boolean;
    freezeUntil: Date | null;
    freezeReason: string | null;
    noShowCount: number;
    canApply: boolean;
}

/**
 * Penalty history entry
 */
export interface PenaltyHistoryEntry {
    id: string;
    scoreChange: number;
    previousScore: number;
    newScore: number;
    reason: PenaltyReason;
    reasonLabel: string;
    relatedJobTitle?: string;
    createdAt: Date;
}

/**
 * Penalty Service
 * Manages worker reliability scores and penalty system
 */
export class PenaltyService {
    /**
     * Apply a penalty or bonus to a worker's reliability score
     */
    static async applyPenalty(
        userId: string,
        reason: PenaltyReason,
        jobId?: string,
        applicationId?: string
    ): Promise<{ success: boolean; newScore: number; error?: string }> {
        const supabase = createUntypedClient();
        const scoreChange = PENALTY_SCORES[reason];

        try {
            // Get current score
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('reliability_score')
                .eq('id', userId)
                .single();

            if (profileError || !profile) {
                return { success: false, newScore: 0, error: 'User not found' };
            }

            const previousScore = profile.reliability_score || 100;
            const newScore = Math.max(0, Math.min(100, previousScore + scoreChange));

            // Update profile score
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ reliability_score: newScore })
                .eq('id', userId);

            if (updateError) {
                return { success: false, newScore: previousScore, error: updateError.message };
            }

            // Record in history
            await supabase.from('reliability_history').insert({
                user_id: userId,
                score_change: scoreChange,
                previous_score: previousScore,
                new_score: newScore,
                reason: reason,
                related_job_id: jobId,
                related_application_id: applicationId,
            });

            // Check for no-show ban (3 no-shows = permanent ban)
            if (reason === PenaltyReason.NO_SHOW) {
                await this.checkAndApplyNoShowBan(userId);
            }

            return { success: true, newScore };
        } catch (error: any) {
            console.error('Penalty apply error:', error);
            return { success: false, newScore: 0, error: error.message };
        }
    }

    /**
     * Check if worker should be banned for too many no-shows
     */
    static async checkAndApplyNoShowBan(userId: string): Promise<void> {
        const supabase = createUntypedClient();

        // Count no-shows in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: noShows } = await supabase
            .from('reliability_history')
            .select('id')
            .eq('user_id', userId)
            .eq('reason', PenaltyReason.NO_SHOW)
            .gte('created_at', thirtyDaysAgo.toISOString());

        if (noShows && noShows.length >= 3) {
            // Set score to 0 (permanent ban)
            await supabase
                .from('profiles')
                .update({
                    reliability_score: 0,
                    is_frozen: true,
                    freeze_until: null, // Permanent
                    freeze_reason: 'no_show_ban_3x',
                })
                .eq('id', userId);
        }
    }

    /**
     * Get freeze status for a worker
     */
    static async getFreezeStatus(userId: string): Promise<FreezeStatus> {
        const supabase = createUntypedClient();

        try {
            // Get profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('reliability_score, is_frozen, freeze_until, freeze_reason')
                .eq('id', userId)
                .single();

            // Count no-shows
            const { data: noShows } = await supabase
                .from('reliability_history')
                .select('id')
                .eq('user_id', userId)
                .eq('reason', PenaltyReason.NO_SHOW);

            const isFrozen = profile?.is_frozen || false;
            const freezeUntil = profile?.freeze_until ? new Date(profile.freeze_until) : null;

            // Check if freeze has expired
            if (freezeUntil && freezeUntil < new Date()) {
                // Unfreeze automatically
                await supabase
                    .from('profiles')
                    .update({ is_frozen: false, freeze_until: null, freeze_reason: null })
                    .eq('id', userId);

                return {
                    isFrozen: false,
                    freezeUntil: null,
                    freezeReason: null,
                    noShowCount: noShows?.length || 0,
                    canApply: (profile?.reliability_score || 0) > 0,
                };
            }

            return {
                isFrozen,
                freezeUntil,
                freezeReason: profile?.freeze_reason,
                noShowCount: noShows?.length || 0,
                canApply: !isFrozen && (profile?.reliability_score || 0) > 0,
            };
        } catch (error) {
            console.error('Get freeze status error:', error);
            return {
                isFrozen: false,
                freezeUntil: null,
                freezeReason: null,
                noShowCount: 0,
                canApply: true,
            };
        }
    }

    /**
     * Get penalty history for a worker
     */
    static async getPenaltyHistory(
        userId: string,
        limit: number = 20
    ): Promise<PenaltyHistoryEntry[]> {
        const supabase = createUntypedClient();

        try {
            const { data, error } = await supabase
                .from('reliability_history')
                .select(`
          id,
          score_change,
          previous_score,
          new_score,
          reason,
          created_at,
          related_job_id,
          job:jobs(title)
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error || !data) return [];

            return data.map((entry: any) => ({
                id: entry.id,
                scoreChange: entry.score_change,
                previousScore: entry.previous_score,
                newScore: entry.new_score,
                reason: entry.reason as PenaltyReason,
                reasonLabel: PENALTY_LABELS[entry.reason as PenaltyReason] || entry.reason,
                relatedJobTitle: entry.job?.title,
                createdAt: new Date(entry.created_at),
            }));
        } catch (error) {
            console.error('Get penalty history error:', error);
            return [];
        }
    }

    /**
     * Apply recovery bonus after completing a job (for workers with low score)
     */
    static async applyRecoveryBonus(
        userId: string,
        jobId: string,
        applicationId: string
    ): Promise<void> {
        const supabase = createUntypedClient();

        // Get current score
        const { data: profile } = await supabase
            .from('profiles')
            .select('reliability_score')
            .eq('id', userId)
            .single();

        // Only apply recovery bonus if score is below 90
        if (profile && profile.reliability_score < 90) {
            await this.applyPenalty(userId, PenaltyReason.RECOVERY, jobId, applicationId);
        }
    }

    /**
     * Calculate hours until shift for cancellation penalty
     */
    static getCancellationPenalty(shiftDate: Date, shiftTime: string): PenaltyReason {
        const now = new Date();
        const [hours, minutes] = shiftTime.split(':').map(Number);
        const shiftStart = new Date(shiftDate);
        shiftStart.setHours(hours, minutes, 0, 0);

        const hoursUntilShift = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilShift < 3) {
            return PenaltyReason.LATE_CANCEL_3H;
        } else if (hoursUntilShift < 12) {
            return PenaltyReason.LATE_CANCEL_12H;
        } else if (hoursUntilShift < 24) {
            return PenaltyReason.LATE_CANCEL_24H;
        }

        // No penalty if cancelled more than 24h before
        return PenaltyReason.COMPLETION; // Neutral, won't apply negative
    }

    /**
     * Check if worker can apply for a job based on score
     */
    static async canApplyForJob(
        userId: string,
        minReliabilityScore: number
    ): Promise<{ canApply: boolean; currentScore: number; reason?: string }> {
        const supabase = createUntypedClient();

        const { data: profile } = await supabase
            .from('profiles')
            .select('reliability_score, is_frozen')
            .eq('id', userId)
            .single();

        if (!profile) {
            return { canApply: false, currentScore: 0, reason: 'Profile not found' };
        }

        if (profile.is_frozen) {
            return { canApply: false, currentScore: profile.reliability_score, reason: 'Tài khoản đang bị tạm khóa' };
        }

        if (profile.reliability_score < minReliabilityScore) {
            return {
                canApply: false,
                currentScore: profile.reliability_score,
                reason: `Điểm tin cậy cần tối thiểu ${minReliabilityScore} (hiện tại: ${profile.reliability_score})`,
            };
        }

        return { canApply: true, currentScore: profile.reliability_score };
    }
}
