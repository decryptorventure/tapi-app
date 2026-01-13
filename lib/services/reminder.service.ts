import { createUntypedClient } from '@/lib/supabase/client';

interface ShiftReminder {
    application_id: string;
    worker_id: string;
    job_id: string;
    job_title: string;
    shift_date: string;
    shift_start_time: string;
    restaurant_name: string;
}

/**
 * Service for handling shift reminders
 * Sends notifications 24h and 1h before shift start
 */
export const ReminderService = {
    /**
     * Get shifts needing 24h reminder
     */
    async getShiftsNeeding24hReminder(): Promise<ShiftReminder[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase.rpc('get_shifts_needing_24h_reminder');

        if (error) {
            console.error('Error fetching 24h reminders:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Get shifts needing 1h reminder
     */
    async getShiftsNeeding1hReminder(): Promise<ShiftReminder[]> {
        const supabase = createUntypedClient();

        const { data, error } = await supabase.rpc('get_shifts_needing_1h_reminder');

        if (error) {
            console.error('Error fetching 1h reminders:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Send 24h reminder notification
     */
    async send24hReminder(shift: ShiftReminder): Promise<boolean> {
        const supabase = createUntypedClient();

        try {
            // Create notification
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: shift.worker_id,
                    title: 'Nhắc nhở ca làm',
                    message: `Ca làm tại ${shift.restaurant_name} sẽ bắt đầu trong 24 giờ nữa (${shift.shift_start_time})`,
                    type: 'shift_reminder',
                    related_id: shift.application_id,
                });

            if (notifError) {
                console.error('Error creating 24h notification:', notifError);
                return false;
            }

            // Mark as sent
            const { error: markError } = await supabase.rpc('mark_24h_reminder_sent', {
                p_application_id: shift.application_id,
            });

            if (markError) {
                console.error('Error marking 24h reminder sent:', markError);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error sending 24h reminder:', error);
            return false;
        }
    },

    /**
     * Send 1h reminder notification
     */
    async send1hReminder(shift: ShiftReminder): Promise<boolean> {
        const supabase = createUntypedClient();

        try {
            // Create notification
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: shift.worker_id,
                    title: 'Ca làm sắp bắt đầu!',
                    message: `Ca làm tại ${shift.restaurant_name} sẽ bắt đầu trong 1 giờ nữa. Hãy chuẩn bị QR code để check-in.`,
                    type: 'shift_reminder',
                    related_id: shift.application_id,
                });

            if (notifError) {
                console.error('Error creating 1h notification:', notifError);
                return false;
            }

            // Mark as sent
            const { error: markError } = await supabase.rpc('mark_1h_reminder_sent', {
                p_application_id: shift.application_id,
            });

            if (markError) {
                console.error('Error marking 1h reminder sent:', markError);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error sending 1h reminder:', error);
            return false;
        }
    },

    /**
     * Process all pending reminders
     * Call this from a cron job or scheduled function
     */
    async processAllReminders(): Promise<{ sent24h: number; sent1h: number }> {
        let sent24h = 0;
        let sent1h = 0;

        // Process 24h reminders
        const shifts24h = await this.getShiftsNeeding24hReminder();
        for (const shift of shifts24h) {
            const success = await this.send24hReminder(shift);
            if (success) sent24h++;
        }

        // Process 1h reminders
        const shifts1h = await this.getShiftsNeeding1hReminder();
        for (const shift of shifts1h) {
            const success = await this.send1hReminder(shift);
            if (success) sent1h++;
        }

        console.log(`Reminders sent: 24h=${sent24h}, 1h=${sent1h}`);
        return { sent24h, sent1h };
    },
};
