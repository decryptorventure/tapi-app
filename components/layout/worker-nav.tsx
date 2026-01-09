'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Briefcase, User, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkerNav() {
    const pathname = usePathname();

    const navItems = [
        {
            href: '/worker/dashboard',
            label: 'Trang chủ',
            icon: Home,
        },
        {
            href: '/worker/feed', // We will move the feed here
            label: 'Tìm việc',
            icon: Search,
        },
        {
            href: '/worker/jobs',
            label: 'Của tôi',
            icon: Briefcase,
        },
        {
            href: '/worker/profile',
            label: 'Hồ sơ',
            icon: User,
        },
    ];

    // Don't show nav on onboarding pages or specific flows if needed
    if (pathname.includes('/onboarding')) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-50 pb-safe">
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
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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
