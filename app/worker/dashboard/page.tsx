'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    Star,
    Calendar,
    Clock,
    Briefcase,
    TrendingUp,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Wallet,
    Bell,
    MapPin,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/shared/language-switcher';



export default function WorkerDashboardPage() {
    const router = useRouter();
    const { t, locale } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
    const supabase = createUntypedClient();
    const dateLocale = locale === 'vi' ? vi : enUS;

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Fetch next upcoming shift
            const { data: upcomingShifts } = await supabase
                .from('job_applications')
                .select(`
                  *,
                  job:jobs(*)
                `)
                .eq('worker_id', user.id)
                .eq('status', 'approved')
                .gte('job.shift_date', new Date().toISOString().split('T')[0])
                .order('job.shift_date', { ascending: true })
                .limit(1);

            // Fetch recent application statuses
            const { data: recentApps } = await supabase
                .from('job_applications')
                .select(`
                  *,
                  job:jobs(title, restaurant_name, hourly_rate)
                `)
                .eq('worker_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);

            // Fetch recommended jobs (mock for now, but real query)
            const { data: recommendations } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(2);

            // Mock earnings data
            const earnings = {
                total: profile?.reliability_score ? profile.reliability_score * 50000 : 0,
                thisMonth: 0
            };

            setData({
                profile,
                upcomingShift: upcomingShifts?.[0],
                recentApps,
                earnings
            });
            setRecommendedJobs(recommendations || []);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600"></div>
                        <Zap className="absolute inset-0 m-auto w-5 h-5 text-blue-600 animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">{t('dashboard.loadingDashboard')}</p>
                </div>
            </div>
        );
    }

    const profile = data?.profile;
    const nextShift = data?.upcomingShift?.job;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Elegant Header */}
            <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-20 backdrop-blur-md bg-white/80">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="font-black text-xl tracking-tight text-slate-900 italic">TAPY</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <Link href="/worker/profile">
                            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xs uppercase">
                                        {profile?.full_name?.split(' ').pop()?.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 pt-8 pb-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="text-white">
                        <p className="text-blue-100 text-sm font-medium mb-1 opacity-80 uppercase tracking-widest">{t('dashboard.welcomeBack')}</p>
                        <h2 className="text-3xl font-black mb-2">{profile?.full_name} ✨</h2>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            <TrendingUp className="w-3.5 h-3.5 text-green-300" />
                            <span className="text-xs font-bold text-blue-50 tracking-wide uppercase italic">{t('dashboard.level')}</span>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 flex items-center gap-5 shadow-2xl">
                        <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20 rotate-3">
                                <Star className="w-8 h-8 text-white fill-white shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">{t('dashboard.reliabilityScore')}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">{profile?.reliability_score || 100}</span>
                                <span className="text-white/40 text-sm font-bold">/100</span>
                            </div>
                        </div>
                        <div className="ml-2 pl-5 border-l border-white/10">
                            <p className="text-green-400 text-sm font-black flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" /> +2.4
                            </p>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-tighter">{t('dashboard.thisWeek')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-10 space-y-6 pb-12 relative z-10">
                {/* Main Action Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left & Middle Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card / Next Shift */}
                        {nextShift ? (
                            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform transition-all hover:scale-[1.01]">
                                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                                        <span className="text-sm font-black text-white uppercase tracking-wider">{t('dashboard.upcomingShift')}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase italic opacity-60">ID #SR{nextShift.id.slice(0, 4)}</span>
                                </div>
                                <div className="p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{nextShift.title}</h3>
                                            <div className="flex flex-wrap gap-3">
                                                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                    <Building2 className="w-4 h-4 text-blue-500" /> {nextShift.restaurant_name}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                                    <MapPin className="w-4 h-4" /> {nextShift.location_name || 'Quận 1, TP.HCM'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-[#F8FAFC] p-4 rounded-3xl border border-slate-100 flex flex-col items-end shrink-0 min-w-[140px]">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{format(new Date(nextShift.shift_date), 'EEEE, dd/MM', { locale: dateLocale })}</p>
                                            <p className="text-2xl font-black text-blue-600 tracking-tighter">{nextShift.shift_start_time} - {nextShift.shift_end_time}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Link href={`/worker/jobs/${data.upcomingShift.id}/qr`} className="flex-1">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-7 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                                                <QrCode className="w-6 h-6" />
                                                {t('dashboard.qrCodeCheckIn')}
                                            </Button>
                                        </Link>
                                        <Button variant="outline" className="flex-1 border-2 border-slate-100 rounded-2xl font-black py-7 text-slate-600 hover:bg-slate-50">
                                            {t('dashboard.viewMap')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 text-center group cursor-pointer hover:border-blue-200 transition-all">
                                <div className="w-20 h-20 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <Zap className="w-10 h-10 text-blue-600 fill-blue-600/10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{t('dashboard.newOpportunities')}</h3>
                                <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">{t('dashboard.noUpcomingShift')}</p>
                                <Link href="/worker/feed">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-7 rounded-2xl shadow-xl shadow-blue-200/50 flex items-center gap-2 mx-auto active:scale-95 transition-all">
                                        {t('dashboard.findJobs')} <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Recent History */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <Briefcase className="w-6 h-6 text-blue-500" />
                                    {t('dashboard.recentApplications')}
                                </h3>
                                <Link href="/worker/jobs" className="text-xs font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full flex items-center gap-1 transition-all">
                                    {t('dashboard.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {data.recentApps?.length > 0 ? (
                                    data.recentApps.map((app: any) => (
                                        <div key={app.id} className="flex justify-between items-center p-5 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-lg uppercase">
                                                    {app.job.restaurant_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 tracking-tight leading-none mb-1">{app.job.title}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{app.job.restaurant_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider border",
                                                    app.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                        app.status === 'approved' ? "bg-green-50 text-green-700 border-green-100" :
                                                            "bg-slate-50 text-slate-500 border-slate-200"
                                                )}>
                                                    {app.status === 'pending' ? '⏲️ Đang xét' : app.status === 'approved' ? '✅ Đã duyệt' : app.status}
                                                </span>
                                                <p className="text-[10px] font-bold text-slate-300 mt-2 italic">{format(new Date(app.created_at || new Date()), 'dd/MM/yyyy')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 italic">{t('dashboard.noApplications')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side Info */}
                    <div className="space-y-6">
                        {/* Wallet Card */}
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-slate-100 p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>

                            <div className="relative z-10">
                                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                    <Wallet className="w-4 h-4" /> {t('dashboard.wallet.title')}
                                </h3>

                                <div className="mb-10">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('dashboard.wallet.currentBalance')}</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{data.earnings.total.toLocaleString()}</p>
                                        <p className="text-sm font-black text-slate-500 uppercase italic">đ</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t('dashboard.wallet.thisMonth')}</p>
                                        <p className="text-sm font-black text-slate-900">0đ</p>
                                    </div>
                                    <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t('dashboard.wallet.shiftsCompleted')}</p>
                                        <p className="text-sm font-black text-slate-900">0 {t('dashboard.wallet.shifts')}</p>
                                    </div>
                                </div>

                                <Button className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl opacity-40 cursor-not-allowed text-xs uppercase tracking-widest">
                                    {t('dashboard.wallet.withdraw')}
                                </Button>
                            </div>
                        </div>

                        {/* Top Recommendations */}
                        <div className="bg-[#F1F5F9] rounded-[2rem] p-8 border border-slate-200 shadow-inner">
                            <h4 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                                <Zap className="w-4 h-4 text-orange-500 fill-orange-500" /> {t('dashboard.hotJobs')}
                            </h4>

                            <div className="space-y-4">
                                {recommendedJobs.length > 0 ? (
                                    recommendedJobs.map((job) => (
                                        <div key={job.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 group cursor-pointer hover:shadow-md transition-all">
                                            <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{job.restaurant_name}</p>
                                            <h5 className="font-black text-slate-900 text-sm mb-3 group-hover:text-blue-600 transition-colors">{job.title}</h5>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-black text-slate-900">{job.hourly_rate?.toLocaleString()}đ/h</p>
                                                <Link href="/worker/feed" className="text-[10px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-full hover:bg-blue-600 transition-colors">CHI TIẾT</Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-xs font-bold text-slate-400 italic">
                                        {t('dashboard.updatingRecommendations')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Completion Card */}
                        {profile?.profile_completion_percentage < 100 && (
                            <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black text-xs italic">80%</div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">{t('dashboard.profileCompletion.percentage')}</p>
                                    </div>
                                    <h4 className="text-xl font-black mb-2 leading-tight">{t('dashboard.profileCompletion.boost')}</h4>
                                    <p className="text-xs font-medium text-slate-400 mb-8 leading-relaxed">{t('dashboard.profileCompletion.description')}</p>
                                    <Link href="/worker/profile">
                                        <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black py-5 rounded-2xl flex items-center justify-center gap-2 group shadow-lg">
                                            {t('dashboard.profileCompletion.updateNow')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const Building2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
    </svg>
);

const QrCode = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16h.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
    </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
);
