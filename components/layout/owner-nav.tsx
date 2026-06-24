'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useState} from 'react';
import Image from 'next/image';
import {Briefcase, LayoutDashboard, LogOut, Settings, Store} from 'lucide-react';
import {cn} from '@/lib/utils';
import {createClient} from '@/lib/supabase/client';
import {NotificationBell} from '@/components/notifications/notification-bell';
import {LanguageSwitcher} from '@/components/shared/language-switcher';
import {useTranslation} from '@/lib/i18n';

export function OwnerNav() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('restaurant_name, restaurant_logo_url')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
        } catch {
            window.location.href = '/login';
        }
    };

    const navItems = [
        { href: '/owner/dashboard', label: t('common.nav_overview'), icon: LayoutDashboard },
        { href: '/owner/jobs', label: t('common.nav_jobs'), icon: Briefcase },
        { href: '/owner/settings', label: t('common.nav_settings'), icon: Settings },
    ];

    if (pathname.includes('/onboarding')) return null;

    return (
        <>
            {/* ── TOP HEADER (sticky) ── logo + LanguageSwitcher + NotificationBell */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container flex h-14 items-center justify-between px-4">
                    {/* Logo */}
                    <Link href="/owner/dashboard" className="flex items-center gap-2">
                        {profile?.restaurant_logo_url ? (
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative">
                                <Image
                                    src={profile.restaurant_logo_url}
                                    alt={profile.restaurant_name || 'Logo'}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Store className="w-4 h-4 text-orange-600" />
                            </div>
                        )}
                        <span className="font-bold text-base text-slate-800 truncate max-w-[150px]">
                            {profile?.restaurant_name || 'Tapy Owner'}
                        </span>
                    </Link>

                    {/* Right: Language + Notification */}
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher />
                        <NotificationBell />
                    </div>
                </div>
            </header>

            {/* ── BOTTOM NAV ── Dashboard · Jobs · Settings · Logout */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 z-50 pb-safe shadow-lg shadow-black/5">
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
                                    isActive ? "text-orange-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <div className={cn("p-1.5 rounded-xl transition-all", isActive && "bg-orange-50")}>
                                    <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                                </div>
                                <span className={cn("text-[10px] transition-all", isActive ? "font-bold" : "font-medium")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all min-w-[56px] text-slate-400 hover:text-red-500"
                    >
                        <div className="p-1.5 rounded-xl">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium">{t('common.logout')}</span>
                    </button>
                </div>
            </div>
        </>
    );
}
