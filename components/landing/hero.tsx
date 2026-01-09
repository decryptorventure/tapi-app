'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, CheckCircle, Star, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function Hero() {
    const { t, locale } = useTranslation();

    return (
        <section className="relative pt-32 pb-24 overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full shadow-sm animate-fade-in">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">
                            {t('landing.tagline')}
                        </span>
                    </div>

                    <h1 className="mb-8 text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                        {t('landing.headline')}<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient">
                            {t('landing.headlineHighlight')}
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto mb-12 text-lg sm:text-xl text-slate-600 leading-relaxed">
                        {t('landing.description')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button className="w-full sm:w-auto px-10 py-7 text-lg rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-200/50 hover:shadow-2xl hover:shadow-blue-300/50 transition-all group font-bold">
                                {t('landing.getStarted')}
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" className="w-full sm:w-auto px-10 py-7 text-lg rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold">
                                {t('landing.login')}
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="font-medium">{locale === 'vi' ? 'Miễn phí đăng ký' : 'Free to join'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <span className="font-medium">{locale === 'vi' ? 'Đánh giá 4.9/5' : '4.9/5 Rating'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">{locale === 'vi' ? '10,000+ người dùng' : '10,000+ Users'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-20 left-0 -ml-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 -mr-40 -mb-40 w-[600px] h-[600px] bg-gradient-to-tl from-purple-200/30 to-pink-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-100/20 to-transparent rounded-full pointer-events-none" />
        </section>
    );
}
