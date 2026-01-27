'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createUntypedClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import {
    FileCheck,
    Users,
    Building2,
    Calendar,
    Clock,
    Eye,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Application {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'no_show';
    is_instant_book: boolean;
    applied_at: string;
    approved_at: string | null;
    worker: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        reliability_score: number;
    };
    job: {
        id: string;
        title: string;
        shift_date: string;
        shift_start_time: string;
        shift_end_time: string;
        owner: {
            id: string;
            full_name: string;
            restaurant_name: string | null;
        };
    };
}

type TabType = 'all' | 'pending' | 'approved' | 'completed' | 'rejected';

function ApplicationsContent() {
    const searchParams = useSearchParams();
    const jobFilter = searchParams.get('job');

    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<Application[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const pageSize = 20;

    useEffect(() => {
        fetchApplications();
    }, [activeTab, page, jobFilter]);

    const fetchApplications = async () => {
        setLoading(true);
        const supabase = createUntypedClient();

        try {
            let query = supabase
                .from('job_applications')
                .select(`
                    *,
                    worker:profiles!job_applications_worker_id_fkey (
                        id,
                        full_name,
                        avatar_url,
                        reliability_score
                    ),
                    job:jobs!job_applications_job_id_fkey (
                        id,
                        title,
                        shift_date,
                        shift_start_time,
                        shift_end_time,
                        owner:profiles!jobs_owner_id_fkey (
                            id,
                            full_name,
                            restaurant_name
                        )
                    )
                `, { count: 'exact' });

            if (activeTab !== 'all') {
                query = query.eq('status', activeTab);
            }

            if (jobFilter) {
                query = query.eq('job_id', jobFilter);
            }

            const offset = (page - 1) * pageSize;
            const { data, error, count } = await query
                .order('applied_at', { ascending: false })
                .range(offset, offset + pageSize - 1);

            if (error) throw error;

            setApplications(data || []);
            setTotalItems(count || 0);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Không thể tải danh sách đơn ứng tuyển');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (applicationId: string) => {
        setActionLoading(applicationId);
        const supabase = createUntypedClient();

        try {
            const { error } = await supabase
                .from('job_applications')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString()
                })
                .eq('id', applicationId);

            if (error) throw error;

            toast.success('Đã duyệt đơn ứng tuyển');
            fetchApplications();
        } catch (error) {
            console.error('Error approving application:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (applicationId: string) => {
        if (!confirm('Bạn có chắc muốn từ chối đơn này?')) return;

        setActionLoading(applicationId);
        const supabase = createUntypedClient();

        try {
            const { error } = await supabase
                .from('job_applications')
                .update({
                    status: 'rejected',
                    rejected_at: new Date().toISOString()
                })
                .eq('id', applicationId);

            if (error) throw error;

            toast.success('Đã từ chối đơn ứng tuyển');
            fetchApplications();
        } catch (error) {
            console.error('Error rejecting application:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string, isInstantBook: boolean) => {
        if (isInstantBook && (status === 'approved' || status === 'pending')) {
            return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-cta/10 text-cta"><Zap className="w-3 h-3" />Instant Book</span>;
        }
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning"><Clock className="w-3 h-3" />Chờ duyệt</span>;
            case 'approved':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success"><CheckCircle2 className="w-3 h-3" />Đã duyệt</span>;
            case 'completed':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"><CheckCircle2 className="w-3 h-3" />Hoàn thành</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" />Từ chối</span>;
            case 'no_show':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><AlertCircle className="w-3 h-3" />No-show</span>;
            default:
                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{status}</span>;
        }
    };

    const columns: ColumnDef<Application>[] = [
        {
            accessorKey: 'worker',
            header: 'Worker',
            cell: ({ row }) => {
                const worker = row.original.worker;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {worker.avatar_url ? (
                                <img src={worker.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Users className="w-4 h-4 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{worker.full_name}</p>
                            <p className="text-xs text-muted-foreground">Score: {worker.reliability_score}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'job',
            header: 'Job',
            cell: ({ row }) => {
                const job = row.original.job;
                return (
                    <div className="max-w-[200px]">
                        <p className="font-medium text-foreground truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.owner?.restaurant_name || job.owner?.full_name}</p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Trạng thái',
            cell: ({ row }) => getStatusBadge(row.original.status, row.original.is_instant_book),
        },
        {
            accessorKey: 'applied_at',
            header: 'Ngày ứng tuyển',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(row.original.applied_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </span>
            ),
        },
        {
            accessorKey: 'job.shift_date',
            header: 'Ca làm',
            cell: ({ row }) => {
                const job = row.original.job;
                return (
                    <div className="text-sm">
                        <p className="text-foreground">{format(new Date(job.shift_date), 'dd/MM', { locale: vi })}</p>
                        <p className="text-xs text-muted-foreground">
                            {job.shift_start_time?.slice(0, 5)} - {job.shift_end_time?.slice(0, 5)}
                        </p>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const app = row.original;
                const isLoading = actionLoading === app.id;
                const canApprove = app.status === 'pending';
                const canReject = app.status === 'pending';

                return (
                    <div className="flex items-center gap-1 justify-end">
                        <Link href={`/admin/users/${app.worker.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4" />
                            </Button>
                        </Link>
                        {canApprove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-success hover:text-success"
                                onClick={() => handleApprove(app.id)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                            </Button>
                        )}
                        {canReject && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleReject(app.id)}
                                disabled={isLoading}
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
        { key: 'all', label: 'Tất cả', icon: <FileCheck className="w-4 h-4" /> },
        { key: 'pending', label: 'Chờ duyệt', icon: <Clock className="w-4 h-4" /> },
        { key: 'approved', label: 'Đã duyệt', icon: <CheckCircle2 className="w-4 h-4" /> },
        { key: 'completed', label: 'Hoàn thành', icon: <CheckCircle2 className="w-4 h-4" /> },
        { key: 'rejected', label: 'Từ chối', icon: <XCircle className="w-4 h-4" /> },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Quản lý Applications</h1>
                <p className="text-sm text-muted-foreground">
                    Xem và quản lý tất cả đơn ứng tuyển
                    {jobFilter && <span className="text-primary"> (đang lọc theo job)</span>}
                </p>
            </div>

            {/* Job filter clear */}
            {jobFilter && (
                <div className="flex items-center gap-2">
                    <Link href="/admin/applications">
                        <Button variant="outline" size="sm">
                            <XCircle className="w-4 h-4 mr-2" />
                            Bỏ lọc job
                        </Button>
                    </Link>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            setPage(1);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors whitespace-nowrap",
                            activeTab === tab.key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={applications}
                loading={loading}
                searchPlaceholder="Tìm theo tên worker..."
                serverSidePagination
                pageSize={pageSize}
                currentPage={page}
                totalItems={totalItems}
                onPageChange={setPage}
                emptyMessage="Không tìm thấy đơn ứng tuyển nào"
            />
        </div>
    );
}

export default function ApplicationsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <ApplicationsContent />
        </Suspense>
    );
}
