import { createUntypedClient } from '@/lib/supabase/client';

export interface ChatMessage {
    id: string;
    application_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    sender?: {
        full_name: string;
        avatar_url: string | null;
    };
}

export const ChatService = {
    // Get messages for a specific application
    getMessages: async (applicationId: string) => {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
        *,
        sender:profiles!sender_id (
          full_name,
          avatar_url
        )
      `)
            .eq('application_id', applicationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ChatMessage[];
    },

    // Send a message
    sendMessage: async (applicationId: string, senderId: string, content: string) => {
        const supabase = createUntypedClient();

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                application_id: applicationId,
                sender_id: senderId,
                content: content
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Mark all messages in an application as read (for the viewer)
    // NOTE: This is tricky because we don't store "recipient_id" on the message.
    // We store "sender_id". So we want to mark messages WHERE application_id = X AND sender_id != me as read.
    markAsRead: async (applicationId: string, currentUserId: string) => {
        const supabase = createUntypedClient();

        const { error } = await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('application_id', applicationId)
            .neq('sender_id', currentUserId)
            .eq('is_read', false); // Only update unread ones

        if (error) throw error;
    }
};
