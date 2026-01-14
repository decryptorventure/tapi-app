'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Briefcase, User, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTranslation } from '@/lib/i18n';

export function WorkerNav() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const navItems = [
        {
            href: '/worker/dashboard',
            label: t('workerNav.home'),
            icon: Home,
        },
        {
            href: '/worker/feed', // We will move the feed here
            label: t('workerNav.feed'),
            icon: Search,
        },
        {
            href: '/worker/jobs',
            label: t('workerNav.myJobs'),
            icon: Briefcase,
        },
        {
            href: '/worker/profile',
            label: t('workerNav.profile'),
            icon: User,
        },
    ];

    // Don't show nav on onboarding pages or specific flows if needed
    if (pathname.includes('/onboarding')) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 z-50 pb-safe">
            <div className="flex justify-around items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/worker/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[64px]",
                                isActive
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
