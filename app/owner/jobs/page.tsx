'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    Plus,
    ArrowLeft,
    Briefcase,
    Calendar,
    Clock,
    Users,
    Loader2,
    MoreVertical,
    Eye,
    Edit,
    XCircle,
    Languages,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    FileText,
    QrCode,
    RefreshCw
} from 'lucide-react';
import { Job, JobStatus } from '@/types/database.types';

const statusLabels: Record<JobStatus, { label: string; color: string }> = {
    open: { label: 'Đang mở', color: 'bg-success/10 text-success' },
    filled: { label: 'Đã đủ người', color: 'bg-primary/10 text-primary' },
    completed: { label: 'Hoàn thành', color: 'bg-slate-100 text-slate-700' },
    cancelled: { label: 'Đã hủy', color: 'bg-destructive/10 text-destructive' },
};

// Language badge configuration with icons and colors (no emoji)
const languageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    japanese: { label: 'Tiếng Nhật', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    korean: { label: 'Tiếng Hàn', color: 'text-rose-700', bgColor: 'bg-rose-50' },
    english: { label: 'Tiếng Anh', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
};

export default function OwnerJobsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filter, setFilter] = useState<JobStatus | 'all'>('all');
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJobs(data || []);
        } catch (error: any) {
            console.error('Jobs fetch error:', error);
            toast.error('Lỗi tải danh sách việc làm');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchJobs();
        toast.success('Đã cập nhật danh sách');
    };

    const handleCancelJob = async (jobId: string) => {
        const supabase = createUntypedClient();

        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status: 'cancelled' })
                .eq('id', jobId);

            if (error) throw error;

            toast.success('Đã hủy tin tuyển dụng');
            fetchJobs();
        } catch (error: any) {
            console.error('Cancel job error:', error);
            toast.error('Lỗi hủy tin');
        }
        setOpenMenu(null);
    };

    const filteredJobs = filter === 'all'
        ? jobs
        : jobs.filter(job => job.status === filter);

    // Calculate stats
    const stats = {
        total: jobs.length,
        open: jobs.filter(j => j.status === 'open').length,
        filled: jobs.filter(j => j.status === 'filled').length,
        applications: jobs.reduce((sum, job) => sum + (job.current_workers || 0), 0),
    };

    const formatTime = (time: string) => {
        return time.substring(0, 5); // HH:MM
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: 'numeric',
            month: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-cta" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/80">
                <div className="container mx-auto px-4 py-4 max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/owner/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cta/10 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-cta" />
                                </div>
                                <h1 className="text-xl font-bold text-foreground">Quản lý việc làm</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="h-9 w-9"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </Button>
                            <Link href="/owner/jobs/new">
                                <Button variant="cta" className="shadow-md hover:shadow-lg transition-shadow">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Đăng tin
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
                {/* Stat Cards - NEW FEATURE */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card rounded-[2rem] border border-border p-6 card-hover">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Briefcase className="w-5 h-5 text-primary" />
                            </div>
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">Tổng tin tuyển</p>
                    </div>

                    <div className="bg-card rounded-[2rem] border border-border p-6 card-hover">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-success/10 rounded-xl">
                                <CheckCircle2 className="w-5 h-5 text-success" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-success">{stats.open}</p>
                        <p className="text-sm text-muted-foreground">Đang mở</p>
                    </div>

                    <div className="bg-card rounded-[2rem] border border-border p-6 card-hover">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-primary">{stats.filled}</p>
                        <p className="text-sm text-muted-foreground">Đã đủ người</p>
                    </div>

                    <div className="bg-card rounded-[2rem] border border-border p-6 card-hover">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-cta/10 rounded-xl">
                                <FileText className="w-5 h-5 text-cta" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-cta">{stats.applications}</p>
                        <p className="text-sm text-muted-foreground">Ứng viên</p>
                    </div>
                </div>

                {/* Filter Pills - ENHANCED DESIGN */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {(['all', 'open', 'filled', 'completed', 'cancelled'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${filter === status
                                ? 'bg-cta text-cta-foreground shadow-md hover:shadow-lg scale-105'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                                }`}
                        >
                            {status === 'all' ? 'Tất cả' : statusLabels[status].label}
                            {status !== 'all' && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === status ? 'bg-white/20' : 'bg-background'
                                    }`}>
                                    {jobs.filter(j => j.status === status).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Jobs List - ENHANCED CARDS */}
                {filteredJobs.length === 0 ? (
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted/30 rounded-2xl flex items-center justify-center">
                            <Briefcase className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            {filter === 'all' ? 'Chưa có tin tuyển dụng' : 'Không có kết quả'}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {filter === 'all'
                                ? 'Đăng tin tuyển dụng để tìm nhân viên phù hợp'
                                : 'Không có tin nào trong trạng thái này'}
                        </p>
                        {filter === 'all' && (
                            <Link href="/owner/jobs/new">
                                <Button variant="cta" className="shadow-md">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Đăng tin đầu tiên
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-card rounded-2xl shadow-sm border border-border p-6 card-hover"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusLabels[job.status].color}`}>
                                                {statusLabels[job.status].label}
                                            </span>
                                            {/* Language Badge with Icon - NO EMOJI */}
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${languageConfig[job.required_language]?.bgColor || 'bg-muted'}`}>
                                                <Languages className={`w-3.5 h-3.5 ${languageConfig[job.required_language]?.color || 'text-muted-foreground'}`} />
                                                <span className={`text-xs font-medium ${languageConfig[job.required_language]?.color || 'text-muted-foreground'}`}>
                                                    {languageConfig[job.required_language]?.label || job.required_language}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-foreground mb-3">
                                            {job.title}
                                        </h3>

                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(job.shift_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatTime(job.shift_start_time)} - {formatTime(job.shift_end_time)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4" />
                                                <span>{job.current_workers}/{job.max_workers} người</span>
                                            </div>
                                            <div className="font-bold text-cta">
                                                {job.hourly_rate_vnd.toLocaleString('vi-VN')}đ/giờ
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenu(openMenu === job.id ? null : job.id)}
                                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                                        </button>

                                        {openMenu === job.id && (
                                            <div className="absolute right-0 top-10 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[180px] z-10">
                                                <Link
                                                    href={`/owner/jobs/${job.id}/applications`}
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                                    onClick={() => setOpenMenu(null)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Xem đơn ứng tuyển
                                                </Link>
                                                <Link
                                                    href={`/owner/jobs/${job.id}/qr`}
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-success hover:bg-success/10 transition-colors"
                                                    onClick={() => setOpenMenu(null)}
                                                >
                                                    <QrCode className="w-4 h-4" />
                                                    Xem QR Check-in
                                                </Link>
                                                {job.status === 'open' && (
                                                    <>
                                                        <Link
                                                            href={`/owner/jobs/${job.id}/edit`}
                                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                                            onClick={() => setOpenMenu(null)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Chỉnh sửa
                                                        </Link>
                                                        <button
                                                            onClick={() => handleCancelJob(job.id)}
                                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 w-full text-left transition-colors"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Hủy tin
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                {(job.status === 'open' || job.status === 'filled') && (
                                    <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                                        <Link href={`/owner/jobs/${job.id}/qr`}>
                                            <Button variant="default" size="sm" className="bg-success hover:bg-success/90">
                                                <QrCode className="w-4 h-4 mr-2" />
                                                QR Check-in
                                            </Button>
                                        </Link>
                                        <Link href={`/owner/jobs/${job.id}/applications`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                Xem đơn
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
