'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatService, ChatMessage } from '@/lib/services/chat.service';
import { createUntypedClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface ChatWindowProps {
    applicationId: string;
    currentUserId: string;
    recipientName: string;
    recipientAvatar?: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ChatWindow({
    applicationId,
    currentUserId,
    recipientName,
    recipientAvatar,
    isOpen,
    onClose
}: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch messages on mount
    useEffect(() => {
        if (isOpen) {
            loadMessages();
            ChatService.markAsRead(applicationId, currentUserId);
        }
    }, [isOpen, applicationId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Realtime subscription
    useEffect(() => {
        if (!isOpen) return;

        const supabase = createUntypedClient();
        const channel = supabase
            .channel(`chat:${applicationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `application_id=eq.${applicationId}`,
                },
                (payload) => {
                    const newMsg = payload.new as ChatMessage;
                    setMessages((prev) => [...prev, newMsg]);

                    // If message is from other person, mark as read
                    if (newMsg.sender_id !== currentUserId) {
                        ChatService.markAsRead(applicationId, currentUserId);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, applicationId, currentUserId]);

    const loadMessages = async () => {
        try {
            setIsLoading(true);
            const data = await ChatService.getMessages(applicationId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages', error);
            toast.error('Không thể tải tin nhắn');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        try {
            await ChatService.sendMessage(applicationId, currentUserId, content);
            // Realtime will handle the update in the list, but we could optimistic add if needed.
        } catch (error) {
            console.error('Failed to send message', error);
            toast.error('Gửi tin nhắn thất bại');
            setNewMessage(content); // Restore content
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 right-4 w-80 md:w-96 bg-background border border-border rounded-t-xl shadow-2xl flex flex-col z-50 h-[500px] max-h-[80vh]">
            {/* Header */}
            <div className="p-3 bg-primary text-primary-foreground rounded-t-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                        {recipientAvatar ? (
                            <img src={recipientAvatar} alt={recipientName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-sm">{recipientName.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">{recipientName}</h4>
                        <span className="text-xs text-primary-foreground/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            Online
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 text-primary-foreground" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {isLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Đang tải...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <MessageCircle className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <p>Bắt đầu cuộc trò chuyện</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex flex-col max-w-[80%]",
                                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "px-3 py-2 rounded-2xl text-sm",
                                        isMe
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-muted text-foreground rounded-bl-none"
                                    )}
                                >
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                    {format(new Date(msg.created_at), 'HH:mm')}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-background border-t border-border">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 rounded-full bg-muted border-none focus-visible:ring-1"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="rounded-full shrink-0"
                        disabled={!newMessage.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
