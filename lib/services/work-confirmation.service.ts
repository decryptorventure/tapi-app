/**
 * Work Confirmation Service
 * Owner confirms worker's completed shift (Timee flow)
 * Status: working → completed after owner confirmation
 */

import { createUntypedClient } from '@/lib/supabase/client';
import { GradeService } from './grade.service';
import { BadgeService } from './badge.service';

export interface WorkSession {
    applicationId: string;
    jobId: string;
    workerId: string;
    workerName: string;
    workerAvatar?: string;
    jobTitle: string;
    checkinTime: Date;
    checkoutTime?: Date;
    hoursWorked: number;
    calculatedPay: number;
    status: 'working' | 'pending_confirmation' | 'confirmed' | 'disputed';
}

export interface ConfirmWorkResult {
    success: boolean;
    message: string;
    finalPay?: number;
}

export const WorkConfirmationService = {
    /**
     * Get all work sessions pending owner confirmation
     */
    async getPendingConfirmations(ownerId: string): Promise<WorkSession[]> {
        const supabase = createUntypedClient();

        // Get applications that are 'working' and have checkout record
        const { data, error } = await supabase
            .from('job_applications')
            .select(`
                id,
                job_id,
                worker_id,
                status,
                worker:profiles!worker_id (full_name, avatar_url),
                job:jobs!job_id (title, hourly_rate_vnd, owner_id)
            `)
            .eq('status', 'working')
            .eq('job.owner_id', ownerId);

        if (error || !data) return [];

        // Get checkin/checkout times for each
        const sessions: WorkSession[] = [];

        for (const app of data) {
            // Verify this job belongs to the owner
            if ((app.job as any)?.owner_id !== ownerId) continue;

            // Get checkin/checkout times
            const { data: checkins } = await supabase
                .from('checkins')
                .select('checkin_type, checkin_time')
                .eq('application_id', app.id)
                .order('checkin_time', { ascending: true });

            const checkinRecord = checkins?.find(c => c.checkin_type === 'check_in');
            const checkoutRecord = checkins?.find(c => c.checkin_type === 'check_out');

            // Only include if has checkout (waiting for confirmation)
            if (!checkinRecord || !checkoutRecord) continue;

            const checkinTime = new Date(checkinRecord.checkin_time);
            const checkoutTime = new Date(checkoutRecord.checkin_time);
            const hoursWorked = (checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60);
            const hourlyRate = (app.job as any)?.hourly_rate_vnd || 0;

            sessions.push({
                applicationId: app.id,
                jobId: app.job_id,
                workerId: app.worker_id,
                workerName: (app.worker as any)?.full_name || 'Unknown',
                workerAvatar: (app.worker as any)?.avatar_url,
                jobTitle: (app.job as any)?.title || 'Unknown Job',
                checkinTime,
                checkoutTime,
                hoursWorked: Math.round(hoursWorked * 10) / 10,
                calculatedPay: Math.round(hoursWorked * hourlyRate),
                status: 'pending_confirmation',
            });
        }

        return sessions;
    },

    /**
     * Owner confirms work - triggers payment and status update
     */
    async confirmWork(
        applicationId: string,
        ownerId: string,
        adjustedHours?: number,
        adjustedPay?: number,
        notes?: string
    ): Promise<ConfirmWorkResult> {
        const supabase = createUntypedClient();

        try {
            // Verify owner owns this job
            const { data: app, error: appError } = await supabase
                .from('job_applications')
                .select(`
                    id,
                    worker_id,
                    status,
                    job:jobs!job_id (owner_id, hourly_rate_vnd)
                `)
                .eq('id', applicationId)
                .single();

            if (appError || !app) {
                return { success: false, message: 'Không tìm thấy đơn ứng tuyển' };
            }

            if ((app.job as any)?.owner_id !== ownerId) {
                return { success: false, message: 'Bạn không có quyền xác nhận đơn này' };
            }

            if (app.status !== 'working') {
                return { success: false, message: 'Đơn không ở trạng thái chờ xác nhận' };
            }

            // Get checkin/checkout times
            const { data: checkins } = await supabase
                .from('checkins')
                .select('checkin_type, checkin_time')
                .eq('application_id', applicationId);

            const checkinTime = checkins?.find(c => c.checkin_type === 'check_in')?.checkin_time;
            const checkoutTime = checkins?.find(c => c.checkin_type === 'check_out')?.checkin_time;

            if (!checkinTime || !checkoutTime) {
                return { success: false, message: 'Thiếu thông tin check-in/out' };
            }

            // Calculate final pay
            const hoursWorked = adjustedHours ??
                (new Date(checkoutTime).getTime() - new Date(checkinTime).getTime()) / (1000 * 60 * 60);
            const hourlyRate = (app.job as any)?.hourly_rate_vnd || 0;
            const finalPay = adjustedPay ?? Math.round(hoursWorked * hourlyRate);

            // Update application status to completed
            const { error: updateError } = await supabase
                .from('job_applications')
                .update({
                    status: 'completed',
                    // Store confirmation metadata
                })
                .eq('id', applicationId);

            if (updateError) {
                return { success: false, message: 'Lỗi cập nhật trạng thái' };
            }

            // Create wallet transaction (earning)
            await supabase.from('wallet_transactions').insert({
                user_id: app.worker_id,
                job_id: (app as any).job_id,
                application_id: applicationId,
                amount_vnd: finalPay,
                transaction_type: 'earning',
                status: 'completed',
                completed_at: new Date().toISOString(),
            });

            // Update worker stats and check for badges
            await GradeService.updateStats(app.worker_id);
            await GradeService.recalculateGrade(app.worker_id);
            await BadgeService.checkAndAwardBadges(app.worker_id);

            // Notify worker
            await supabase.from('notifications').insert({
                user_id: app.worker_id,
                type: 'work_confirmed',
                title: 'Ca làm đã được xác nhận',
                content: `Bạn nhận được ${finalPay.toLocaleString()}đ cho ca làm vừa hoàn thành`,
                data: { application_id: applicationId, amount: finalPay },
                is_read: false,
            });

            return {
                success: true,
                message: 'Đã xác nhận và thanh toán thành công',
                finalPay,
            };
        } catch (error: any) {
            console.error('Confirm work error:', error);
            return { success: false, message: error.message || 'Có lỗi xảy ra' };
        }
    },

    /**
     * Owner disputes work - flags for review
     */
    async disputeWork(
        applicationId: string,
        ownerId: string,
        reason: string
    ): Promise<{ success: boolean; message: string }> {
        const supabase = createUntypedClient();

        try {
            // Verify owner
            const { data: app } = await supabase
                .from('job_applications')
                .select('job:jobs!job_id (owner_id)')
                .eq('id', applicationId)
                .single();

            if ((app?.job as any)?.owner_id !== ownerId) {
                return { success: false, message: 'Không có quyền' };
            }

            // Create dispute record (could use time_modification_requests table)
            await supabase.from('time_modification_requests').insert({
                application_id: applicationId,
                requested_by: ownerId,
                request_type: 'both',
                reason: `DISPUTE: ${reason}`,
                status: 'pending',
            });

            return { success: true, message: 'Đã gửi yêu cầu xem xét' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Auto-confirm old sessions (cron job - 24h after checkout)
     */
    async autoConfirmOldSessions(): Promise<number> {
        const supabase = createUntypedClient();
        let confirmed = 0;

        // Get working applications with checkout > 24h ago
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: oldCheckouts } = await supabase
            .from('checkins')
            .select('application_id')
            .eq('checkin_type', 'check_out')
            .lt('checkin_time', cutoffTime);

        if (!oldCheckouts) return 0;

        for (const checkout of oldCheckouts) {
            // Check if still in working status
            const { data: app } = await supabase
                .from('job_applications')
                .select('status, job:jobs!job_id (owner_id)')
                .eq('id', checkout.application_id)
                .single();

            if (app?.status === 'working') {
                const ownerId = (app.job as any)?.owner_id;
                if (ownerId) {
                    const result = await this.confirmWork(checkout.application_id, ownerId);
                    if (result.success) confirmed++;
                }
            }
        }

        return confirmed;
    },
};
