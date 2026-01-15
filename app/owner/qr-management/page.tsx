'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    QrCode,
    ArrowLeft,
    Download,
    Printer,
    Calendar,
    Clock,
    Users,
    Eye,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface JobWithQR {
    id: string;
    title: string;
    shift_date: string;
    shift_start_time: string;
    shift_end_time: string;
    current_workers: number;
    max_workers: number;
    status: string;
    qr_code?: {
        id: string;
        is_active: boolean;
    };
}

export default function OwnerQRManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<JobWithQR[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'upcoming'>('active');

    useEffect(() => {
        fetchJobs();
    }, [filter]);

    const fetchJobs = async () => {
        const supabase = createUntypedClient();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            let query = supabase
                .from('jobs')
                .select(`
                    id, title, shift_date, shift_start_time, shift_end_time,
                    current_workers, max_workers, status,
                    qr_code:job_qr_codes(id, is_active)
                `)
                .eq('owner_id', user.id)
                .order('shift_date', { ascending: true });

            if (filter === 'active') {
                query = query.in('status', ['open', 'filled']);
            } else if (filter === 'upcoming') {
                const today = new Date().toISOString().split('T')[0];
                query = query.gte('shift_date', today);
            }

            const { data, error } = await query.limit(50);

            if (error) throw error;

            // Flatten qr_code array
            const jobsWithQR = (data || []).map(job => ({
                ...job,
                qr_code: Array.isArray(job.qr_code) ? job.qr_code[0] : job.qr_code,
            }));

            setJobs(jobsWithQR);
        } catch (error) {
            console.error('Fetch jobs error:', error);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-success/10 text-success';
            case 'filled': return 'bg-primary/10 text-primary';
            case 'completed': return 'bg-muted text-muted-foreground';
            case 'cancelled': return 'bg-destructive/10 text-destructive';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            open: 'Đang mở',
            filled: 'Đủ người',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
        };
        return labels[status] || status;
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/owner/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-success/10 rounded-lg">
                                    <QrCode className="w-5 h-5 text-success" />
                                </div>
                                <h1 className="text-xl font-bold text-foreground">Quản lý QR Check-in</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
                {/* Info Banner */}
                <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <QrCode className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">QR Code tự động được tạo cho mỗi job</p>
                            <p className="text-sm text-muted-foreground">
                                Worker quét mã QR này tại cửa hàng để check-in/out. In poster hoặc hiển thị trên màn hình.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {(['active', 'upcoming', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {f === 'active' ? 'Đang hoạt động' : f === 'upcoming' ? 'Sắp tới' : 'Tất cả'}
                        </button>
                    ))}
                </div>

                {/* Jobs List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border p-12 text-center">
                        <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Chưa có job nào</p>
                        <Link href="/owner/jobs/new">
                            <Button>Tạo tin tuyển dụng</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-card rounded-2xl border border-border p-5 hover:border-success/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                {getStatusLabel(job.status)}
                                            </span>
                                            {job.qr_code?.is_active && (
                                                <span className="flex items-center gap-1 text-xs text-success">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                                    QR Active
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-foreground">{job.title}</h3>
                                    </div>
                                    <div className="p-2 bg-success/10 rounded-lg">
                                        <QrCode className="w-5 h-5 text-success" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(job.shift_date), 'dd/MM', { locale: vi })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {job.shift_start_time?.slice(0, 5)} - {job.shift_end_time?.slice(0, 5)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {job.current_workers || 0}/{job.max_workers}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <Link href={`/owner/jobs/${job.id}/qr`} className="flex-1">
                                        <Button variant="default" size="sm" className="w-full bg-success hover:bg-success/90">
                                            <Eye className="w-4 h-4 mr-1" />
                                            Xem QR
                                        </Button>
                                    </Link>
                                    <Link href={`/owner/jobs/${job.id}/applications`}>
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
