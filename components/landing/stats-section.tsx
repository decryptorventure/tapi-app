'use client';

import { useTranslation } from '@/lib/i18n';
import { TrendingUp, Users, Briefcase, Star, Clock, Shield } from 'lucide-react';

const statIcons = [Users, Briefcase, TrendingUp, Clock];
const statValues = ['10,000', '5,000', '98', '24'];
const statSuffixes = ['+', '+', '%', 'h'];
const statKeys = ['statUsers', 'statJobs', 'statSatisfaction', 'statResponse'];

const featureIcons = [Shield, Star];
const featureTitleKeys = ['featureVerified', 'featureReviews'];
const featureDescKeys = ['featureVerifiedDesc', 'featureReviewsDesc'];

export function StatsSection() {
    const { t } = useTranslation();

    return (
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
            <div className="container px-4 mx-auto max-w-6xl">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {statKeys.map((key, index) => {
                        const Icon = statIcons[index];
                        return (
                            <div
                                key={index}
                                className="text-center p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Icon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">
                                    {statValues[index]}
                                    <span className="text-primary">{statSuffixes[index]}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {t(`landing.${key}`)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Trust Features */}
                <div className="grid md:grid-cols-2 gap-6">
                    {featureTitleKeys.map((titleKey, index) => {
                        const Icon = featureIcons[index];
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
                                        {t(`landing.${titleKey}`)}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {t(`landing.${featureDescKeys[index]}`)}
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
