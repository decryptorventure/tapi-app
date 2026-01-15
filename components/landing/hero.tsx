'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Smartphone, CheckCircle, Star, Users, Briefcase, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function Hero() {
    const { t, locale } = useTranslation();

    const stats = [
        {
            icon: Users,
            value: '10,000+',
            label: locale === 'vi' ? 'Người dùng' : 'Users',
        },
        {
            icon: Briefcase,
            value: '5,000+',
            label: locale === 'vi' ? 'Công việc' : 'Jobs',
        },
        {
            icon: Star,
            value: '4.9/5',
            label: locale === 'vi' ? 'Đánh giá' : 'Rating',
        },
    ];

    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/hero-restaurant.jpg"
                    alt="Restaurant workers"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient Overlay - Timee style */}
                <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            <div className="container px-4 mx-auto relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="max-w-xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-cta/10 border border-cta/20 rounded-full">
                            <Clock className="w-4 h-4 text-cta" />
                            <span className="text-sm font-bold text-cta uppercase tracking-wide">
                                {locale === 'vi' ? 'Việc làm theo ca' : 'Gig Jobs'}
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.05]">
                            {locale === 'vi' ? (
                                <>
                                    Tìm việc nhà hàng<br />
                                    <span className="text-cta">Chỉ trong 1 phút</span>
                                </>
                            ) : (
                                <>
                                    Find Restaurant Jobs<br />
                                    <span className="text-cta">In Just 1 Minute</span>
                                </>
                            )}
                        </h1>

                        {/* Description */}
                        <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
                            {locale === 'vi'
                                ? 'Nền tảng kết nối nhân viên nhà hàng với các cơ hội làm việc linh hoạt. Đăng ký miễn phí, nhận việc ngay.'
                                : 'Platform connecting restaurant workers with flexible job opportunities. Free signup, start working today.'}
                        </p>

                        {/* Dual CTA - Timee style */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-10">
                            <Link href="/signup?role=worker" className="flex-1 sm:flex-none">
                                <Button size="lg" variant="cta" className="w-full sm:w-auto text-base font-bold px-8 py-6 shadow-xl shadow-cta/30 hover:shadow-cta/40 transition-all group">
                                    {locale === 'vi' ? 'Tìm việc ngay' : 'Find Jobs Now'}
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link href="/signup?role=owner" className="flex-1 sm:flex-none">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-semibold px-8 py-6 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                                    {locale === 'vi' ? 'Đăng tuyển dụng' : 'Post a Job'}
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle className="w-5 h-5 text-success" />
                                <span className="font-medium">{locale === 'vi' ? 'Miễn phí 100%' : '100% Free'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle className="w-5 h-5 text-success" />
                                <span className="font-medium">{locale === 'vi' ? 'Xác minh danh tính' : 'Verified IDs'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle className="w-5 h-5 text-success" />
                                <span className="font-medium">{locale === 'vi' ? 'Thanh toán bảo đảm' : 'Secure Payments'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Stats Cards (visible on larger screens) */}
                    <div className="hidden lg:flex justify-end">
                        <div className="grid gap-4 w-full max-w-sm">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={index}
                                        className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <Icon className="w-7 h-7 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-3xl font-black text-foreground">{stat.value}</div>
                                                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Mobile Stats Row */}
                <div className="lg:hidden mt-12 grid grid-cols-3 gap-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4 text-center"
                            >
                                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                                <div className="text-xl font-black text-foreground">{stat.value}</div>
                                <div className="text-xs text-muted-foreground">{stat.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Wave Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>
    );
}
