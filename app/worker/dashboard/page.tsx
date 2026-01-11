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

            // PERFORMANCE FIX: Parallelize all data fetching
            const [
                { data: profile },
                { data: upcomingShifts },
                { data: recentApps },
                { data: recommendations }
            ] = await Promise.all([
                // Fetch profile with only needed fields
                supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, reliability_score, profile_completion_percentage, onboarding_completed')
                    .eq('id', user.id)
                    .single(),

                // Fetch next upcoming shift
                supabase
                    .from('job_applications')
                    .select(`
                      id, status, created_at,
                      job:jobs(id, title, restaurant_name, location_name, shift_date, shift_start_time, shift_end_time)
                    `)
                    .eq('worker_id', user.id)
                    .eq('status', 'approved')
                    .gte('job.shift_date', new Date().toISOString().split('T')[0])
                    .order('job.shift_date', { ascending: true })
                    .limit(1),

                // Fetch recent application statuses
                supabase
                    .from('job_applications')
                    .select(`
                      id, status, created_at,
                      job:jobs(title, restaurant_name, hourly_rate)
                    `)
                    .eq('worker_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3),

                // Fetch recommended jobs
                supabase
                    .from('jobs')
                    .select('id, title, restaurant_name, hourly_rate, created_at')
                    .eq('status', 'open')
                    .order('created_at', { ascending: false })
                    .limit(2)
            ]);

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
            // Remove console.error in production
            if (process.env.NODE_ENV === 'development') {
                console.error('Dashboard fetch error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-muted rounded-full animate-spin border-t-primary"></div>
                        <Zap className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground animate-pulse">{t('dashboard.loadingDashboard')}</p>
                </div>
            </div>
        );
    }

    const profile = data?.profile;
    const nextShift = data?.upcomingShift?.job;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Elegant Header */}
            <div className="bg-card/80 border-b border-border px-4 py-4 sticky top-0 z-20 backdrop-blur-md">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="font-bold text-xl text-foreground">TAPY</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
                        </button>
                        <Link href="/worker/profile" className="cursor-pointer">
                            <div className="w-9 h-9 rounded-full bg-muted border-2 border-border overflow-hidden hover:border-primary transition-colors">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-xs">
                                        {profile?.full_name?.split(' ').pop()?.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-primary pt-8 pb-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="text-white">
                        <p className="text-blue-100 text-sm font-medium mb-1">{t('dashboard.welcomeBack')}</p>
                        <h2 className="text-3xl font-bold mb-3">{profile?.full_name}</h2>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                            <TrendingUp className="w-4 h-4 text-green-300" />
                            <span className="text-xs font-semibold text-blue-50">{t('dashboard.level')}</span>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 flex items-center gap-4">
                        <div className="w-12 h-12 bg-warning/90 rounded-xl flex items-center justify-center">
                            <Star className="w-7 h-7 text-white fill-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-xs font-semibold mb-1">{t('dashboard.reliabilityScore')}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">{profile?.reliability_score || 100}</span>
                                <span className="text-white/50 text-sm font-medium">/100</span>
                            </div>
                        </div>
                        <div className="ml-2 pl-4 border-l border-white/20">
                            <p className="text-success text-sm font-bold flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" /> +2.4
                            </p>
                            <p className="text-white/50 text-xs font-medium">{t('dashboard.thisWeek')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-10 space-y-6 pb-12 relative z-10">
                {/* Main Action Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left & Middle Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card / Next Shift */}
                        {nextShift ? (
                            <div className="bg-card rounded-2xl border border-border overflow-hidden card-hover">
                                <div className="bg-foreground px-6 py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-success rounded-full animate-ping"></div>
                                        <span className="text-sm font-semibold text-white">{t('dashboard.upcomingShift')}</span>
                                    </div>
                                    <span className="text-xs font-medium text-muted opacity-60">ID #SR{nextShift.id.slice(0, 4)}</span>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground mb-3 leading-tight">{nextShift.title}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                                                    <Building2 className="w-4 h-4 text-primary" /> {nextShift.restaurant_name}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                                                    <MapPin className="w-4 h-4" /> {nextShift.location_name || t('dashboard.defaultLocation')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-muted p-4 rounded-xl flex flex-col items-end shrink-0 min-w-[140px]">
                                            <p className="text-xs font-semibold text-muted-foreground mb-1">{format(new Date(nextShift.shift_date), 'EEEE, dd/MM', { locale: dateLocale })}</p>
                                            <p className="text-xl font-bold text-primary">{nextShift.shift_start_time} - {nextShift.shift_end_time}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Link href={`/worker/jobs/${data.upcomingShift.id}/qr`} className="flex-1">
                                            <Button size="lg" variant="cta" className="w-full">
                                                <QrCode className="w-5 h-5" />
                                                {t('dashboard.qrCodeCheckIn')}
                                            </Button>
                                        </Link>
                                        <Button size="lg" variant="outline" className="flex-1">
                                            {t('dashboard.viewMap')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card rounded-2xl border border-border p-10 text-center group card-hover">
                                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6 transition-colors group-hover:bg-primary/20">
                                    <Zap className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{t('dashboard.newOpportunities')}</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t('dashboard.noUpcomingShift')}</p>
                                <Link href="/worker/feed">
                                    <Button size="lg" variant="cta" className="mx-auto">
                                        {t('dashboard.findJobs')} <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Recent History */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-primary" />
                                    {t('dashboard.recentApplications')}
                                </h3>
                                <Link href="/worker/jobs" className="text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer">
                                    {t('dashboard.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {data.recentApps?.length > 0 ? (
                                    data.recentApps.map((app: any) => (
                                        <div key={app.id} className="flex justify-between items-center p-4 rounded-xl interactive-hover border border-transparent hover:border-border cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 bg-muted rounded-lg flex items-center justify-center font-bold text-muted-foreground text-base">
                                                    {app.job.restaurant_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground leading-none mb-1">{app.job.title}</p>
                                                    <p className="text-xs font-medium text-muted-foreground">{app.job.restaurant_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn(
                                                    "text-xs font-semibold px-2.5 py-1 rounded-md",
                                                    app.status === 'pending' ? "bg-warning/10 text-warning" :
                                                        app.status === 'approved' ? "bg-success/10 text-success" :
                                                            "bg-muted text-muted-foreground"
                                                )}>
                                                    {app.status === 'pending' ? t('common.status.pending') :
                                                        app.status === 'approved' ? t('common.status.approved') :
                                                            t(`common.status.${app.status}`) || app.status}
                                                </span>
                                                <p className="text-xs font-medium text-muted-foreground mt-1.5">{format(new Date(app.created_at || new Date()), 'dd/MM/yyyy')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('dashboard.noApplications')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side Info */}
                    <div className="space-y-6">
                        {/* Wallet Card */}
                        <div className="bg-card rounded-2xl border border-border p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -mr-16 -mt-16"></div>

                            <div className="relative z-10">
                                <h3 className="text-sm font-bold text-success mb-6 flex items-center gap-2">
                                    <Wallet className="w-4 h-4" /> {t('dashboard.wallet.title')}
                                </h3>

                                <div className="mb-6">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">{t('dashboard.wallet.currentBalance')}</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-foreground">{data.earnings.total.toLocaleString()}</p>
                                        <p className="text-sm font-medium text-muted-foreground">đ</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-muted p-3 rounded-lg">
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">{t('dashboard.wallet.thisMonth')}</p>
                                        <p className="text-sm font-bold text-foreground">0đ</p>
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg">
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">{t('dashboard.wallet.shiftsCompleted')}</p>
                                        <p className="text-sm font-bold text-foreground">0 {t('dashboard.wallet.shifts')}</p>
                                    </div>
                                </div>

                                <Button disabled className="w-full">
                                    {t('dashboard.wallet.withdraw')}
                                </Button>
                            </div>
                        </div>

                        {/* Top Recommendations */}
                        <div className="bg-muted/50 rounded-2xl p-6 border border-border">
                            <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-cta" /> {t('dashboard.hotJobs')}
                            </h4>

                            <div className="space-y-3">
                                {recommendedJobs.length > 0 ? (
                                    recommendedJobs.map((job) => (
                                        <div key={job.id} className="bg-card p-4 rounded-xl border border-border card-hover">
                                            <p className="text-xs font-semibold text-primary mb-1">{job.restaurant_name}</p>
                                            <h5 className="font-semibold text-foreground text-sm mb-3">{job.title}</h5>
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-bold text-foreground">{job.hourly_rate?.toLocaleString()}đ/h</p>
                                                <Link href="/worker/feed" className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">{t('common.details')}</Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-sm font-medium text-muted-foreground">
                                        {t('dashboard.updatingRecommendations')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Completion Card */}
                        {profile?.profile_completion_percentage < 100 && !profile?.onboarding_completed && (
                            <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-sm">
                                            {profile?.profile_completion_percentage || 0}%
                                        </div>
                                        <p className="text-xs font-semibold text-blue-100">{t('dashboard.profileCompletion.percentage')}</p>
                                    </div>
                                    <h4 className="text-lg font-bold mb-2 leading-tight">{t('dashboard.profileCompletion.boost')}</h4>
                                    <p className="text-sm font-medium text-blue-100 mb-6 leading-relaxed">{t('dashboard.profileCompletion.description')}</p>
                                    <Link href="/worker/profile">
                                        <Button size="lg" className="w-full bg-white text-primary hover:bg-blue-50 group">
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
