import { createUntypedClient } from '@/lib/supabase/client';
import { CheckinService } from './checkin.service';

interface CancellationResult {
    success: boolean;
    message: string;
    penalty: number;
}

/**
 * Tiered cancellation penalties based on timing
 * 
 * Worker Cancellation:
 * - Before T-6h: No penalty
 * - T-6h to T-1h: -5 points
 * - T-1h to T+15m: -15 points
 * - After T+15m: -20 points + 7-day freeze (no-show)
 * 
 * Owner Cancellation:
 * - Before T-24h: No penalty
 * - T-24h to T-1h: Flag for review
 * - After T-1h: Warn + notify worker
 */
export const CancellationService = {
    /**
     * Calculate hours until shift start
     */
    calculateHoursUntilShift(shiftDate: string, shiftStartTime: string): number {
        const shiftStart = new Date(`${shiftDate}T${shiftStartTime}`);
        const now = new Date();
        const diffMs = shiftStart.getTime() - now.getTime();
        return diffMs / (1000 * 60 * 60);
    },

    /**
     * Get worker cancellation penalty based on timing
     */
    getWorkerPenalty(hoursUntilShift: number): { points: number; freeze: boolean; tier: string } {
        if (hoursUntilShift > 6) {
            return { points: 0, freeze: false, tier: 'free' };
        } else if (hoursUntilShift > 1) {
            return { points: -5, freeze: false, tier: 'late' };
        } else if (hoursUntilShift > -0.25) {
            // T-1h to T+15m
            return { points: -15, freeze: false, tier: 'very_late' };
        } else {
            // After T+15m = no-show
            return { points: -20, freeze: true, tier: 'no_show' };
        }
    },

    /**
     * Worker cancels their application
     */
    async cancelByWorker(
        applicationId: string,
        workerId: string,
        reason?: string
    ): Promise<CancellationResult> {
        const supabase = createUntypedClient();

        try {
            // Get application with job details
            const { data: apps, error: fetchError } = await supabase
                .from('job_applications')
                .select('*, jobs!inner(shift_date, shift_start_time, title, owner_id)')
                .eq('id', applicationId)
                .eq('worker_id', workerId)
                .limit(1);

            const app = apps?.[0];

            if (fetchError || !app) {
                return {
                    success: false,
                    message: 'Không tìm thấy đơn ứng tuyển',
                    penalty: 0,
                };
            }

            if (app.status === 'cancelled') {
                return {
                    success: false,
                    message: 'Đơn đã được hủy trước đó',
                    penalty: 0,
                };
            }

            // Calculate penalty
            const hoursUntil = this.calculateHoursUntilShift(
                (app as any).jobs.shift_date,
                (app as any).jobs.shift_start_time
            );
            const penalty = this.getWorkerPenalty(hoursUntil);

            // Update application status
            const { error: updateError } = await supabase
                .from('job_applications')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancelled_by: workerId,
                    cancellation_reason: reason || 'Worker cancelled',
                    cancellation_penalty: Math.abs(penalty.points),
                })
                .eq('id', applicationId);

            if (updateError) {
                console.error('Error cancelling application:', updateError);
                return {
                    success: false,
                    message: 'Lỗi khi hủy đơn',
                    penalty: 0,
                };
            }

            // Apply penalty if any
            if (penalty.points < 0) {
                await CheckinService.updateReliabilityScore(
                    workerId,
                    penalty.points,
                    `cancellation_${penalty.tier}`
                );
            }

            // Freeze account if no-show tier
            if (penalty.freeze) {
                const freezeUntil = new Date();
                freezeUntil.setDate(freezeUntil.getDate() + 7);

                await supabase
                    .from('profiles')
                    .update({
                        is_account_frozen: true,
                        frozen_until: freezeUntil.toISOString(),
                    })
                    .eq('id', workerId);
            }

            // Notify owner
            await supabase
                .from('notifications')
                .insert({
                    user_id: (app as any).jobs.owner_id,
                    title: 'Worker đã hủy',
                    message: `Worker đã hủy ca làm "${(app as any).jobs.title}". ${reason ? `Lý do: ${reason}` : ''
                        }`,
                    type: 'application_update',
                    related_id: applicationId,
                });

            const message =
                penalty.points === 0
                    ? 'Đã hủy đơn thành công'
                    : `Đã hủy đơn. Bạn bị trừ ${Math.abs(penalty.points)} điểm reliability.${penalty.freeze ? ' Tài khoản bị đóng băng 7 ngày.' : ''
                    }`;

            return {
                success: true,
                message,
                penalty: Math.abs(penalty.points),
            };
        } catch (error) {
            console.error('Cancellation error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống',
                penalty: 0,
            };
        }
    },

    /**
     * Owner cancels a worker's approved application
     */
    async cancelByOwner(
        applicationId: string,
        ownerId: string,
        reason?: string
    ): Promise<CancellationResult> {
        const supabase = createUntypedClient();

        try {
            // Get application with job details
            const { data: apps, error: fetchError } = await supabase
                .from('job_applications')
                .select('*, jobs!inner(shift_date, shift_start_time, title, owner_id)')
                .eq('id', applicationId)
                .limit(1);

            const app = apps?.[0];

            if (fetchError || !app) {
                return {
                    success: false,
                    message: 'Không tìm thấy đơn ứng tuyển',
                    penalty: 0,
                };
            }

            // Verify ownership
            if ((app as any).jobs.owner_id !== ownerId) {
                return {
                    success: false,
                    message: 'Bạn không có quyền hủy đơn này',
                    penalty: 0,
                };
            }

            const hoursUntil = this.calculateHoursUntilShift(
                (app as any).jobs.shift_date,
                (app as any).jobs.shift_start_time
            );

            // Update application status
            const { error: updateError } = await supabase
                .from('job_applications')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancelled_by: ownerId,
                    cancellation_reason: reason || 'Owner cancelled',
                    cancellation_penalty: 0,
                })
                .eq('id', applicationId);

            if (updateError) {
                console.error('Error cancelling application:', updateError);
                return {
                    success: false,
                    message: 'Lỗi khi hủy đơn',
                    penalty: 0,
                };
            }

            // Notify worker
            let warningNote = '';
            if (hoursUntil < 1) {
                warningNote = ' (Hủy muộn - đã được ghi nhận)';
            }

            await supabase
                .from('notifications')
                .insert({
                    user_id: app.worker_id,
                    title: 'Ca làm bị hủy',
                    message: `Chủ nhà hàng đã hủy ca làm "${(app as any).jobs.title}".${reason ? ` Lý do: ${reason}` : ''
                        }${warningNote}`,
                    type: 'application_update',
                    related_id: applicationId,
                });

            return {
                success: true,
                message: 'Đã hủy ca làm thành công',
                penalty: 0,
            };
        } catch (error) {
            console.error('Owner cancellation error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống',
                penalty: 0,
            };
        }
    },
};
