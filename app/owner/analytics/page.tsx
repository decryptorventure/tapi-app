'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    BarChart3,
    TrendingUp,
    Users,
    Briefcase,
    DollarSign,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AnimatedCounter } from '@/components/shared/animated-counter';

interface AnalyticsData {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    totalSpent: number;
    averageWorkerScore: number;
    recentActivity: any[];
    jobsByMonth: { month: string; count: number }[];
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<AnalyticsData>({
        totalJobs: 0,
        activeJobs: 0,
        completedJobs: 0,
        totalApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
        totalSpent: 0,
        averageWorkerScore: 0,
        recentActivity: [],
        jobsByMonth: []
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        const supabase = createUntypedClient();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch all jobs
            const { data: jobs, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .eq('owner_id', user.id);

            if (jobsError) throw jobsError;

            const totalJobs = jobs?.length || 0;
            const activeJobs = jobs?.filter(j => j.status === 'open').length || 0;
            const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0;

            // Jobs by month (last 6 months)
            const jobsByMonth: { month: string; count: number }[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = subDays(new Date(), i * 30);
                const monthStart = startOfMonth(date);
                const monthEnd = endOfMonth(date);
                const count = jobs?.filter(j => {
                    const createdAt = new Date(j.created_at);
                    return createdAt >= monthStart && createdAt <= monthEnd;
                }).length || 0;
                jobsByMonth.push({
                    month: format(date, 'MMM', { locale: vi }),
                    count
                });
            }

            // Fetch applications
            const jobIds = jobs?.map(j => j.id) || [];
            let applicationStats = {
                total: 0,
                approved: 0,
                rejected: 0,
                avgScore: 0
            };

            if (jobIds.length > 0) {
                const { data: applications } = await supabase
                    .from('job_applications')
                    .select(`
                        id, status,
                        profiles:worker_id(reliability_score)
                    `)
                    .in('job_id', jobIds);

                applicationStats.total = applications?.length || 0;
                applicationStats.approved = applications?.filter(a => a.status === 'approved' || a.status === 'completed').length || 0;
                applicationStats.rejected = applications?.filter(a => a.status === 'rejected').length || 0;

                const scores = applications
                    ?.map((a: any) => a.profiles?.reliability_score)
                    .filter((s: any) => s !== null && s !== undefined) as number[];
                if (scores && scores.length > 0) {
                    applicationStats.avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                }
            }

            // Estimate total spent (hourly rate * hours * approved workers)
            let totalSpent = 0;
            if (jobs) {
                jobs.forEach(job => {
                    if (job.status === 'completed') {
                        const hours = calculateHours(job.shift_start_time, job.shift_end_time);
                        totalSpent += (job.hourly_rate_vnd || 0) * hours * (job.current_workers || 0);
                    }
                });
            }

            setData({
                totalJobs,
                activeJobs,
                completedJobs,
                totalApplications: applicationStats.total,
                approvedApplications: applicationStats.approved,
                rejectedApplications: applicationStats.rejected,
                totalSpent,
                averageWorkerScore: applicationStats.avgScore,
                recentActivity: [],
                jobsByMonth
            });
        } catch (error) {
            console.error('Analytics error:', error);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateHours = (start: string, end: string) => {
        if (!start || !end) return 0;
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        return Math.max(0, (endH + endM / 60) - (startH + startM / 60));
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAnalytics();
        toast.success('Đã cập nhật');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const maxJobCount = Math.max(...data.jobsByMonth.map(j => j.count), 1);

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/80">
                <div className="container mx-auto px-4 py-4 max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/owner/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h1 className="text-xl font-bold text-foreground">Thống kê</h1>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="h-9 w-9"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card rounded-2xl border border-border p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Briefcase className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-xs text-muted-foreground">Tổng tin</span>
                        </div>
                        <AnimatedCounter value={data.totalJobs} className="text-3xl font-bold text-foreground block" />
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-success/10 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-success" />
                            </div>
                            <span className="text-xs text-muted-foreground">Hoàn thành</span>
                        </div>
                        <AnimatedCounter value={data.completedJobs} className="text-3xl font-bold text-success block" />
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-warning/10 rounded-lg">
                                <Users className="w-4 h-4 text-warning" />
                            </div>
                            <span className="text-xs text-muted-foreground">Ứng tuyển</span>
                        </div>
                        <AnimatedCounter value={data.totalApplications} className="text-3xl font-bold text-warning block" />
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-xs text-muted-foreground">Đã chi</span>
                        </div>
                        <AnimatedCounter value={data.totalSpent} className="text-2xl font-bold text-emerald-600 block" suffix="đ" />
                    </div>
                </div>

                {/* Chart - Simple Bar Chart */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Tin tuyển theo tháng
                        </h3>
                    </div>
                    <div className="flex items-end justify-between gap-4 h-40">
                        {data.jobsByMonth.map((item, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all"
                                    style={{ height: `${(item.count / maxJobCount) * 100}%`, minHeight: item.count > 0 ? '20px' : '4px' }}
                                />
                                <span className="text-xs text-muted-foreground">{item.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Application Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card rounded-2xl border border-border p-6">
                        <h3 className="font-bold text-foreground mb-4">Tỷ lệ duyệt</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Đã duyệt</span>
                                    <span className="font-bold text-success">{data.approvedApplications}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-success rounded-full transition-all"
                                        style={{ width: `${data.totalApplications ? (data.approvedApplications / data.totalApplications) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Từ chối</span>
                                    <span className="font-bold text-destructive">{data.rejectedApplications}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-destructive rounded-full transition-all"
                                        style={{ width: `${data.totalApplications ? (data.rejectedApplications / data.totalApplications) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-6">
                        <h3 className="font-bold text-foreground mb-4">Chất lượng worker</h3>
                        <div className="flex items-center justify-center h-32">
                            <div className="text-center">
                                <AnimatedCounter
                                    value={data.averageWorkerScore || 0}
                                    className="text-5xl font-bold text-foreground block"
                                />
                                <p className="text-sm text-muted-foreground mt-2">Điểm tin cậy trung bình</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
