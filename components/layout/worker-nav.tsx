'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Briefcase, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export function WorkerNav() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const navItems = [
        {
            href: '/worker/dashboard',
            label: t('workerNav.home') || 'Trang chủ',
            icon: Home,
        },
        {
            href: '/worker/feed',
            label: t('workerNav.feed') || 'Tìm việc',
            icon: Search,
        },
        {
            href: '/worker/jobs',
            label: t('workerNav.myJobs') || 'Việc của tôi',
            icon: Briefcase,
        },
        {
            href: '/worker/wallet',
            label: t('workerNav.wallet') || 'Ví tiền',
            icon: Wallet,
        },
        {
            href: '/worker/profile',
            label: t('workerNav.profile') || 'Hồ sơ',
            icon: User,
        },
    ];

    // Don't show nav on onboarding pages or specific flows
    if (pathname.includes('/onboarding')) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 z-50 pb-safe shadow-lg shadow-black/5">
            <div className="flex justify-around items-center max-w-lg mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                        (item.href !== '/worker/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all min-w-[56px]",
                                isActive
                                    ? "text-blue-600"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all",
                                isActive && "bg-blue-50"
                            )}>
                                <Icon className={cn(
                                    "w-5 h-5 transition-transform",
                                    isActive && "scale-110"
                                )} />
                            </div>
                            <span className={cn(
                                "text-[10px] transition-all",
                                isActive ? "font-bold" : "font-medium"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

