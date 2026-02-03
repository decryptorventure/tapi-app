/**
 * Badge Service
 * Manages worker achievement badges and skill recognition
 * Inspired by Timee Badge system for skill/experience visibility
 */

import { createUntypedClient } from '@/lib/supabase/client';

export interface Badge {
    id: string;
    code: string;
    nameVi: string;
    nameEn?: string;
    descriptionVi?: string;
    descriptionEn?: string;
    icon: string;
    category: 'achievement' | 'skill' | 'loyalty' | 'special';
    criteria?: Record<string, any>;
}

export interface WorkerBadge {
    id: string;
    badgeId: string;
    workerId: string;
    earnedAt: Date;
    relatedJobId?: string;
    badge: Badge;
}

export const BadgeService = {
    /**
     * Get all available badges
     */
    async getAllBadges(): Promise<Badge[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('badges')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error || !data) return [];

        return data.map(this.mapBadge);
    },

    /**
     * Get badges by category
     */
    async getBadgesByCategory(category: string): Promise<Badge[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('badges')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('sort_order');

        if (error || !data) return [];

        return data.map(this.mapBadge);
    },

    /**
     * Get worker's earned badges
     */
    async getWorkerBadges(workerId: string): Promise<WorkerBadge[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('worker_badges')
            .select(`
                id,
                worker_id,
                badge_id,
                earned_at,
                related_job_id,
                badge:badges (*)
            `)
            .eq('worker_id', workerId)
            .order('earned_at', { ascending: false });

        if (error || !data) return [];

        return data.map((wb: any) => ({
            id: wb.id,
            workerId: wb.worker_id,
            badgeId: wb.badge_id,
            earnedAt: new Date(wb.earned_at),
            relatedJobId: wb.related_job_id,
            badge: this.mapBadge(wb.badge),
        }));
    },

    /**
     * Check and award eligible badges to worker
     */
    async checkAndAwardBadges(workerId: string): Promise<{
        newBadges: Badge[];
        totalBadges: number;
    }> {
        const supabase = createUntypedClient();

        // Get worker stats
        const { data: profile } = await supabase
            .from('profiles')
            .select('total_completed_jobs, average_rating')
            .eq('id', workerId)
            .single();

        if (!profile) return { newBadges: [], totalBadges: 0 };

        // Get all badges and worker's existing badges
        const [badges, existingBadges] = await Promise.all([
            this.getAllBadges(),
            this.getWorkerBadges(workerId),
        ]);

        const existingCodes = new Set(existingBadges.map(wb => wb.badge.code));
        const newBadges: Badge[] = [];

        // Check each badge
        for (const badge of badges) {
            if (existingCodes.has(badge.code)) continue;

            const eligible = await this.checkBadgeEligibility(
                workerId,
                badge,
                profile.total_completed_jobs || 0
            );

            if (eligible) {
                const awarded = await this.awardBadge(workerId, badge.id);
                if (awarded) {
                    newBadges.push(badge);
                }
            }
        }

        return {
            newBadges,
            totalBadges: existingBadges.length + newBadges.length,
        };
    },

    /**
     * Check if worker is eligible for a specific badge
     */
    async checkBadgeEligibility(
        workerId: string,
        badge: Badge,
        completedJobs: number
    ): Promise<boolean> {
        if (!badge.criteria) return false;

        const supabase = createUntypedClient();

        // Check min_completed criteria
        if (badge.criteria.min_completed) {
            if (completedJobs < badge.criteria.min_completed) {
                return false;
            }
        }

        // Check language skill badges
        if (badge.criteria.language && badge.criteria.min_level) {
            const requiredLanguage = badge.criteria.language;
            const requiredLevel = badge.criteria.min_level;

            const { data: skills } = await supabase
                .from('language_skills')
                .select('level')
                .eq('user_id', workerId)
                .eq('language', requiredLanguage)
                .eq('verification_status', 'verified');

            if (!skills || skills.length === 0) return false;

            // Simple level check (would need proper level comparison)
            const hasRequiredLevel = skills.some(s =>
                this.compareLevels(s.level, requiredLevel) >= 0
            );
            if (!hasRequiredLevel) return false;
        }

        // Check consecutive on-time criteria
        if (badge.criteria.consecutive_ontime) {
            const { count } = await supabase
                .from('reliability_history')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', workerId)
                .eq('reason', 'on_time_streak');

            // Simplified check
            if (!count || count < badge.criteria.consecutive_ontime / 5) {
                return false;
            }
        }

        return true;
    },

    /**
     * Award a badge to worker
     */
    async awardBadge(
        workerId: string,
        badgeId: string,
        jobId?: string
    ): Promise<boolean> {
        const supabase = createUntypedClient();

        const { error } = await supabase
            .from('worker_badges')
            .insert({
                worker_id: workerId,
                badge_id: badgeId,
                related_job_id: jobId,
            });

        if (error) {
            // Likely duplicate
            console.log('Badge award skipped (may exist):', error.message);
            return false;
        }

        // Create notification for new badge
        const { data: badge } = await supabase
            .from('badges')
            .select('name_vi, icon')
            .eq('id', badgeId)
            .single();

        if (badge) {
            await supabase.from('notifications').insert({
                user_id: workerId,
                type: 'badge_earned',
                title: 'Huy hiệu mới!',
                content: `Bạn đã nhận được huy hiệu ${badge.icon} ${badge.name_vi}`,
                data: { badge_id: badgeId },
                is_read: false,
            });
        }

        return true;
    },

    /**
     * Get badge count for worker
     */
    async getBadgeCount(workerId: string): Promise<number> {
        const supabase = createUntypedClient();

        const { count } = await supabase
            .from('worker_badges')
            .select('*', { count: 'exact', head: true })
            .eq('worker_id', workerId);

        return count || 0;
    },

    /**
     * Helper: Map database badge to Badge type
     */
    mapBadge(data: any): Badge {
        return {
            id: data.id,
            code: data.code,
            nameVi: data.name_vi,
            nameEn: data.name_en,
            descriptionVi: data.description_vi,
            descriptionEn: data.description_en,
            icon: data.icon,
            category: data.category,
            criteria: data.criteria,
        };
    },

    /**
     * Helper: Compare language levels
     */
    compareLevels(actual: string, required: string): number {
        const levelOrder: Record<string, number> = {
            beginner: 0, n5: 1, n4: 2, n3: 3, n2: 4, n1: 5,
            topik_1: 1, topik_2: 2, topik_3: 3, topik_4: 4, topik_5: 5, topik_6: 6,
            a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6,
        };

        const actualLevel = levelOrder[actual] ?? 0;
        const requiredLevel = levelOrder[required] ?? 0;

        return actualLevel - requiredLevel;
    },
};
