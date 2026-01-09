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
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[3rem] p-12 sm:p-16 relative overflow-hidden shadow-2xl">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-24 -mb-24" />

                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                            {t('landing.readyToStart')}
                        </h2>
                        <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">
                            {t('landing.joinNow')}
                        </p>
                        <Link href="/signup">
                            <Button className="px-12 py-7 text-lg rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black shadow-xl hover:shadow-2xl transition-all group">
                                {t('landing.getStarted')}
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
