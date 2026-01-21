'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Info, Mail, MessageCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification, NotificationService } from '@/lib/services/notification.service';
import { createUntypedClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        // Initial fetch
        fetchNotifications();

        // Realtime subscription
        const supabase = createUntypedClient();
        const channel = supabase
            .channel('notifications_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications((prev) => [newNotification, ...prev]);
                    setUnreadCount((prev) => prev + 1);

                    // Toast for immediate feedback
                    toast.info(newNotification.title, {
                        description: newNotification.message,
                        icon: <Bell className="w-4 h-4" />
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const data = await NotificationService.getNotifications(user.id);
            setNotifications(data);
            const count = await NotificationService.getUnreadCount(user.id);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
        if (currentlyRead) return;
        try {
            await NotificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read first
        await handleMarkAsRead(notification.id, notification.is_read);
        setIsOpen(false);

        // Handle navigation based on notification type
        if (notification.type === 'chat_message' && notification.related_id) {
            // related_id contains application_id, need to fetch job_id
            try {
                const supabase = createUntypedClient();
                const { data: application } = await supabase
                    .from('job_applications')
                    .select('job_id')
                    .eq('id', notification.related_id)
                    .single();

                if (application?.job_id) {
                    // Navigate to job page with chat=open param
                    router.push(`/worker/job/${application.job_id}?chat=open`);
                }
            } catch (error) {
                console.error('Failed to navigate to chat', error);
            }
        } else if (notification.type === 'application_update' && notification.related_id) {
            // Navigate to job page
            try {
                const supabase = createUntypedClient();
                const { data: application } = await supabase
                    .from('job_applications')
                    .select('job_id')
                    .eq('id', notification.related_id)
                    .single();

                if (application?.job_id) {
                    router.push(`/worker/job/${application.job_id}`);
                }
            } catch (error) {
                console.error('Failed to navigate', error);
            }
        }
    };

    const handleMarkAllRead = async () => {
        if (!user?.id || unreadCount === 0) return;
        try {
            await NotificationService.markAllAsRead(user.id);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'application_update':
                return <Info className="w-4 h-4 text-blue-500" />;
            case 'chat_message':
                return <MessageCircle className="w-4 h-4 text-green-500" />;
            case 'reminder':
                return <Bell className="w-4 h-4 text-yellow-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Thông báo</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2 text-muted-foreground hover:text-primary"
                            onClick={handleMarkAllRead}
                        >
                            Đánh dấu đã đọc
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Không có thông báo nào
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                    !notification.is_read && "bg-muted/50"
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex w-full items-start gap-2">
                                    <div className="mt-1 shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm font-medium leading-none", !notification.is_read && "text-foreground")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/70">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
