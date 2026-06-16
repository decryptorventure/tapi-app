'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import {
    UtensilsCrossed, Coffee, Beer, Soup, Pizza, IceCream, ChefHat, Salad, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
    { id: 'japanese',    icon: Soup,           labelKey: 'catJapanese',   jobCount: 120, color: 'text-red-500',    bgColor: 'bg-red-500/10 hover:bg-red-500/20' },
    { id: 'korean',      icon: UtensilsCrossed, labelKey: 'catKorean',    jobCount: 85,  color: 'text-orange-500', bgColor: 'bg-orange-500/10 hover:bg-orange-500/20' },
    { id: 'cafe',        icon: Coffee,          labelKey: 'catCafe',      jobCount: 200, color: 'text-amber-600',  bgColor: 'bg-amber-500/10 hover:bg-amber-500/20' },
    { id: 'bar',         icon: Beer,            labelKey: 'catBar',       jobCount: 65,  color: 'text-yellow-500', bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20' },
    { id: 'pizza',       icon: Pizza,           labelKey: 'catPizza',     jobCount: 95,  color: 'text-rose-500',   bgColor: 'bg-rose-500/10 hover:bg-rose-500/20' },
    { id: 'dessert',     icon: IceCream,        labelKey: 'catDessert',   jobCount: 45,  color: 'text-pink-500',   bgColor: 'bg-pink-500/10 hover:bg-pink-500/20' },
    { id: 'fine-dining', icon: ChefHat,         labelKey: 'catFineDining',jobCount: 30,  color: 'text-purple-500', bgColor: 'bg-purple-500/10 hover:bg-purple-500/20' },
    { id: 'healthy',     icon: Salad,           labelKey: 'catHealthy',   jobCount: 55,  color: 'text-green-500',  bgColor: 'bg-green-500/10 hover:bg-green-500/20' },
];

export function JobCategories() {
    const { t } = useTranslation();

    return (
        <section className="py-20 bg-muted/30">
            <div className="container px-4 mx-auto max-w-6xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                        {t('landing.exploreJobs')}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('landing.jobCategoriesDesc')}
                    </p>
                </div>

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
                                    {t(`landing.${category.labelKey}`)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {category.jobCount}+ {t('landing.jobs')}
                                </p>
                            </Link>
                        );
                    })}
                </div>

                <div className="text-center mt-10">
                    <Link
                        href="/worker/feed"
                        className="inline-flex items-center gap-2 text-primary font-semibold hover:underline group"
                    >
                        {t('landing.viewAllJobs')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
