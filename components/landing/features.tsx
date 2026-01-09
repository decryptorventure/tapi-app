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
                    <div className="group p-8 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-200/30 hover:-translate-y-1">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 group-hover:rotate-3 transition-all">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4">{t('landing.forWorkers')}</h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            {t('landing.forWorkersDesc')}
                        </p>
                    </div>

                    {/* For Owners Card */}
                    <div className="group p-8 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-200/30 hover:-translate-y-1">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-200 group-hover:scale-110 group-hover:rotate-3 transition-all">
                            <ShoppingBag className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4">{t('landing.forOwners')}</h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            {t('landing.forOwnersDesc')}
                        </p>
                    </div>

                    {/* Fast & Reliable Card */}
                    <div className="group p-8 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-green-200/30 hover:-translate-y-1">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-200 group-hover:scale-110 group-hover:rotate-3 transition-all">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4">{t('landing.fastReliable')}</h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            {t('landing.fastReliableDesc')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
