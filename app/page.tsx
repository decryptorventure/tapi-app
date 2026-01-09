'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Users, Zap, CheckCircle, Globe, Star, Briefcase } from 'lucide-react';
import { createUntypedClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { t, locale } = useTranslation();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createUntypedClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user.id)
          .single();

        // Only redirect if user has completed onboarding
        if (profile?.role === 'worker' && profile?.onboarding_completed) {
          router.push('/worker/dashboard');
          return;
        } else if (profile?.role === 'owner' && profile?.onboarding_completed) {
          router.push('/owner/dashboard');
          return;
        }
        // If has role but not completed onboarding, or no role yet - stay on landing page
        // User can click buttons to continue
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600"></div>
            <Zap className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 rotate-3 hover:rotate-0 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tight text-slate-900 italic">TAPY</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Link href="/login">
                <Button variant="ghost" className="font-semibold text-slate-600 hover:text-slate-900">
                  {t('landing.login')}
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all">
                  {t('landing.getStarted')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full shadow-sm animate-fade-in">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">
                {t('landing.tagline')}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="mb-8 text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
              {t('landing.headline')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient">
                {t('landing.headlineHighlight')}
              </span>
            </h1>

            {/* Description */}
            <p className="max-w-2xl mx-auto mb-12 text-lg sm:text-xl text-slate-600 leading-relaxed">
              {t('landing.description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button className="w-full sm:w-auto px-10 py-7 text-lg rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-200/50 hover:shadow-2xl hover:shadow-blue-300/50 transition-all group font-bold">
                  {t('landing.getStarted')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full sm:w-auto px-10 py-7 text-lg rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold">
                  {t('landing.login')}
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">{locale === 'vi' ? 'Miễn phí đăng ký' : 'Free to join'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">{locale === 'vi' ? 'Đánh giá 4.9/5' : '4.9/5 Rating'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{locale === 'vi' ? '10,000+ người dùng' : '10,000+ Users'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-20 left-0 -ml-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 -mr-40 -mb-40 w-[600px] h-[600px] bg-gradient-to-tl from-purple-200/30 to-pink-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-100/20 to-transparent rounded-full pointer-events-none" />
      </section>

      {/* Features Grid */}
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

      {/* How It Works Section */}
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

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[3rem] p-12 sm:p-16 relative overflow-hidden shadow-2xl">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-24 -mb-24" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {t('landing.readyToStart')}
              </h2>
              <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">
                {t('landing.joinNow')}
              </p>
              <Link href="/signup">
                <Button className="px-12 py-7 text-lg rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black shadow-xl hover:shadow-2xl transition-all group">
                  {t('landing.getStarted')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-xl text-slate-900 italic">TAPY</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 Tapy. {locale === 'vi' ? 'Bảo lưu mọi quyền.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                {locale === 'vi' ? 'Điều khoản' : 'Terms'}
              </Link>
              <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                {locale === 'vi' ? 'Bảo mật' : 'Privacy'}
              </Link>
              <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                {locale === 'vi' ? 'Liên hệ' : 'Contact'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
