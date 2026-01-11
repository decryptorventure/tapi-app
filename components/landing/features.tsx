'use client';

import { Users, ShoppingBag, Zap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function Features() {
    const { t } = useTranslation();

    return (
        <section className="py-24 relative">
            <div className="container px-4 mx-auto max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* For Workers Card */}
                    <div className="group p-8 bg-card rounded-2xl border border-border card-hover">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 transition-colors group-hover:bg-primary/20">
                            <Users className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3">{t('landing.forWorkers')}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('landing.forWorkersDesc')}
                        </p>
                    </div>

                    {/* For Owners Card */}
                    <div className="group p-8 bg-card rounded-2xl border border-border card-hover">
                        <div className="w-14 h-14 bg-cta/10 rounded-xl flex items-center justify-center mb-6 transition-colors group-hover:bg-cta/20">
                            <ShoppingBag className="w-7 h-7 text-cta" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3">{t('landing.forOwners')}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('landing.forOwnersDesc')}
                        </p>
                    </div>

                    {/* Fast & Reliable Card */}
                    <div className="group p-8 bg-card rounded-2xl border border-border card-hover">
                        <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mb-6 transition-colors group-hover:bg-success/20">
                            <Zap className="w-7 h-7 text-success" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3">{t('landing.fastReliable')}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('landing.fastReliableDesc')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
