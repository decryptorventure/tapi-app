'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Smartphone, Users, Briefcase } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function CTA() {
    const { locale } = useTranslation();

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="max-w-5xl mx-auto">
                    {/* Main CTA Card */}
                    <div className="bg-gradient-to-br from-primary via-primary to-primary/90 rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cta/20 rounded-full blur-3xl -ml-32 -mb-32" />

                        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                            {/* Left Content */}
                            <div>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-foreground mb-6 leading-tight">
                                    {locale === 'vi'
                                        ? 'Sẵn sàng bắt đầu?'
                                        : 'Ready to Get Started?'}
                                </h2>
                                <p className="text-lg text-primary-foreground/80 mb-8 max-w-md">
                                    {locale === 'vi'
                                        ? 'Tham gia hàng nghìn nhân viên và nhà hàng đang sử dụng Tapy để kết nối cơ hội việc làm.'
                                        : 'Join thousands of workers and restaurants using Tapy to connect job opportunities.'}
                                </p>

                                {/* Dual CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link href="/signup?role=worker">
                                        <Button size="lg" variant="cta" className="w-full sm:w-auto bg-cta hover:bg-cta/90 text-cta-foreground font-bold px-8 py-6 shadow-xl group">
                                            <Users className="w-5 h-5 mr-2" />
                                            {locale === 'vi' ? 'Đăng ký tìm việc' : 'Sign Up as Worker'}
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                    <Link href="/signup?role=owner">
                                        <Button size="lg" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-primary-foreground border-2 border-white/30 font-bold px-8 py-6 backdrop-blur-sm group">
                                            <Briefcase className="w-5 h-5 mr-2" />
                                            {locale === 'vi' ? 'Đăng tuyển dụng' : 'Post a Job'}
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Right Content - App Preview Mockup */}
                            <div className="hidden lg:flex justify-center">
                                <div className="relative">
                                    {/* Phone Frame */}
                                    <div className="w-64 h-[500px] bg-foreground/10 backdrop-blur-xl rounded-[3rem] p-3 shadow-2xl border border-white/20">
                                        <div className="w-full h-full bg-card rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center">
                                            {/* App Content Preview */}
                                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
                                                <Smartphone className="w-8 h-8 text-primary-foreground" />
                                            </div>
                                            <div className="text-center px-6">
                                                <p className="text-xl font-black text-foreground mb-2">TAPY</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {locale === 'vi' ? 'Tải ứng dụng sắp ra mắt' : 'App coming soon'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating Badge */}
                                    <div className="absolute -top-4 -right-4 bg-cta text-cta-foreground px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                                        {locale === 'vi' ? 'Miễn phí!' : 'Free!'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
