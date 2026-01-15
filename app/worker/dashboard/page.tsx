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
    MapPin,
    Zap,
    Search,
    FileText,
    User,
    Award,
    QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';

export default function WorkerDashboardPage() {
    const router = useRouter();
    const { t, locale } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
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

            const [
                { data: profile },
                { data: upcomingShifts },
                { data: allApplications },
                { data: completedJobs }
            ] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, reliability_score, profile_completion_percentage, onboarding_completed')
                    .eq('id', user.id)
                    .single(),

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
                    .limit(3),

                supabase
                    .from('job_applications')
                    .select('id, status, created_at')
                    .eq('worker_id', user.id)
                    .order('created_at', { ascending: false }),

                supabase
                    .from('job_applications')
                    .select('id')
                    .eq('worker_id', user.id)
                    .eq('status', 'completed')
            ]);

            // Calculate stats
            const stats = {
                total: allApplications?.length || 0,
                pending: allApplications?.filter(a => a.status === 'pending').length || 0,
                approved: allApplications?.filter(a => a.status === 'approved').length || 0,
                completed: completedJobs?.length || 0
            };

            setData({
                profile,
                upcomingShifts: upcomingShifts || [],
                stats
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Dashboard fetch error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    const profile = data?.profile;
    const nextShift = data?.upcomingShifts?.[0]?.job;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Hero Section */}
            <div className="bg-primary pt-8 pb-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <p className="text-blue-100 text-sm font-medium mb-1">{t('dashboard.welcomeBack')}</p>
                    <h2 className="text-3xl font-bold text-white mb-3">{profile?.full_name}</h2>

                    {/* Reliability Score Card */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
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
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-success mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm font-bold">+2.4</span>
                                </div>
                                <p className="text-white/50 text-xs font-medium">{t('dashboard.thisWeek')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-10 space-y-6 pb-12 relative z-10">
                {/* Scan QR CTA - Only show if has approved jobs */}
                {data?.stats?.approved > 0 && (
                    <Link href="/worker/scan-qr">
                        <div className="bg-gradient-to-r from-success to-emerald-500 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                    <QrCode className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-lg">Scan QR Check-in</p>
                                    <p className="text-white/80 text-sm">Quét mã QR tại cửa hàng để check-in</p>
                                </div>
                                <ChevronRight className="w-6 h-6 text-white/80" />
                            </div>
                        </div>
                    </Link>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link href="/worker/scan-qr">
                        <div className="bg-card rounded-xl border border-border p-4 hover:border-success/50 hover:shadow-md transition-all cursor-pointer group">
                            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-success/20 transition-colors">
                                <QrCode className="w-5 h-5 text-success" />
                            </div>
                            <p className="font-semibold text-sm text-foreground">Scan QR</p>
                            <p className="text-xs text-muted-foreground mt-1">Check-in/out</p>
                        </div>
                    </Link>

                    <Link href="/worker/feed">
                        <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                                <Search className="w-5 h-5 text-primary" />
                            </div>
                            <p className="font-semibold text-sm text-foreground">Tìm việc</p>
                            <p className="text-xs text-muted-foreground mt-1">Khám phá jobs mới</p>
                        </div>
                    </Link>

                    <Link href="/worker/jobs">
                        <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                                <Briefcase className="w-5 h-5 text-blue-500" />
                            </div>
                            <p className="font-semibold text-sm text-foreground">Đơn của tôi</p>
                            <p className="text-xs text-muted-foreground mt-1">{data?.stats?.total || 0} đơn</p>
                        </div>
                    </Link>

                    <Link href="/worker/profile">
                        <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                                <User className="w-5 h-5 text-purple-500" />
                            </div>
                            <p className="font-semibold text-sm text-foreground">Hồ sơ</p>
                            <p className="text-xs text-muted-foreground mt-1">{profile?.profile_completion_percentage || 0}% hoàn thành</p>
                        </div>
                    </Link>

                    <Link href="/guide">
                        <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
                                <FileText className="w-5 h-5 text-green-500" />
                            </div>
                            <p className="font-semibold text-sm text-foreground">Hướng dẫn</p>
                            <p className="text-xs text-muted-foreground mt-1">Cách sử dụng</p>
                        </div>
                    </Link>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs font-medium text-muted-foreground">Tổng đơn</p>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{data?.stats?.total || 0}</p>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-warning" />
                            <p className="text-xs font-medium text-muted-foreground">Chờ duyệt</p>
                        </div>
                        <p className="text-2xl font-bold text-warning">{data?.stats?.pending || 0}</p>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <p className="text-xs font-medium text-muted-foreground">Đã duyệt</p>
                        </div>
                        <p className="text-2xl font-bold text-success">{data?.stats?.approved || 0}</p>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-primary" />
                            <p className="text-xs font-medium text-muted-foreground">Hoàn thành</p>
                        </div>
                        <p className="text-2xl font-bold text-primary">{data?.stats?.completed || 0}</p>
                    </div>
                </div>

                {/* Upcoming Shifts */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Ca làm sắp tới
                        </h3>
                        <Link href="/worker/jobs" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="p-6">
                        {data?.upcomingShifts?.length > 0 ? (
                            <div className="space-y-3">
                                {data.upcomingShifts.map((shift: any) => (
                                    <Link
                                        key={shift.id}
                                        href={`/worker/jobs/${shift.id}`}
                                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-border"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Briefcase className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground leading-none mb-1">{shift.job.title}</p>
                                                <p className="text-xs text-muted-foreground">{shift.job.restaurant_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-primary mb-1">
                                                {format(new Date(shift.job.shift_date), 'dd/MM', { locale: dateLocale })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {shift.job.shift_start_time} - {shift.job.shift_end_time}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : nextShift ? (
                            <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                                <h4 className="font-bold text-foreground mb-3">{nextShift.title}</h4>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                                        <MapPin className="w-4 h-4 text-primary" /> {nextShift.restaurant_name}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                                        <Calendar className="w-4 h-4" /> {format(new Date(nextShift.shift_date), 'EEEE, dd/MM', { locale: dateLocale })}
                                    </span>
                                </div>
                                <Link href={`/worker/jobs/${data.upcomingShifts[0].id}/qr`}>
                                    <Button size="lg" variant="default" className="w-full">
                                        Xem QR Check-in <ChevronRight className="w-5 h-5 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Chưa có ca làm nào</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                    Khám phá các công việc phù hợp với kỹ năng của bạn ngay!
                                </p>
                                <Link href="/worker/feed">
                                    <Button size="lg" variant="default">
                                        Tìm việc ngay <ChevronRight className="w-5 h-5 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Completion */}
                {profile?.profile_completion_percentage < 100 && !profile?.onboarding_completed && (
                    <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center font-bold text-primary">
                                {profile?.profile_completion_percentage || 0}%
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-foreground mb-1">Hoàn thiện hồ sơ</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Hồ sơ đầy đủ giúp bạn có nhiều cơ hội được nhận việc hơn!
                                </p>
                                <Link href="/worker/profile">
                                    <Button size="sm" variant="default">
                                        Cập nhật ngay <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
