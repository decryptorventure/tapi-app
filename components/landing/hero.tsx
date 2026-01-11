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
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-primary/10 border border-primary/20 rounded-full">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                            {t('landing.tagline')}
                        </span>
                    </div>

                    <h1 className="mb-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                        {t('landing.headline')}<br />
                        <span className="text-gradient-primary">
                            {t('landing.headlineHighlight')}
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto mb-10 text-base sm:text-lg text-muted-foreground leading-relaxed">
                        {t('landing.description')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg" variant="cta" className="w-full sm:w-auto group">
                                {t('landing.getStarted')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                {t('landing.login')}
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-success" />
                            <span className="font-medium">{locale === 'vi' ? 'Miễn phí đăng ký' : 'Free to join'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-warning fill-warning" />
                            <span className="font-medium">{locale === 'vi' ? 'Đánh giá 4.9/5' : '4.9/5 Rating'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            <span className="font-medium">{locale === 'vi' ? '10,000+ người dùng' : '10,000+ Users'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-20 left-0 -ml-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 -mr-40 -mb-40 w-[600px] h-[600px] bg-cta/5 rounded-full blur-3xl pointer-events-none" />
        </section>
    );
}
