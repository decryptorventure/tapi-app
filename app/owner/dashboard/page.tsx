'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ProfileCompletionBanner } from '@/components/shared/profile-completion-banner';
import { toast } from 'sonner';
import Link from 'next/link';
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
    UserCircle,
    Star,
    Zap,
    ArrowUpRight
} from 'lucide-react';
import { WorkerProfileModal } from '@/components/owner/worker-profile-modal';

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
            }
        } catch (error: any) {
            console.error('Dashboard fetch error:', error);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string, isInstantBook: boolean) => {
        const baseClass = 'px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5';

        if (status === 'pending') {
            return <span className={`${baseClass} bg-amber-50 text-amber-600 border border-amber-100`}>⏲️ Chờ duyệt</span>;
        } else if (status === 'approved') {
            return (
                <span className={`${baseClass} bg-green-50 text-green-600 border border-green-100`}>
                    {isInstantBook ? '✨ Instant' : '✅ Đã duyệt'}
                </span>
            );
        } else if (status === 'rejected') {
            return <span className={`${baseClass} bg-rose-50 text-rose-600 border border-rose-100`}>❌ Từ chối</span>;
        } else if (status === 'completed') {
            return <span className={`${baseClass} bg-blue-50 text-blue-600 border border-blue-100`}>🏆 Xong</span>;
        }
        return null;
    };

    if (loading && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-orange-100 rounded-full animate-spin border-t-orange-600"></div>
                        <Building2 className="absolute inset-0 m-auto w-5 h-5 text-orange-600 animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Khởi tạo dữ liệu quản lý...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            <WorkerProfileModal
                worker={selectedWorker}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                languageSkills={selectedWorker?.skills || []}
            />

            {/* Header Area */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-30 backdrop-blur-md bg-white/80">
                <div className="container mx-auto px-4 py-4 max-w-5xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 rotate-2">
                            <Store className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight uppercase italic underline decoration-orange-500/20 underline-offset-4">
                                {profile?.restaurant_name || 'Nhà hàng của tôi'}
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">
                                Quản lý tuyển dụng
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-orange-600 hover:bg-orange-50 transition-all border border-slate-100">
                            <Bell className="w-6 h-6" />
                        </button>
                        <Link href="/owner/jobs/new">
                            <Button className="bg-slate-900 hover:bg-black text-white px-6 py-6 rounded-2xl shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-2 font-black text-xs tracking-widest uppercase">
                                <Plus className="w-5 h-5" /> Đăng tin
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
                {/* Statistics Wall */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tin đang tuyển</p>
                                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{stats.activeJobs}</p>
                            </div>
                            <Link href="/owner/jobs" className="mt-8 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest group-hover:gap-3 transition-all">
                                Xem danh sách <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    <div className="bg-[#1E293B] p-8 rounded-[2rem] shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 rotate-6">
                                <Clock className="w-6 h-6 text-slate-900" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ứng tuyển chờ duyệt</p>
                            <p className="text-5xl font-black text-white tracking-tighter italic">{stats.pendingApplications}</p>
                            <Button variant="outline" className="mt-8 w-full border-slate-700 bg-transparent text-white hover:bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest py-5">
                                Xử lý ngay
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                <Users className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nhân viên hoàn thành</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{stats.totalWorkers}</p>
                            <div className="mt-8 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                <p className="text-[10px] font-bold text-slate-400 italic font-medium uppercase tracking-tight">Cần thêm 5 ca để tăng hạng mức</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Recent Stream */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 italic">
                                    <Clock className="w-5 h-5 text-orange-500" /> ỨNG TUYỂN GẦN ĐÂY
                                </h2>
                                <Link href="/owner/jobs" className="text-[10px] font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest">Xem tất cả</Link>
                            </div>

                            {recentApplications.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                        <Users className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-black text-lg">Chưa có ứng tuyển nào</p>
                                        <p className="text-sm font-medium text-slate-400 mt-1">Đăng tin để đón những nhân viên chất lượng nhất</p>
                                    </div>
                                    <Link href="/owner/jobs/new" className="mt-4">
                                        <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-10 font-bold">Tạo tin tuyển dụng</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {recentApplications.map((app) => (
                                        <div
                                            key={app.id}
                                            className="p-8 hover:bg-slate-50/50 transition-all cursor-pointer group"
                                            onClick={() => viewWorkerProfile(app.worker_id)}
                                        >
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                                                        {app.worker_avatar ? (
                                                            <img src={app.worker_avatar} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-black text-slate-400 bg-orange-50 text-orange-600">
                                                                {app.worker_name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-none mb-1.5">{app.worker_name}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{app.job_title}</p>
                                                            <span className="flex items-center gap-1 text-[10px] font-black text-amber-500">
                                                                <Star className="w-3 h-3 fill-amber-500" /> {app.worker_score || 100}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {getStatusBadge(app.status, app.is_instant_book)}
                                                    <p className="text-[10px] font-bold text-slate-300 italic">
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
                        {/* Profile Completion Panel */}
                        {profile && (profile.profile_completion_percentage || 0) < 100 && (
                            <div className="bg-white rounded-[2rem] shadow-xl shadow-orange-900/5 border border-orange-100 p-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                                <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-6">Nâng cấp hồ sơ</h3>
                                <div className="mb-8">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{profile.profile_completion_percentage}%</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase italic">Hoàn tất</p>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-1000 shadow-sm"
                                            style={{ width: `${profile.profile_completion_percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <Link href="/onboarding/owner/profile">
                                    <Button className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-black py-6 rounded-2xl flex items-center justify-center gap-2 transition-all group">
                                        TIẾP TỤC CẬP NHẬT <ChevronRight className="w-4 h-4 group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Quick Action Hub */}
                        <div className="bg-[#1E293B] rounded-[2rem] p-8 shadow-2xl shadow-slate-900/10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Lối tắt nhanh</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/owner/jobs/new" className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:bg-orange-500 group transition-all text-center flex flex-col items-center gap-3">
                                    <Plus className="w-6 h-6 text-white" />
                                    <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest leading-tight">Đăng việc</span>
                                </Link>
                                <Link href="/owner/scan-qr" className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:bg-purple-500 group transition-all text-center flex flex-col items-center gap-3">
                                    <QrCode className="w-6 h-6 text-white" />
                                    <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest leading-tight">Quét mã</span>
                                </Link>
                                <Link href="/owner/jobs" className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:bg-blue-500 group transition-all text-center flex flex-col items-center gap-3">
                                    <Briefcase className="w-6 h-6 text-white" />
                                    <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest leading-tight">Quản lý</span>
                                </Link>
                                <Link href="/owner/dashboard" className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:bg-emerald-500 group transition-all text-center flex flex-col items-center gap-3">
                                    <LayoutDashboard className="w-6 h-6 text-white" />
                                    <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest leading-tight">Báo cáo</span>
                                </Link>
                            </div>

                            <div className="mt-8 p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                                    </div>
                                    <p className="text-[9px] font-black text-white uppercase tracking-widest">Tuyển dụng thần tốc</p>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed mb-6 italic">Nhân viên của bạn sẽ xuất hiện tại đây ngay khi có ứng tuyển mới.</p>
                                <Button className="w-full bg-white text-slate-900 border-none rounded-xl font-black text-[9px] uppercase tracking-widest py-4 h-auto shadow-lg">BẬT THÔNG BÁO</Button>
                            </div>
                        </div>

                        {/* Support Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-500/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <h4 className="text-xl font-black mb-2 leading-tight">Bạn cần hỗ trợ tuyển dụng?</h4>
                                <p className="text-[10px] font-bold text-blue-100 mb-8 max-w-[180px] leading-relaxed">Đội ngũ chuyên gia của Tapy luôn sẵn sàng giúp bạn tìm nhân sự ưng ý.</p>
                                <div className="flex items-center gap-2 group">
                                    <span className="text-[10px] font-black uppercase tracking-widest italic group-hover:tracking-[0.2em] transition-all">Gửi yêu cầu ngay</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
