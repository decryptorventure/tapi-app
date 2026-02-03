/**
 * Relation Service
 * Manages owner-worker relationships (block/favorite)
 * Inspired by Timee's CRM and blacklist system
 */

import { createUntypedClient } from '@/lib/supabase/client';

export type RelationType = 'block' | 'favorite';

export interface WorkerRelation {
    id: string;
    ownerId: string;
    workerId: string;
    relationType: RelationType;
    reason?: string;
    relatedJobId?: string;
    createdAt: Date;
    // Joined data
    workerName?: string;
    workerAvatar?: string;
    workerGrade?: string;
}

export interface RelationStats {
    blockedCount: number;
    favoriteCount: number;
}

export const RelationService = {
    /**
     * Block a worker
     */
    async blockWorker(
        ownerId: string,
        workerId: string,
        reason?: string,
        jobId?: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = createUntypedClient();

        try {
            // Upsert to handle existing favorite -> block
            const { error } = await supabase
                .from('owner_worker_relations')
                .upsert({
                    owner_id: ownerId,
                    worker_id: workerId,
                    relation_type: 'block',
                    reason,
                    related_job_id: jobId,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'owner_id,worker_id',
                });

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Block worker error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Favorite a worker
     */
    async favoriteWorker(
        ownerId: string,
        workerId: string,
        jobId?: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = createUntypedClient();

        try {
            // Check if already blocked
            const { data: existing } = await supabase
                .from('owner_worker_relations')
                .select('relation_type')
                .eq('owner_id', ownerId)
                .eq('worker_id', workerId)
                .single();

            if (existing?.relation_type === 'block') {
                return { success: false, error: 'Không thể yêu thích worker đã bị chặn' };
            }

            const { error } = await supabase
                .from('owner_worker_relations')
                .upsert({
                    owner_id: ownerId,
                    worker_id: workerId,
                    relation_type: 'favorite',
                    related_job_id: jobId,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'owner_id,worker_id',
                });

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Favorite worker error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Remove relation (unblock or unfavorite)
     */
    async removeRelation(
        ownerId: string,
        workerId: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = createUntypedClient();

        try {
            const { error } = await supabase
                .from('owner_worker_relations')
                .delete()
                .eq('owner_id', ownerId)
                .eq('worker_id', workerId);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Remove relation error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get relation between owner and worker
     */
    async getRelation(
        ownerId: string,
        workerId: string
    ): Promise<RelationType | null> {
        const supabase = createUntypedClient();

        const { data } = await supabase
            .from('owner_worker_relations')
            .select('relation_type')
            .eq('owner_id', ownerId)
            .eq('worker_id', workerId)
            .single();

        return data?.relation_type || null;
    },

    /**
     * Get all blocked workers for an owner
     */
    async getBlockedWorkers(ownerId: string): Promise<WorkerRelation[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('owner_worker_relations')
            .select(`
                id,
                owner_id,
                worker_id,
                relation_type,
                reason,
                related_job_id,
                created_at,
                worker:profiles!worker_id (
                    full_name,
                    avatar_url,
                    worker_grade
                )
            `)
            .eq('owner_id', ownerId)
            .eq('relation_type', 'block')
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map((r: any) => ({
            id: r.id,
            ownerId: r.owner_id,
            workerId: r.worker_id,
            relationType: r.relation_type,
            reason: r.reason,
            relatedJobId: r.related_job_id,
            createdAt: new Date(r.created_at),
            workerName: r.worker?.full_name,
            workerAvatar: r.worker?.avatar_url,
            workerGrade: r.worker?.worker_grade,
        }));
    },

    /**
     * Get all favorite workers for an owner
     */
    async getFavoriteWorkers(ownerId: string): Promise<WorkerRelation[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('owner_worker_relations')
            .select(`
                id,
                owner_id,
                worker_id,
                relation_type,
                created_at,
                worker:profiles!worker_id (
                    full_name,
                    avatar_url,
                    worker_grade,
                    total_completed_jobs,
                    average_rating
                )
            `)
            .eq('owner_id', ownerId)
            .eq('relation_type', 'favorite')
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map((r: any) => ({
            id: r.id,
            ownerId: r.owner_id,
            workerId: r.worker_id,
            relationType: r.relation_type,
            createdAt: new Date(r.created_at),
            workerName: r.worker?.full_name,
            workerAvatar: r.worker?.avatar_url,
            workerGrade: r.worker?.worker_grade,
        }));
    },

    /**
     * Get relation stats for an owner
     */
    async getStats(ownerId: string): Promise<RelationStats> {
        const supabase = createUntypedClient();

        const { data } = await supabase
            .from('owner_worker_relations')
            .select('relation_type')
            .eq('owner_id', ownerId);

        const relations = data || [];
        return {
            blockedCount: relations.filter(r => r.relation_type === 'block').length,
            favoriteCount: relations.filter(r => r.relation_type === 'favorite').length,
        };
    },

    /**
     * Get list of owners who blocked a worker (for job filtering)
     */
    async getBlockingOwners(workerId: string): Promise<string[]> {
        const supabase = createUntypedClient();

        const { data } = await supabase
            .from('owner_worker_relations')
            .select('owner_id')
            .eq('worker_id', workerId)
            .eq('relation_type', 'block');

        return (data || []).map(r => r.owner_id);
    },

    /**
     * Check if worker is blocked by owner
     */
    async isBlocked(ownerId: string, workerId: string): Promise<boolean> {
        const relation = await this.getRelation(ownerId, workerId);
        return relation === 'block';
    },

    /**
     * Check if worker is favorited by owner
     */
    async isFavorited(ownerId: string, workerId: string): Promise<boolean> {
        const relation = await this.getRelation(ownerId, workerId);
        return relation === 'favorite';
    },

    /**
     * Notify favorite workers when new job posted
     */
    async notifyFavoriteWorkers(ownerId: string, jobId: string): Promise<void> {
        const supabase = createUntypedClient();

        // Get favorite worker IDs
        const { data: favorites } = await supabase
            .from('owner_worker_relations')
            .select('worker_id')
            .eq('owner_id', ownerId)
            .eq('relation_type', 'favorite');

        if (!favorites || favorites.length === 0) return;

        // Get job details
        const { data: job } = await supabase
            .from('jobs')
            .select('title, shift_date, hourly_rate_vnd')
            .eq('id', jobId)
            .single();

        if (!job) return;

        // Create notifications for each favorite worker
        const notifications = favorites.map(f => ({
            user_id: f.worker_id,
            type: 'favorite_job',
            title: 'Việc làm mới từ nhà hàng yêu thích',
            content: `${job.title} - ${job.hourly_rate_vnd?.toLocaleString()}đ/giờ`,
            data: { job_id: jobId },
            is_read: false,
        }));

        await supabase.from('notifications').insert(notifications);
    },
};
