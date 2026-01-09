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
    XCircle
} from 'lucide-react';
import { Job, JobStatus } from '@/types/database.types';

const statusLabels: Record<JobStatus, { label: string; color: string }> = {
    open: { label: 'Đang mở', color: 'bg-green-100 text-green-800' },
    filled: { label: 'Đã đủ người', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Hoàn thành', color: 'bg-slate-100 text-slate-800' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
};

const languageFlags: Record<string, string> = {
    japanese: '🇯🇵',
    korean: '🇰🇷',
    english: '🇬🇧',
};

export default function OwnerJobsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
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
        }
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/owner/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-orange-600" />
                                </div>
                                <h1 className="text-xl font-bold text-slate-900">Quản lý việc làm</h1>
                            </div>
                        </div>

                        <Link href="/owner/jobs/new">
                            <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Đăng tin
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {(['all', 'open', 'filled', 'completed', 'cancelled'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === status
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            {status === 'all' ? 'Tất cả' : statusLabels[status].label}
                            {status !== 'all' && (
                                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                                    {jobs.filter(j => j.status === status).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Jobs List */}
                {filteredJobs.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {filter === 'all' ? 'Chưa có tin tuyển dụng' : 'Không có kết quả'}
                        </h3>
                        <p className="text-slate-500 mb-4">
                            {filter === 'all'
                                ? 'Đăng tin tuyển dụng để tìm nhân viên phù hợp'
                                : 'Không có tin nào trong trạng thái này'}
                        </p>
                        {filter === 'all' && (
                            <Link href="/owner/jobs/new">
                                <Button className="bg-gradient-to-r from-orange-600 to-orange-500">
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
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusLabels[job.status].color}`}>
                                                {statusLabels[job.status].label}
                                            </span>
                                            <span className="text-lg">
                                                {languageFlags[job.required_language]}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            {job.title}
                                        </h3>

                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(job.shift_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatTime(job.shift_start_time)} - {formatTime(job.shift_end_time)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{job.current_workers}/{job.max_workers} người</span>
                                            </div>
                                            <div className="font-medium text-orange-600">
                                                {job.hourly_rate_vnd.toLocaleString('vi-VN')}đ/giờ
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenu(openMenu === job.id ? null : job.id)}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5 text-slate-400" />
                                        </button>

                                        {openMenu === job.id && (
                                            <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px] z-10">
                                                <Link
                                                    href={`/owner/jobs/${job.id}/applications`}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                    onClick={() => setOpenMenu(null)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Xem đơn ứng tuyển
                                                </Link>
                                                {job.status === 'open' && (
                                                    <>
                                                        <Link
                                                            href={`/owner/jobs/${job.id}/edit`}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                            onClick={() => setOpenMenu(null)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Chỉnh sửa
                                                        </Link>
                                                        <button
                                                            onClick={() => handleCancelJob(job.id)}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
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

                                {/* Quick Action */}
                                {job.status === 'open' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <Link href={`/owner/jobs/${job.id}/applications`}>
                                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                                <Eye className="w-4 h-4 mr-2" />
                                                Xem đơn ứng tuyển
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
