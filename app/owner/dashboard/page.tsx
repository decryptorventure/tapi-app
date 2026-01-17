'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ProfileCompletionBanner } from '@/components/shared/profile-completion-banner';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import {
    Briefcase,
    Users,
    Clock,
    Plus,
    QrCode,
    ChevronRight,
    Building2,
    Loader2,
    AlertCircle,
    Bell,
    Store,
    LayoutDashboard,
    Search,
    UserCircle2,
    Star,
    Zap,
    ArrowUpRight,
    Check,
    X,
    Sparkles,
    TrendingUp,
    BarChart3,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { WorkerProfileModal } from '@/components/owner/worker-profile-modal';
import { AnimatedCounter } from '@/components/shared/animated-counter';

interface DashboardStats {
    activeJobs: number;
    pendingApplications: number;
    totalWorkers: number;
}

interface OwnerProfile {
    id: string;
    full_name: string;
    restaurant_name: string | null;
    profile_completion_percentage: number;
    can_post_jobs: boolean;
    role: string;
    avatar_url?: string;
}

export default function OwnerDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<OwnerProfile | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        activeJobs: 0,
        pendingApplications: 0,
        totalWorkers: 0,
    });
    const [recentApplications, setRecentApplications] = useState<any[]>([]);
    const [todayShifts, setTodayShifts] = useState<any[]>([]);
    const [workersOnDuty, setWorkersOnDuty] = useState<any[]>([]);

    // Modal state
    const [selectedWorker, setSelectedWorker] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const viewWorkerProfile = async (workerId: string) => {
        const supabase = createUntypedClient();
        setLoading(true);
        try {
            const { data: worker } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', workerId)
                .single();

            const { data: skills } = await supabase
                .from('language_skills')
                .select('*')
                .eq('user_id', workerId);

            setSelectedWorker({ ...worker, skills });
            setIsModalOpen(true);
        } catch (error) {
            toast.error('Không thể tải thông tin ứng viên');
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardData = async () => {
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch owner profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            if (profileData.role !== 'owner') {
                router.push('/');
                return;
            }

            setProfile(profileData);

            // Fetch active jobs count
            const { count: activeJobsCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', user.id)
                .eq('status', 'open');

            // Fetch pending applications count
            const { data: jobIds } = await supabase
                .from('jobs')
                .select('id')
                .eq('owner_id', user.id);

            let pendingCount = 0;
            let totalWorkersCount = 0;

            if (jobIds && jobIds.length > 0) {
                const ids = jobIds.map(j => j.id);

                const { count: pending } = await supabase
                    .from('job_applications')
                    .select('*', { count: 'exact', head: true })
                    .in('job_id', ids)
                    .eq('status', 'pending');

                const { count: approved } = await supabase
                    .from('job_applications')
                    .select('*', { count: 'exact', head: true })
                    .in('job_id', ids)
                    .in('status', ['approved', 'completed']);

                pendingCount = pending || 0;
                totalWorkersCount = approved || 0;
            }

            setStats({
                activeJobs: activeJobsCount || 0,
                pendingApplications: pendingCount,
                totalWorkers: totalWorkersCount,
            });

            // Fetch recent applications
            if (jobIds && jobIds.length > 0) {
                const ids = jobIds.map(j => j.id);

                const { data: applications } = await supabase
                    .from('job_applications')
                    .select(`
                        id,
                        status,
                        applied_at,
                        is_instant_book,
                        job_id,
                        worker_id,
                        profiles:worker_id(full_name, avatar_url, reliability_score)
                    `)
                    .in('job_id', ids)
                    .order('applied_at', { ascending: false })
                    .limit(5);

                if (applications && applications.length > 0) {
                    // Fetch job titles
                    const jobsRes = await supabase
                        .from('jobs')
                        .select('id, title')
                        .in('id', applications.map(a => a.job_id));

                    const jobMap = new Map(jobsRes.data?.map(j => [j.id, j.title]) || []);

                    const formattedApps = applications.map((app: any) => ({
                        id: app.id,
                        worker_id: app.worker_id,
                        worker_name: app.profiles?.full_name || 'Ứng viên',
                        worker_avatar: app.profiles?.avatar_url,
                        worker_score: app.profiles?.reliability_score,
                        job_title: jobMap.get(app.job_id) || 'Unknown',
                        status: app.status,
                        applied_at: app.applied_at,
                        is_instant_book: app.is_instant_book,
                    }));

                    setRecentApplications(formattedApps);
                }

                // Fetch today's shifts
                const today = new Date().toISOString().split('T')[0];
                const { data: todayJobsData } = await supabase
                    .from('jobs')
                    .select(`
                        id, title, shift_date, shift_start_time, shift_end_time, 
                        current_workers, max_workers, restaurant_name
                    `)
                    .in('id', ids)
                    .eq('shift_date', today)
                    .order('shift_start_time', { ascending: true });

                if (todayJobsData) {
                    setTodayShifts(todayJobsData);
                }

                // Fetch workers on duty (checked-in today)
                const { data: checkinsToday } = await supabase
                    .from('checkins')
                    .select(`
                        id, type, checkin_time,
                        application:job_applications(
                            id, job_id,
                            worker:profiles(id, full_name, avatar_url),
                            job:jobs(id, title)
                        )
                    `)
                    .gte('checkin_time', `${today}T00:00:00`)
                    .eq('type', 'checkin')
                    .order('checkin_time', { ascending: false });

                if (checkinsToday) {
                    // Filter to only jobs owned by this user
                    const ownerJobIds = new Set(ids);
                    const filteredCheckins = checkinsToday.filter((c: any) =>
                        c.application?.job_id && ownerJobIds.has(c.application.job_id)
                    );

                    const workersData = filteredCheckins.map((c: any) => ({
                        id: c.id,
                        worker_id: c.application?.worker?.id,
                        worker_name: c.application?.worker?.full_name || 'Worker',
                        worker_avatar: c.application?.worker?.avatar_url,
                        job_title: c.application?.job?.title || 'Unknown',
                        checkin_time: c.checkin_time,
                    }));

                    setWorkersOnDuty(workersData);
                }
            }
        } catch (error: any) {
            console.error('Dashboard fetch error:', error);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveApplication = async (applicationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const supabase = createUntypedClient();
        try {
            const { error } = await supabase
                .from('job_applications')
                .update({ status: 'approved' })
                .eq('id', applicationId);

            if (error) throw error;
            toast.success('Đã duyệt ứng viên');
            fetchDashboardData();
        } catch (error) {
            toast.error('Lỗi duyệt ứng viên');
        }
    };

    const handleRejectApplication = async (applicationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const supabase = createUntypedClient();
        try {
            const { error } = await supabase
                .from('job_applications')
                .update({ status: 'rejected' })
                .eq('id', applicationId);

            if (error) throw error;
            toast.success('Đã từ chối ứng viên');
            fetchDashboardData();
        } catch (error) {
            toast.error('Lỗi từ chối ứng viên');
        }
    };

    const getStatusBadge = (status: string, isInstantBook: boolean) => {
        if (status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-warning/10 text-warning">
                    <Clock className="w-3 h-3" />
                    Chờ duyệt
                </span>
            );
        } else if (status === 'approved') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">
                    {isInstantBook ? <Sparkles className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    {isInstantBook ? 'Instant Book' : 'Đã duyệt'}
                </span>
            );
        } else if (status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-destructive">
                    <X className="w-3 h-3" />
                    Từ chối
                </span>
            );
        } else if (status === 'completed') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                    <Check className="w-3 h-3" />
                    Hoàn thành
                </span>
            );
        }
        return null;
    };

    if (loading && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-cta" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <WorkerProfileModal
                worker={selectedWorker}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                languageSkills={selectedWorker?.skills || []}
            />

            {/* Header Area */}
            <div className="bg-card border-b border-border sticky top-0 z-30 backdrop-blur-sm bg-card/80">
                <div className="container mx-auto px-4 py-4 max-w-5xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cta to-cta/80 rounded-2xl flex items-center justify-center shadow-md">
                            <Store className="w-6 h-6 text-cta-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                {profile?.restaurant_name || 'Nhà hàng của tôi'}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Bảng điều khiển quản lý
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 bg-muted text-muted-foreground rounded-xl hover:text-cta hover:bg-cta/10 transition-all">
                            <Bell className="w-5 h-5" />
                        </button>
                        <Link href="/owner/jobs/new">
                            <Button variant="cta" className="shadow-md hover:shadow-lg transition-shadow">
                                <Plus className="w-4 h-4 mr-2" />
                                Đăng tin
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card rounded-[2rem] border border-border p-6 card-hover">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <Briefcase className="w-6 h-6 text-primary" />
                            </div>
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Tin đang tuyển</p>
                        <AnimatedCounter value={stats.activeJobs} className="text-4xl font-bold text-foreground mb-4 block" />
                        <Link
                            href="/owner/jobs"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:gap-3 transition-all"
                        >
                            Xem danh sách
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 rounded-[2rem] p-6 card-hover">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-warning/20 rounded-xl">
                                <Clock className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Chờ duyệt</p>
                        <AnimatedCounter value={stats.pendingApplications} className="text-4xl font-bold text-warning mb-4 block" />
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-warning/20 text-warning hover:bg-warning/10"
                        >
                            Xử lý ngay
                        </Button>
                    </div>

                    <div className="bg-card rounded-[2rem] border border-border p-6 card-hover">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-success/10 rounded-xl">
                                <Users className="w-6 h-6 text-success" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Nhân viên</p>
                        <AnimatedCounter value={stats.totalWorkers} className="text-4xl font-bold text-success mb-4 block" />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                            <span>Đã hoàn thành ca làm</span>
                        </div>
                    </div>
                </div>

                {/* Workers On Duty Card */}
                {workersOnDuty.length > 0 && (
                    <div className="bg-gradient-to-r from-success/10 to-emerald-500/10 border border-success/30 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-success/20 rounded-xl">
                                    <Users className="w-5 h-5 text-success" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">Workers đang làm</h3>
                                    <p className="text-xs text-muted-foreground">{workersOnDuty.length} người đã check-in hôm nay</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                <span className="text-xs text-success font-semibold">Live</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {workersOnDuty.slice(0, 5).map((worker) => (
                                <div
                                    key={worker.id}
                                    className="flex items-center gap-2 bg-card/80 px-3 py-2 rounded-lg cursor-pointer hover:bg-card transition-colors"
                                    onClick={() => viewWorkerProfile(worker.worker_id)}
                                >
                                    {worker.worker_avatar ? (
                                        <Image
                                            src={worker.worker_avatar}
                                            alt={worker.worker_name}
                                            width={24}
                                            height={24}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-xs font-bold text-success">
                                            {worker.worker_name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-foreground">{worker.worker_name}</span>
                                    <span className="text-xs text-muted-foreground">• {worker.job_title}</span>
                                </div>
                            ))}
                            {workersOnDuty.length > 5 && (
                                <div className="flex items-center gap-1 px-3 py-2 text-sm text-success">
                                    +{workersOnDuty.length - 5} khác
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Today's Shifts */}
                {todayShifts.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Ca làm hôm nay
                            </h3>
                            <Link href="/owner/shifts" className="text-xs text-primary hover:underline">
                                Xem tất cả
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {todayShifts.map((shift) => (
                                <div key={shift.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="text-center min-w-[50px]">
                                            <p className="text-lg font-bold text-foreground">{shift.shift_start_time?.slice(0, 5)}</p>
                                            <p className="text-xs text-muted-foreground">{shift.shift_end_time?.slice(0, 5)}</p>
                                        </div>
                                        <div className="border-l border-border pl-3">
                                            <p className="font-medium text-foreground">{shift.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {shift.current_workers || 0}/{shift.max_workers} workers
                                            </p>
                                        </div>
                                    </div>
                                    <Link href={`/owner/jobs/${shift.id}/qr`}>
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            <QrCode className="w-4 h-4" />
                                            QR
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Recent Applications */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-cta" />
                                    Ứng tuyển gần đây
                                </h2>
                                <Link
                                    href="/owner/jobs"
                                    className="text-xs font-semibold text-muted-foreground hover:text-cta transition-colors"
                                >
                                    Xem tất cả
                                </Link>
                            </div>

                            {recentApplications.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center">
                                        <Users className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <div>
                                        <p className="text-foreground font-bold text-lg mb-1">Chưa có ứng tuyển nào</p>
                                        <p className="text-sm text-muted-foreground">
                                            Đăng tin để đón những nhân viên chất lượng
                                        </p>
                                    </div>
                                    <Link href="/owner/jobs/new" className="mt-4">
                                        <Button variant="cta">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tạo tin tuyển dụng
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {recentApplications.map((app) => (
                                        <div
                                            key={app.id}
                                            className="p-6 hover:bg-muted/30 transition-all cursor-pointer group"
                                            onClick={() => viewWorkerProfile(app.worker_id)}
                                        >
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    {app.worker_avatar ? (
                                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
                                                            <Image
                                                                src={app.worker_avatar}
                                                                alt={app.worker_name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold ring-2 ring-border group-hover:ring-primary transition-all">
                                                            {app.worker_name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                            {app.worker_name}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <p className="text-xs text-muted-foreground">
                                                                {app.job_title}
                                                            </p>
                                                            <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                                                                <Star className="w-3 h-3 fill-warning" />
                                                                {app.worker_score || 100}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {app.status === 'pending' ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => handleApproveApplication(app.id, e)}
                                                                className="p-2 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors"
                                                                title="Duyệt"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleRejectApplication(app.id, e)}
                                                                className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                                                                title="Từ chối"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        getStatusBadge(app.status, app.is_instant_book)
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(app.applied_at).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Access Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Profile Completion */}
                        {profile && (profile.profile_completion_percentage || 0) < 100 && (
                            <div className="bg-card rounded-2xl border border-cta/20 p-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-cta"></div>
                                <h3 className="text-xs font-bold text-cta uppercase tracking-wide mb-4">
                                    Nâng cấp hồ sơ
                                </h3>
                                <div className="mb-6">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <p className="text-3xl font-bold text-foreground">
                                            {profile.profile_completion_percentage}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">Hoàn tất</p>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cta to-cta/80 transition-all duration-1000"
                                            style={{ width: `${profile.profile_completion_percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <Link href="/onboarding/owner/profile">
                                    <Button
                                        variant="outline"
                                        className="w-full border-cta/20 text-cta hover:bg-cta/10"
                                    >
                                        Tiếp tục cập nhật
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
                                Lối tắt nhanh
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href="/owner/jobs/new"
                                    className="bg-muted/50 p-4 rounded-xl hover:bg-cta/10 hover:border-cta/20 border border-border group transition-all flex flex-col items-center gap-2"
                                >
                                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-cta" />
                                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-cta">
                                        Đăng việc
                                    </span>
                                </Link>
                                <Link
                                    href="/owner/scan-qr"
                                    className="bg-muted/50 p-4 rounded-xl hover:bg-primary/10 hover:border-primary/20 border border-border group transition-all flex flex-col items-center gap-2"
                                >
                                    <QrCode className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary">
                                        Quét mã
                                    </span>
                                </Link>
                                <Link
                                    href="/owner/jobs"
                                    className="bg-muted/50 p-4 rounded-xl hover:bg-success/10 hover:border-success/20 border border-border group transition-all flex flex-col items-center gap-2"
                                >
                                    <Briefcase className="w-5 h-5 text-muted-foreground group-hover:text-success" />
                                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-success">
                                        Quản lý
                                    </span>
                                </Link>
                                <Link
                                    href="/owner/settings"
                                    className="bg-muted/50 p-4 rounded-xl hover:bg-warning/10 hover:border-warning/20 border border-border group transition-all flex flex-col items-center gap-2"
                                >
                                    <Store className="w-5 h-5 text-muted-foreground group-hover:text-warning" />
                                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-warning">
                                        Cài đặt
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Notification Card */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-cta/10 rounded-lg">
                                    <Zap className="w-4 h-4 text-cta" />
                                </div>
                                <p className="text-sm font-bold text-foreground">Tuyển dụng thần tốc</p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                Nhân viên sẽ xuất hiện ngay khi có ứng tuyển mới.
                            </p>
                            <Button variant="outline" className="w-full" size="sm">
                                <Bell className="w-4 h-4 mr-2" />
                                Bật thông báo
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
