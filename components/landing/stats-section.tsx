'use client';

import { useTranslation } from '@/lib/i18n';
import { TrendingUp, Users, Briefcase, Star, Clock, Shield } from 'lucide-react';

interface Stat {
    icon: React.ElementType;
    value: string;
    labelVi: string;
    labelEn: string;
    suffix?: string;
}

const stats: Stat[] = [
    {
        icon: Users,
        value: '10,000',
        suffix: '+',
        labelVi: 'Người dùng đăng ký',
        labelEn: 'Registered Users',
    },
    {
        icon: Briefcase,
        value: '5,000',
        suffix: '+',
        labelVi: 'Việc làm đã đăng',
        labelEn: 'Jobs Posted',
    },
    {
        icon: TrendingUp,
        value: '98',
        suffix: '%',
        labelVi: 'Tỷ lệ hài lòng',
        labelEn: 'Satisfaction Rate',
    },
    {
        icon: Clock,
        value: '24',
        suffix: 'h',
        labelVi: 'Thời gian phản hồi',
        labelEn: 'Response Time',
    },
];

const features = [
    {
        icon: Shield,
        titleVi: 'Xác minh danh tính',
        titleEn: 'Verified Identities',
        descVi: 'Tất cả người dùng đều được xác minh',
        descEn: 'All users are identity verified',
    },
    {
        icon: Star,
        titleVi: 'Đánh giá minh bạch',
        titleEn: 'Transparent Reviews',
        descVi: 'Hệ thống đánh giá 2 chiều công bằng',
        descEn: 'Fair two-way rating system',
    },
];

export function StatsSection() {
    const { locale } = useTranslation();

    return (
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
            <div className="container px-4 mx-auto max-w-6xl">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="text-center p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Icon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">
                                    {stat.value}
                                    <span className="text-primary">{stat.suffix}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {locale === 'vi' ? stat.labelVi : stat.labelEn}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Trust Features */}
                <div className="grid md:grid-cols-2 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="flex items-start gap-4 p-6 bg-card rounded-2xl border border-border"
                            >
                                <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Icon className="w-7 h-7 text-success" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">
                                        {locale === 'vi' ? feature.titleVi : feature.titleEn}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {locale === 'vi' ? feature.descVi : feature.descEn}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
