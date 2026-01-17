'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, QrCode, Settings, LogOut, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createUntypedClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function OwnerNav() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createUntypedClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const navItems = [
        {
            href: '/owner/dashboard',
            label: 'Tổng quan',
            icon: LayoutDashboard,
        },
        {
            href: '/owner/jobs',
            label: 'Tin tuyển dụng',
            icon: Briefcase,
        },
        {
            href: '/owner/scan-qr',
            label: 'Quét QR',
            icon: QrCode,
        },
        {
            href: '/owner/settings',
            label: 'Cài đặt',
            icon: Settings,
        },
    ];

    if (pathname.includes('/onboarding')) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-16 items-center px-4">
                <div className="mr-8 hidden md:flex">
                    <Link href="/owner/dashboard" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block text-xl text-orange-600">
                            Tapy Owner
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    pathname === item.href || (item.href !== '/owner/dashboard' && pathname.startsWith(item.href))
                                        ? "text-foreground"
                                        : "text-foreground/60"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Mobile View - Simplified */}
                <div className="md:hidden w-full flex justify-between items-center">
                    <Link href="/owner/dashboard" className="font-bold text-lg text-orange-600">
                        Tapy Owner
                    </Link>
                    <div className="flex gap-2 items-center">
                        <NotificationBell />
                        <Link href="/owner/jobs/new">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full border-dashed border-orange-300">
                                <Plus className="h-4 w-4 text-orange-600" />
                            </Button>
                        </Link>
                    </div>
                </div>


                <div className="hidden md:flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none flex justify-end gap-2">
                        <NotificationBell />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-slate-500 hover:text-red-600"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Đăng xuất</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Bottom Nav for Owners */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 z-50 pb-safe shadow-lg shadow-black/5">
                <div className="flex justify-around items-center max-w-lg mx-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== '/owner/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all min-w-[56px]",
                                    isActive
                                        ? "text-orange-600"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-xl transition-all",
                                    isActive && "bg-orange-50"
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
                    {/* Logout button for mobile */}
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all min-w-[56px] text-slate-400 hover:text-red-500"
                    >
                        <div className="p-1.5 rounded-xl">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium">Thoát</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
