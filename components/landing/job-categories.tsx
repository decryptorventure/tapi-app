'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import {
    UtensilsCrossed,
    Coffee,
    Beer,
    Soup,
    Pizza,
    IceCream,
    ChefHat,
    Salad,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
    id: string;
    icon: React.ElementType;
    labelVi: string;
    labelEn: string;
    jobCount: number;
    color: string;
    bgColor: string;
}

const categories: Category[] = [
    {
        id: 'japanese',
        icon: Soup,
        labelVi: 'Nhà hàng Nhật',
        labelEn: 'Japanese Restaurant',
        jobCount: 120,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10 hover:bg-red-500/20',
    },
    {
        id: 'korean',
        icon: UtensilsCrossed,
        labelVi: 'Nhà hàng Hàn',
        labelEn: 'Korean Restaurant',
        jobCount: 85,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10 hover:bg-orange-500/20',
    },
    {
        id: 'cafe',
        icon: Coffee,
        labelVi: 'Quán cà phê',
        labelEn: 'Cafe & Coffee',
        jobCount: 200,
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    },
    {
        id: 'bar',
        icon: Beer,
        labelVi: 'Bar & Pub',
        labelEn: 'Bar & Pub',
        jobCount: 65,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20',
    },
    {
        id: 'pizza',
        icon: Pizza,
        labelVi: 'Pizza & Fast Food',
        labelEn: 'Pizza & Fast Food',
        jobCount: 95,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10 hover:bg-rose-500/20',
    },
    {
        id: 'dessert',
        icon: IceCream,
        labelVi: 'Tráng miệng',
        labelEn: 'Desserts',
        jobCount: 45,
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10 hover:bg-pink-500/20',
    },
    {
        id: 'fine-dining',
        icon: ChefHat,
        labelVi: 'Fine Dining',
        labelEn: 'Fine Dining',
        jobCount: 30,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
    },
    {
        id: 'healthy',
        icon: Salad,
        labelVi: 'Healthy Food',
        labelEn: 'Healthy Food',
        jobCount: 55,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10 hover:bg-green-500/20',
    },
];

export function JobCategories() {
    const { locale } = useTranslation();

    return (
        <section className="py-20 bg-muted/30">
            <div className="container px-4 mx-auto max-w-6xl">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                        {locale === 'vi' ? 'Khám phá việc làm' : 'Explore Jobs'}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {locale === 'vi'
                            ? 'Tìm công việc phù hợp với kỹ năng và sở thích của bạn'
                            : 'Find jobs that match your skills and interests'}
                    </p>
                </div>

                {/* Categories Grid - Timee style */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <Link
                                key={category.id}
                                href={`/worker/feed?category=${category.id}`}
                                className={cn(
                                    "group flex flex-col items-center p-6 rounded-2xl border border-border bg-card transition-all",
                                    "hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
                                )}
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                                    category.bgColor
                                )}>
                                    <Icon className={cn("w-8 h-8", category.color)} />
                                </div>
                                <h3 className="font-bold text-foreground text-center mb-1">
                                    {locale === 'vi' ? category.labelVi : category.labelEn}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {category.jobCount}+ {locale === 'vi' ? 'việc' : 'jobs'}
                                </p>
                            </Link>
                        );
                    })}
                </div>

                {/* View All Link */}
                <div className="text-center mt-10">
                    <Link
                        href="/worker/feed"
                        className="inline-flex items-center gap-2 text-primary font-semibold hover:underline group"
                    >
                        {locale === 'vi' ? 'Xem tất cả việc làm' : 'View all jobs'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
