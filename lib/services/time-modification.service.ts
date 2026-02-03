/**
 * Time Modification Service
 * Handles time adjustment requests for check-in/out
 * Inspired by Timee Modification Request system
 */

import { createUntypedClient } from '@/lib/supabase/client';

export type RequestType = 'checkin' | 'checkout' | 'both';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface TimeModificationRequest {
    id: string;
    applicationId: string;
    requestedBy: string;
    requestType: RequestType;
    originalCheckinTime?: Date;
    originalCheckoutTime?: Date;
    proposedCheckinTime?: Date;
    proposedCheckoutTime?: Date;
    reason: string;
    evidenceUrls?: string[];
    status: RequestStatus;
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNotes?: string;
    expiresAt: Date;
    createdAt: Date;
    // Joined data
    requesterName?: string;
    jobTitle?: string;
}

export interface CreateModificationInput {
    applicationId: string;
    requestType: RequestType;
    proposedCheckinTime?: string;
    proposedCheckoutTime?: string;
    reason: string;
    evidenceUrls?: string[];
}

export const TimeModificationService = {
    /**
     * Create a new time modification request
     */
    async createRequest(
        userId: string,
        input: CreateModificationInput
    ): Promise<{ success: boolean; request?: TimeModificationRequest; error?: string }> {
        const supabase = createUntypedClient();

        try {
            // Check if there's already a pending request
            const { data: existing } = await supabase
                .from('time_modification_requests')
                .select('id')
                .eq('application_id', input.applicationId)
                .eq('status', 'pending')
                .single();

            if (existing) {
                return {
                    success: false,
                    error: 'Đã có yêu cầu chỉnh sửa đang chờ xử lý',
                };
            }

            // Get original times from checkins
            const { data: checkins } = await supabase
                .from('checkins')
                .select('type, checkin_time')
                .eq('application_id', input.applicationId);

            const originalCheckin = checkins?.find(c => c.type === 'checkin')?.checkin_time;
            const originalCheckout = checkins?.find(c => c.type === 'checkout')?.checkin_time;

            // Create request
            const { data, error } = await supabase
                .from('time_modification_requests')
                .insert({
                    application_id: input.applicationId,
                    requested_by: userId,
                    request_type: input.requestType,
                    original_checkin_time: originalCheckin,
                    original_checkout_time: originalCheckout,
                    proposed_checkin_time: input.proposedCheckinTime,
                    proposed_checkout_time: input.proposedCheckoutTime,
                    reason: input.reason,
                    evidence_urls: input.evidenceUrls || [],
                })
                .select()
                .single();

            if (error) throw error;

            // Notify the other party
            await this.notifyCounterParty(input.applicationId, userId);

            return {
                success: true,
                request: this.mapRequest(data),
            };
        } catch (error: any) {
            console.error('Create modification request error:', error);
            return {
                success: false,
                error: error.message || 'Có lỗi xảy ra',
            };
        }
    },

    /**
     * Approve a modification request
     */
    async approveRequest(
        requestId: string,
        reviewerId: string,
        notes?: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = createUntypedClient();

        try {
            // Update status
            const { error: updateError } = await supabase
                .from('time_modification_requests')
                .update({
                    status: 'approved',
                    reviewed_by: reviewerId,
                    reviewed_at: new Date().toISOString(),
                    review_notes: notes,
                })
                .eq('id', requestId)
                .neq('requested_by', reviewerId); // Cannot self-approve

            if (updateError) throw updateError;

            // Apply the modification
            const { error: applyError } = await supabase.rpc('apply_time_modification', {
                p_request_id: requestId,
            });

            if (applyError) {
                console.error('Apply modification error:', applyError);
            }

            // Notify requester
            await this.notifyRequester(requestId, 'approved');

            return { success: true };
        } catch (error: any) {
            console.error('Approve modification error:', error);
            return {
                success: false,
                error: error.message || 'Có lỗi xảy ra',
            };
        }
    },

    /**
     * Reject a modification request
     */
    async rejectRequest(
        requestId: string,
        reviewerId: string,
        notes?: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = createUntypedClient();

        try {
            const { error } = await supabase
                .from('time_modification_requests')
                .update({
                    status: 'rejected',
                    reviewed_by: reviewerId,
                    reviewed_at: new Date().toISOString(),
                    review_notes: notes,
                })
                .eq('id', requestId)
                .neq('requested_by', reviewerId);

            if (error) throw error;

            // Notify requester
            await this.notifyRequester(requestId, 'rejected');

            return { success: true };
        } catch (error: any) {
            console.error('Reject modification error:', error);
            return {
                success: false,
                error: error.message || 'Có lỗi xảy ra',
            };
        }
    },

    /**
     * Get pending requests for a user (to review)
     */
    async getPendingRequests(userId: string): Promise<TimeModificationRequest[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('time_modification_requests')
            .select(`
                *,
                requester:profiles!requested_by (full_name),
                application:job_applications!application_id (
                    job:jobs (title)
                )
            `)
            .eq('status', 'pending')
            .neq('requested_by', userId)
            .lt('expires_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map((r: any) => ({
            ...this.mapRequest(r),
            requesterName: r.requester?.full_name,
            jobTitle: r.application?.job?.title,
        }));
    },

    /**
     * Get request history for a user
     */
    async getRequestHistory(userId: string): Promise<TimeModificationRequest[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('time_modification_requests')
            .select(`
                *,
                application:job_applications!application_id (
                    job:jobs (title)
                )
            `)
            .eq('requested_by', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error || !data) return [];

        return data.map((r: any) => ({
            ...this.mapRequest(r),
            jobTitle: r.application?.job?.title,
        }));
    },

    /**
     * Notify counter party about new request
     */
    async notifyCounterParty(applicationId: string, requesterId: string): Promise<void> {
        const supabase = createUntypedClient();

        // Get application details
        const { data: app } = await supabase
            .from('job_applications')
            .select(`
                worker_id,
                job:jobs (owner_id, title)
            `)
            .eq('id', applicationId)
            .single();

        if (!app) return;

        const counterPartyId = requesterId === app.worker_id
            ? (app.job as any).owner_id
            : app.worker_id;

        await supabase.from('notifications').insert({
            user_id: counterPartyId,
            type: 'time_modification',
            title: 'Yêu cầu chỉnh sửa giờ làm',
            content: `Có yêu cầu chỉnh sửa giờ cho ca "${(app.job as any).title}"`,
            data: { application_id: applicationId },
            is_read: false,
        });
    },

    /**
     * Notify requester about decision
     */
    async notifyRequester(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
        const supabase = createUntypedClient();

        const { data: request } = await supabase
            .from('time_modification_requests')
            .select('requested_by')
            .eq('id', requestId)
            .single();

        if (!request) return;

        await supabase.from('notifications').insert({
            user_id: request.requested_by,
            type: 'time_modification_result',
            title: status === 'approved' ? 'Yêu cầu được chấp nhận' : 'Yêu cầu bị từ chối',
            content: status === 'approved'
                ? 'Yêu cầu chỉnh sửa giờ làm của bạn đã được chấp nhận'
                : 'Yêu cầu chỉnh sửa giờ làm của bạn đã bị từ chối',
            data: { request_id: requestId, status },
            is_read: false,
        });
    },

    /**
     * Map database record to TypeScript type
     */
    mapRequest(data: any): TimeModificationRequest {
        return {
            id: data.id,
            applicationId: data.application_id,
            requestedBy: data.requested_by,
            requestType: data.request_type,
            originalCheckinTime: data.original_checkin_time ? new Date(data.original_checkin_time) : undefined,
            originalCheckoutTime: data.original_checkout_time ? new Date(data.original_checkout_time) : undefined,
            proposedCheckinTime: data.proposed_checkin_time ? new Date(data.proposed_checkin_time) : undefined,
            proposedCheckoutTime: data.proposed_checkout_time ? new Date(data.proposed_checkout_time) : undefined,
            reason: data.reason,
            evidenceUrls: data.evidence_urls,
            status: data.status,
            reviewedBy: data.reviewed_by,
            reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
            reviewNotes: data.review_notes,
            expiresAt: new Date(data.expires_at),
            createdAt: new Date(data.created_at),
        };
    },
};
