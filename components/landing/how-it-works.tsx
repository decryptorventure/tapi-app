'use client';

import { useTranslation } from '@/lib/i18n';

export function HowItWorks() {
    const { t } = useTranslation();

    return (
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
            <div className="container px-4 mx-auto max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
                        {t('landing.howItWorks')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connection Line */}
                    <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-purple-200" />

                    {/* Step 1 */}
                    <div className="relative text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 text-white font-black text-xl relative z-10">
                            1
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3">{t('landing.step1Title')}</h3>
                        <p className="text-slate-600">{t('landing.step1Desc')}</p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 text-white font-black text-xl relative z-10">
                            2
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3">{t('landing.step2Title')}</h3>
                        <p className="text-slate-600">{t('landing.step2Desc')}</p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-200 text-white font-black text-xl relative z-10">
                            3
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3">{t('landing.step3Title')}</h3>
                        <p className="text-slate-600">{t('landing.step3Desc')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
