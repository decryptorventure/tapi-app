'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslation } from '@/lib/i18n';

export function Header() {
    const { t } = useTranslation();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 rotate-3 hover:rotate-0 transition-transform">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-black text-2xl tracking-tight text-slate-900 italic">TAPY</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/guide" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block">
                            Hướng dẫn
                        </Link>
                        <Link href="/faq" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block">
                            FAQ
                        </Link>
                        <LanguageSwitcher />
                        <Link href="/login">
                            <Button variant="ghost" className="font-semibold text-slate-600 hover:text-slate-900">
                                {t('landing.login')}
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all">
                                {t('landing.getStarted')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
