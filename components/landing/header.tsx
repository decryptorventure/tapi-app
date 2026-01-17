'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Menu, X } from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslation } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createUntypedClient } from '@/lib/supabase/client';
import Image from 'next/image';

export function Header() {
    const { t, locale } = useTranslation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const supabase = createUntypedClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role, restaurant_name, restaurant_logo_url, onboarding_completed')
                    .eq('id', user.id)
                    .single();
                setUserProfile(data);
            }
        };
        fetchUserProfile();
    }, []);

    const navLinks = [
        { href: '/guide', label: locale === 'vi' ? 'Hướng dẫn' : 'Guide' },
        { href: '/faq', label: 'FAQ' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        {userProfile?.role === 'owner' && userProfile?.restaurant_logo_url ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform flex-shrink-0 relative">
                                <Image
                                    src={userProfile.restaurant_logo_url}
                                    alt={userProfile.restaurant_name || 'Logo'}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                                <Zap className="w-6 h-6 text-primary-foreground" />
                            </div>
                        )}
                        <span className="font-black text-2xl tracking-tight text-foreground truncate max-w-[150px]">
                            {(userProfile?.role === 'owner' && userProfile?.restaurant_name)
                                ? userProfile.restaurant_name.toUpperCase()
                                : 'TAPY'}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <LanguageSwitcher />
                        {userProfile ? (
                            <Link href={userProfile.role === 'owner' ? '/owner/dashboard' : '/worker/dashboard'}>
                                <Button size="sm" variant="cta" className="font-bold shadow-lg shadow-cta/20">
                                    Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="font-semibold">
                                        {t('landing.login')}
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm" variant="cta" className="font-bold shadow-lg shadow-cta/20">
                                        {t('landing.getStarted')}
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-foreground cursor-pointer"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "md:hidden border-t border-border bg-card overflow-hidden transition-all duration-300",
                    mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="container mx-auto px-4 py-4 space-y-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="block py-2 text-foreground font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-4 border-t border-border space-y-3">
                        {userProfile ? (
                            <Link href={userProfile.role === 'owner' ? '/owner/dashboard' : '/worker/dashboard'} className="block">
                                <Button variant="cta" className="w-full">
                                    Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="block">
                                    <Button variant="outline" className="w-full">
                                        {t('landing.login')}
                                    </Button>
                                </Link>
                                <Link href="/signup" className="block">
                                    <Button variant="cta" className="w-full">
                                        {t('landing.getStarted')}
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
