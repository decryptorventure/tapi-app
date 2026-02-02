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
    ChevronRight,
    Bell,
    Store,
    Star,
    Zap,
    Check,
    X,
    Sparkles,
    CheckCircle2,
    XCircle,
    Phone,
    Mail
} from 'lucide-react';
import { WorkerProfileModal } from '@/components/owner/worker-profile-modal';
import { OwnerStatCard } from '@/components/owner/owner-stat-card';
import { TodayShiftsCard } from '@/components/owner/today-shifts-card';
import { WorkersOnDutyCard } from '@/components/owner/workers-on-duty-card';
import { PageLoader } from '@/components/shared/page-loader';

interface DashboardStats {
    activeJobs: number;
    pendingApplications: number;
    totalWorkers: number;
}

interface OwnerProfile {
    id: string;
    full_name: string;
    restaurant_name: string | null;
    restaurant_logo_url: string | null;
    restaurant_cover_urls: string[];
    phone_number: string | null;
    email: string | null;
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
        return <PageLoader />;
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <WorkerProfileModal
                worker={selectedWorker}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                languageSkills={selectedWorker?.skills || []}
            />

            {/* Header Area with Cover Image */}
            <div className="relative">
                {/* Cover Image */}
                {profile?.restaurant_cover_urls && profile.restaurant_cover_urls.length > 0 ? (
                    <div className="h-32 md:h-40 w-full relative">
                        <Image
                            src={profile.restaurant_cover_urls[0]}
                            alt="Cover"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
                    </div>
                ) : (
                    <div className="h-20 md:h-24 w-full bg-gradient-to-r from-orange-500 to-orange-400" />
                )}

                {/* Restaurant Info Card */}
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="relative -mt-12 md:-mt-16">
                        <div className="bg-card rounded-2xl border border-border p-4 shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Logo */}
                                <div className="flex-shrink-0">
                                    {profile?.restaurant_logo_url ? (
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-white shadow-md">
                                            <Image
                                                src={profile.restaurant_logo_url}
                                                alt={profile.restaurant_name || 'Logo'}
                                                width={80}
                                                height={80}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md">
                                            <Store className="w-8 h-8 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl font-bold text-foreground truncate">
                                        {profile?.restaurant_name || 'Nhà hàng của tôi'}
                                    </h1>
                                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                                        {profile?.phone_number && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5" />
                                                {profile.phone_number}
                                            </span>
                                        )}
                                        {profile?.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5" />
                                                {profile.email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <Link href="/owner/jobs/new">
                                        <Button variant="cta" size="sm" className="shadow-md">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Đăng tin
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                    <OwnerStatCard
                        icon={Briefcase}
                        label="Đang tuyển"
                        value={stats.activeJobs}
                        iconColorClass="text-primary"
                    />
                    <OwnerStatCard
                        icon={Clock}
                        label="Chờ duyệt"
                        value={stats.pendingApplications}
                        iconColorClass="text-warning"
                    />
                    <OwnerStatCard
                        icon={Users}
                        label="Nhân viên"
                        value={stats.totalWorkers}
                        iconColorClass="text-success"
                    />
                </div>

                {/* Workers On Duty Card */}
                <WorkersOnDutyCard
                    workers={workersOnDuty}
                    onViewWorker={viewWorkerProfile}
                />

                {/* Today's Shifts */}
                <TodayShiftsCard shifts={todayShifts} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Recent Applications */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-cta" />
                                    Ứng tuyển gần đây
                                </h2>
                                <Link
                                    href="/owner/jobs"
                                    className="text-[10px] font-semibold text-muted-foreground hover:text-cta transition-colors"
                                >
                                    TẤT CẢ
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
