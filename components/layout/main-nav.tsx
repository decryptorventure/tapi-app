'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

export function MainNav() {
    const pathname = usePathname();

    // Hide on auth pages or onboarding or dashboard
    if (pathname.startsWith('/onboarding') || pathname.startsWith('/worker') || pathname.startsWith('/owner')) {
        return null;
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="container flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="font-bold text-2xl text-blue-600">Tapy</span>
                </Link>

                <div className="flex items-center gap-4">
                    <LanguageSwitcher />

                    {!pathname.includes('/login') && !pathname.includes('/signup') && (
                        <div className="flex gap-2">
                            <Link href="/login">
                                <Button variant="ghost" className="font-medium">
                                    Đăng nhập
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Đăng ký
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
