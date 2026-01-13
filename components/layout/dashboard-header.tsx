'use client';

import Link from 'next/link';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
    title?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-bold text-xl text-blue-600">
                        Tapy
                    </Link>
                    {title && (
                        <>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-semibold">{title}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell />
                </div>
            </div>
        </header>
    );
}
