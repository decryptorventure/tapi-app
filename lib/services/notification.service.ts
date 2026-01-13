import { createUntypedClient } from '@/lib/supabase/client';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'application_update' | 'chat_message' | 'system' | 'reminder';
    related_id: string | null;
    is_read: boolean;
    created_at: string;
}

export const NotificationService = {
    // Fetch notifications for the current user
    getNotifications: async (userId: string) => {
        const supabase = createUntypedClient();

        // Sort by created_at desc
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50); // Pagination in future if needed

        if (error) throw error;
        return data as Notification[];
    },

    // Mark a specific notification as read
    markAsRead: async (notificationId: string) => {
        const supabase = createUntypedClient();

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
    },

    // Mark all notifications as read for a user
    markAllAsRead: async (userId: string) => {
        const supabase = createUntypedClient();

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
    },

    // Get unread count
    getUnreadCount: async (userId: string) => {
        const supabase = createUntypedClient();

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    }
};
