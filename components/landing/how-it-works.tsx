'use client';

import { useTranslation } from '@/lib/i18n';
import { UserPlus, Search, Banknote, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Step {
    number: string;
    icon: React.ElementType;
    titleVi: string;
    titleEn: string;
    descVi: string;
    descEn: string;
}

const steps: Step[] = [
    {
        number: '01',
        icon: UserPlus,
        titleVi: 'Đăng ký miễn phí',
        titleEn: 'Sign Up Free',
        descVi: 'Tạo tài khoản chỉ trong 1 phút. Xác minh danh tính và bắt đầu ngay.',
        descEn: 'Create an account in 1 minute. Verify your identity and get started.',
    },
    {
        number: '02',
        icon: Search,
        titleVi: 'Tìm việc phù hợp',
        titleEn: 'Find Your Match',
        descVi: 'Lọc theo vị trí, ngôn ngữ, thời gian. Ứng tuyển ngay với 1 tap.',
        descEn: 'Filter by location, language, schedule. Apply instantly with one tap.',
    },
    {
        number: '03',
        icon: Banknote,
        titleVi: 'Làm việc & nhận tiền',
        titleEn: 'Work & Get Paid',
        descVi: 'Hoàn thành ca làm và nhận thanh toán nhanh chóng, an toàn.',
        descEn: 'Complete your shift and receive fast, secure payment.',
    },
];

export function HowItWorks() {
    const { locale } = useTranslation();

    return (
        <section className="py-24 bg-card relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cta/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="container px-4 mx-auto max-w-6xl relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold text-primary uppercase tracking-wide">
                            {locale === 'vi' ? 'Bắt đầu ngay' : 'Get Started'}
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                        {locale === 'vi' ? 'Cách hoạt động' : 'How It Works'}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {locale === 'vi'
                            ? 'Chỉ 3 bước đơn giản để bắt đầu kiếm tiền'
                            : 'Just 3 simple steps to start earning'}
                    </p>
                </div>

                {/* Steps - Timee style with numbered badges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
                    {/* Connection Line (desktop only) */}
                    <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.number} className="relative text-center group">
                                {/* Large Number Badge - Timee style */}
                                <div className="relative inline-flex mb-6">
                                    {/* Number background */}
                                    <div className="absolute -top-2 -left-2 text-7xl font-black text-primary/10 select-none">
                                        {step.number}
                                    </div>
                                    {/* Icon circle */}
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform">
                                        <Icon className="w-10 h-10 text-primary-foreground" />
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-black text-foreground mb-3">
                                    {locale === 'vi' ? step.titleVi : step.titleEn}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {locale === 'vi' ? step.descVi : step.descEn}
                                </p>

                                {/* Arrow (between steps on desktop) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-16 -right-6 lg:-right-8">
                                        <ArrowRight className="w-6 h-6 text-primary/30" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <Link href="/signup">
                        <Button size="lg" variant="cta" className="text-base font-bold px-8 py-6 shadow-xl shadow-cta/30 group">
                            {locale === 'vi' ? 'Bắt đầu miễn phí' : 'Start Free'}
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
