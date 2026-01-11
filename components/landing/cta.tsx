'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function CTA() {
    const { t } = useTranslation();

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-12 sm:p-16 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -ml-24 -mb-24" />

                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {t('landing.readyToStart')}
                        </h2>
                        <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
                            {t('landing.joinNow')}
                        </p>
                        <Link href="/signup">
                            <Button size="lg" className="bg-white text-primary hover:bg-blue-50 font-semibold group">
                                {t('landing.getStarted')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
