/**
 * Grade Service
 * Manages worker grade/certification levels based on performance
 * Inspired by Timee Certified Worker (Nintei Worker) system
 */

import { createUntypedClient } from '@/lib/supabase/client';

export type WorkerGrade = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface GradeInfo {
    grade: WorkerGrade;
    totalCompletedJobs: number;
    averageRating: number;
    consecutiveNoPenaltyDays: number;
    gradeUpdatedAt: Date | null;
    nextGrade: WorkerGrade | null;
    requirementsForNext: GradeRequirement | null;
}

export interface GradeRequirement {
    minJobs: number;
    minRating: number;
    minNoPenaltyDays: number;
    noShowLimit?: number;
}

export const GRADE_REQUIREMENTS: Record<WorkerGrade, GradeRequirement> = {
    bronze: { minJobs: 0, minRating: 0, minNoPenaltyDays: 0 },
    silver: { minJobs: 10, minRating: 4.0, minNoPenaltyDays: 0 },
    gold: { minJobs: 30, minRating: 4.5, minNoPenaltyDays: 30 },
    platinum: { minJobs: 100, minRating: 4.8, minNoPenaltyDays: 60, noShowLimit: 0 },
};

export const GRADE_BENEFITS: Record<WorkerGrade, string[]> = {
    bronze: ['Có thể ứng tuyển việc làm', 'Profile cơ bản'],
    silver: ['Badge Silver hiển thị', 'Ưu tiên trong kết quả tìm kiếm', 'Mở rộng bán kính việc làm'],
    gold: ['Badge Gold hiển thị', 'Instant Book cho hầu hết việc', 'Thông báo việc mới sớm hơn'],
    platinum: ['Badge Platinum hiển thị', 'Top Pick cho owners', 'Bonus 5% lương', 'Hỗ trợ ưu tiên'],
};

export const GRADE_LABELS: Record<WorkerGrade, string> = {
    bronze: 'Đồng',
    silver: 'Bạc',
    gold: 'Vàng',
    platinum: 'Bạch Kim',
};

export const GradeService = {
    /**
     * Get worker's current grade info
     */
    async getGradeInfo(workerId: string): Promise<GradeInfo | null> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('profiles')
            .select(`
                worker_grade,
                total_completed_jobs,
                average_rating,
                consecutive_no_penalty_days,
                grade_updated_at
            `)
            .eq('id', workerId)
            .eq('role', 'worker')
            .single();

        if (error || !data) return null;

        const currentGrade = (data.worker_grade || 'bronze') as WorkerGrade;
        const nextGrade = this.getNextGrade(currentGrade);
        const requirementsForNext = nextGrade ? GRADE_REQUIREMENTS[nextGrade] : null;

        return {
            grade: currentGrade,
            totalCompletedJobs: data.total_completed_jobs || 0,
            averageRating: parseFloat(data.average_rating) || 0,
            consecutiveNoPenaltyDays: data.consecutive_no_penalty_days || 0,
            gradeUpdatedAt: data.grade_updated_at ? new Date(data.grade_updated_at) : null,
            nextGrade,
            requirementsForNext,
        };
    },

    /**
     * Recalculate and update worker grade
     */
    async recalculateGrade(workerId: string): Promise<WorkerGrade> {
        const supabase = createUntypedClient();

        // Call the database function
        const { data, error } = await supabase.rpc('calculate_worker_grade', {
            p_user_id: workerId,
        });

        if (error) {
            console.error('Calculate grade error:', error);
            return 'bronze';
        }

        return (data as WorkerGrade) || 'bronze';
    },

    /**
     * Update worker stats (completed jobs, rating)
     */
    async updateStats(workerId: string): Promise<void> {
        const supabase = createUntypedClient();

        await supabase.rpc('update_worker_stats', {
            p_user_id: workerId,
        });
    },

    /**
     * Get next grade level
     */
    getNextGrade(currentGrade: WorkerGrade): WorkerGrade | null {
        const order: WorkerGrade[] = ['bronze', 'silver', 'gold', 'platinum'];
        const currentIndex = order.indexOf(currentGrade);
        return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
    },

    /**
     * Calculate progress towards next grade
     */
    getProgressToNextGrade(info: GradeInfo): {
        jobsProgress: number;
        ratingProgress: number;
        noPenaltyProgress: number;
        overallProgress: number;
    } | null {
        if (!info.nextGrade || !info.requirementsForNext) return null;

        const req = info.requirementsForNext;
        const jobs = Math.min(100, (info.totalCompletedJobs / req.minJobs) * 100);
        const rating = Math.min(100, (info.averageRating / req.minRating) * 100);
        const penalty = req.minNoPenaltyDays > 0
            ? Math.min(100, (info.consecutiveNoPenaltyDays / req.minNoPenaltyDays) * 100)
            : 100;

        return {
            jobsProgress: jobs,
            ratingProgress: rating,
            noPenaltyProgress: penalty,
            overallProgress: (jobs + rating + penalty) / 3,
        };
    },

    /**
     * Check if worker meets minimum grade for a job
     */
    meetsGradeRequirement(workerGrade: WorkerGrade, requiredGrade: WorkerGrade): boolean {
        const order: WorkerGrade[] = ['bronze', 'silver', 'gold', 'platinum'];
        return order.indexOf(workerGrade) >= order.indexOf(requiredGrade);
    },

    /**
     * Get grade-based bonus multiplier
     */
    getBonusMultiplier(grade: WorkerGrade): number {
        switch (grade) {
            case 'platinum': return 1.05; // 5% bonus
            case 'gold': return 1.02; // 2% bonus
            default: return 1.0;
        }
    },

    /**
     * Reset penalty days counter (called when penalty applied)
     */
    async resetNoPenaltyDays(workerId: string): Promise<void> {
        const supabase = createUntypedClient();

        await supabase
            .from('profiles')
            .update({
                consecutive_no_penalty_days: 0,
                last_penalty_at: new Date().toISOString(),
            })
            .eq('id', workerId);

        // Recalculate grade
        await this.recalculateGrade(workerId);
    },

    /**
     * Increment no-penalty days (called daily by cron or after job completion)
     */
    async incrementNoPenaltyDays(workerId: string): Promise<void> {
        const supabase = createUntypedClient();

        await supabase.rpc('increment', {
            row_id: workerId,
            table_name: 'profiles',
            column_name: 'consecutive_no_penalty_days',
        }).then(() => {
            // Recalculate grade after increment
            this.recalculateGrade(workerId);
        });
    },
};
