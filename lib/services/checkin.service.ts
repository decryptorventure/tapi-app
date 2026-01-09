import { createUntypedClient } from '@/lib/supabase/client';

interface CheckInData {
    applicationId: string;
    workerId: string;
    jobId: string;
    latitude?: number;
    longitude?: number;
}

interface CheckInResult {
    success: boolean;
    message: string;
    checkinId?: string;
    isLate?: boolean;
    minutesLate?: number;
}

interface CheckOutResult {
    success: boolean;
    message: string;
    hoursWorked?: number;
    totalPay?: number;
}

/**
 * Service for handling worker check-in and check-out operations
 */
export const CheckinService = {
    /**
     * Record a worker check-in
     */
    async processCheckIn(data: CheckInData): Promise<CheckInResult> {
        const supabase = createUntypedClient();

        try {
            // Get job details to check shift time
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select('shift_date, shift_start_time, owner_id')
                .eq('id', data.jobId)
                .single();

            if (jobError || !job) {
                return { success: false, message: 'Không tìm thấy công việc' };
            }

            // Calculate if late
            const shiftStart = new Date(`${job.shift_date}T${job.shift_start_time}`);
            const now = new Date();
            const diffMinutes = Math.floor((now.getTime() - shiftStart.getTime()) / (1000 * 60));
            const isLate = diffMinutes > 15; // More than 15 minutes late
            const minutesLate = isLate ? diffMinutes : 0;

            // Check if already checked in
            const { data: existingCheckin } = await supabase
                .from('checkins')
                .select('id')
                .eq('application_id', data.applicationId)
                .eq('checkin_type', 'check_in')
                .single();

            if (existingCheckin) {
                return { success: false, message: 'Đã check-in trước đó' };
            }

            // Record check-in
            const { data: checkin, error: checkinError } = await supabase
                .from('checkins')
                .insert({
                    application_id: data.applicationId,
                    worker_id: data.workerId,
                    job_id: data.jobId,
                    checkin_type: 'check_in',
                    checkin_time: now.toISOString(),
                    location_lat: data.latitude,
                    location_lng: data.longitude,
                })
                .select()
                .single();

            if (checkinError) {
                console.error('Check-in error:', checkinError);
                return { success: false, message: 'Lỗi ghi nhận check-in' };
            }

            // Update reliability score based on punctuality
            if (isLate && minutesLate > 30) {
                // Late more than 30 minutes - deduct 2 points
                await this.updateReliabilityScore(data.workerId, -2, 'late_checkin_severe');
            } else if (isLate) {
                // Late 15-30 minutes - deduct 1 point
                await this.updateReliabilityScore(data.workerId, -1, 'late_checkin');
            } else {
                // On time - add 1 point
                await this.updateReliabilityScore(data.workerId, 1, 'on_time_checkin');
            }

            return {
                success: true,
                message: isLate ? `Check-in muộn ${minutesLate} phút` : 'Check-in thành công',
                checkinId: checkin.id,
                isLate,
                minutesLate,
            };
        } catch (error: any) {
            console.error('Check-in processing error:', error);
            return { success: false, message: error.message || 'Lỗi xử lý check-in' };
        }
    },

    /**
     * Record a worker check-out
     */
    async processCheckOut(data: CheckInData): Promise<CheckOutResult> {
        const supabase = createUntypedClient();

        try {
            // Get check-in record
            const { data: checkin, error: checkinError } = await supabase
                .from('checkins')
                .select('checkin_time')
                .eq('application_id', data.applicationId)
                .eq('checkin_type', 'check_in')
                .single();

            if (checkinError || !checkin) {
                return { success: false, message: 'Chưa check-in' };
            }

            // Get job details for pay calculation
            const { data: job } = await supabase
                .from('jobs')
                .select('hourly_rate_vnd, shift_end_time, shift_date')
                .eq('id', data.jobId)
                .single();

            const now = new Date();
            const checkinTime = new Date(checkin.checkin_time);
            const hoursWorked = (now.getTime() - checkinTime.getTime()) / (1000 * 60 * 60);
            const totalPay = job ? Math.round(hoursWorked * job.hourly_rate_vnd) : 0;

            // Record check-out
            const { error: checkoutError } = await supabase
                .from('checkins')
                .insert({
                    application_id: data.applicationId,
                    worker_id: data.workerId,
                    job_id: data.jobId,
                    checkin_type: 'check_out',
                    checkin_time: now.toISOString(),
                    location_lat: data.latitude,
                    location_lng: data.longitude,
                });

            if (checkoutError) {
                console.error('Check-out error:', checkoutError);
                return { success: false, message: 'Lỗi ghi nhận check-out' };
            }

            // Update application status to completed
            await supabase
                .from('job_applications')
                .update({ status: 'completed' })
                .eq('id', data.applicationId);

            // Add reliability point for completion
            await this.updateReliabilityScore(data.workerId, 1, 'job_completed');

            return {
                success: true,
                message: 'Check-out thành công',
                hoursWorked: Math.round(hoursWorked * 10) / 10,
                totalPay,
            };
        } catch (error: any) {
            console.error('Check-out processing error:', error);
            return { success: false, message: error.message || 'Lỗi xử lý check-out' };
        }
    },

    /**
     * Update worker reliability score
     */
    async updateReliabilityScore(
        workerId: string,
        change: number,
        reason: string
    ): Promise<void> {
        const supabase = createUntypedClient();

        try {
            // Get current score
            const { data: profile } = await supabase
                .from('profiles')
                .select('reliability_score')
                .eq('id', workerId)
                .single();

            if (!profile) return;

            const newScore = Math.max(0, Math.min(100, profile.reliability_score + change));

            // Update profile
            await supabase
                .from('profiles')
                .update({ reliability_score: newScore })
                .eq('id', workerId);

            // Log to reliability_history
            await supabase
                .from('reliability_history')
                .insert({
                    worker_id: workerId,
                    score_change: change,
                    reason,
                    new_score: newScore,
                });

        } catch (error) {
            console.error('Reliability update error:', error);
        }
    },

    /**
     * Process no-show (worker didn't check in)
     */
    async processNoShow(applicationId: string): Promise<{ success: boolean; message: string }> {
        const supabase = createUntypedClient();

        try {
            // Get application details
            const { data: app, error: appError } = await supabase
                .from('job_applications')
                .select('worker_id, job_id, status')
                .eq('id', applicationId)
                .single();

            if (appError || !app) {
                return { success: false, message: 'Không tìm thấy đơn ứng tuyển' };
            }

            if (app.status !== 'approved') {
                return { success: false, message: 'Đơn chưa được duyệt' };
            }

            // Check if already checked in
            const { data: checkin } = await supabase
                .from('checkins')
                .select('id')
                .eq('application_id', applicationId)
                .eq('checkin_type', 'check_in')
                .single();

            if (checkin) {
                return { success: false, message: 'Worker đã check-in' };
            }

            // Update application status
            await supabase
                .from('job_applications')
                .update({ status: 'no_show' })
                .eq('id', applicationId);

            // Deduct 20 points and freeze account for 7 days
            const freezeUntil = new Date();
            freezeUntil.setDate(freezeUntil.getDate() + 7);

            await supabase
                .from('profiles')
                .update({
                    is_account_frozen: true,
                    frozen_until: freezeUntil.toISOString(),
                })
                .eq('id', app.worker_id);

            await this.updateReliabilityScore(app.worker_id, -20, 'no_show');

            return { success: true, message: 'Đã xử lý no-show' };
        } catch (error: any) {
            console.error('No-show processing error:', error);
            return { success: false, message: error.message || 'Lỗi xử lý no-show' };
        }
    },

    /**
     * Validate location for check-in (within 100m of restaurant)
     */
    validateLocation(
        workerLat: number,
        workerLng: number,
        restaurantLat: number,
        restaurantLng: number,
        maxDistance: number = 100 // meters
    ): { valid: boolean; distance: number } {
        // Haversine formula for distance calculation
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (workerLat * Math.PI) / 180;
        const φ2 = (restaurantLat * Math.PI) / 180;
        const Δφ = ((restaurantLat - workerLat) * Math.PI) / 180;
        const Δλ = ((restaurantLng - workerLng) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;

        return {
            valid: distance <= maxDistance,
            distance: Math.round(distance),
        };
    },
};
