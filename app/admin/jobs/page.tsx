'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createUntypedClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import {
    Briefcase,
    Building2,
    Calendar,
    Clock,
    MapPin,
    Users,
    Eye,
    XCircle,
    Loader2,
    CheckCircle2,
    AlertCircle,
    DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Job {
    id: string;
    title: string;
    status: 'open' | 'filled' | 'completed' | 'cancelled';
    shift_date: string;
    shift_start_time: string;
    shift_end_time: string;
    hourly_rate_vnd: number;
    required_language: string;
    required_language_level: string;
    max_workers: number;
    current_workers: number;
    created_at: string;
    owner: {
        id: string;
        full_name: string;
        restaurant_name: string | null;
        avatar_url: string | null;
    };
    applications_count: number;
}

type TabType = 'all' | 'open' | 'completed' | 'cancelled';

export default function JobsPage() {
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const pageSize = 20;

    useEffect(() => {
        fetchJobs();
    }, [activeTab, page]);

    const fetchJobs = async () => {
        setLoading(true);
        const supabase = createUntypedClient();

        try {
            let query = supabase
                .from('jobs')
                .select(`
                    *,
                    owner:profiles!jobs_owner_id_fkey (
                        id,
                        full_name,
                        restaurant_name,
                        avatar_url
                    )
                `, { count: 'exact' });

            if (activeTab !== 'all') {
                query = query.eq('status', activeTab);
            }

            const offset = (page - 1) * pageSize;
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + pageSize - 1);

            if (error) throw error;

            // Get applications count for each job
            const jobsWithCounts = await Promise.all(
                (data || []).map(async (job) => {
                    const { count } = await supabase
                        .from('job_applications')
                        .select('*', { count: 'exact', head: true })
                        .eq('job_id', job.id);
                    return { ...job, applications_count: count || 0 };
                })
            );

            setJobs(jobsWithCounts);
            setTotalItems(count || 0);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Không thể tải danh sách jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelJob = async (jobId: string) => {
        if (!confirm('Bạn có chắc muốn hủy job này?')) return;

        setActionLoading(jobId);
        const supabase = createUntypedClient();

        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status: 'cancelled' })
                .eq('id', jobId);

            if (error) throw error;

            toast.success('Đã hủy job');
            fetchJobs();
        } catch (error) {
            console.error('Error cancelling job:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success"><CheckCircle2 className="w-3 h-3" />Đang mở</span>;
            case 'filled':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning"><Users className="w-3 h-3" />Đã đủ</span>;
            case 'completed':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"><CheckCircle2 className="w-3 h-3" />Hoàn thành</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" />Đã hủy</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{status}</span>;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const columns: ColumnDef<Job>[] = [
        {
            accessorKey: 'title',
            header: 'Job',
            cell: ({ row }) => {
                const job = row.original;
                return (
                    <div className="max-w-[200px]">
                        <p className="font-medium text-foreground truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                            {format(new Date(job.shift_date), 'dd/MM/yyyy', { locale: vi })}
                        </p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'owner',
            header: 'Employer',
            cell: ({ row }) => {
                const owner = row.original.owner;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {owner.avatar_url ? (
                                <img src={owner.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{owner.restaurant_name || owner.full_name}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Trạng thái',
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            accessorKey: 'shift_date',
            header: 'Ca làm',
            cell: ({ row }) => {
                const job = row.original;
                return (
                    <div className="text-sm">
                        <p className="text-foreground">{job.shift_start_time?.slice(0, 5)} - {job.shift_end_time?.slice(0, 5)}</p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'hourly_rate_vnd',
            header: 'Lương/giờ',
            cell: ({ row }) => (
                <span className="text-sm font-medium text-foreground">
                    {formatCurrency(row.original.hourly_rate_vnd)}đ
                </span>
            ),
        },
        {
            accessorKey: 'current_workers',
            header: 'Workers',
            cell: ({ row }) => {
                const job = row.original;
                return (
                    <span className="text-sm text-muted-foreground">
                        {job.current_workers}/{job.max_workers}
                    </span>
                );
            },
        },
        {
            accessorKey: 'applications_count',
            header: 'Đơn ứng tuyển',
            cell: ({ row }) => (
                <span className="text-sm font-medium text-foreground">
                    {row.original.applications_count}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const job = row.original;
                const isLoading = actionLoading === job.id;
                const canCancel = job.status === 'open';

                return (
                    <div className="flex items-center gap-1 justify-end">
                        <Link href={`/admin/applications?job=${job.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4" />
                            </Button>
                        </Link>
                        {canCancel && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleCancelJob(job.id)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
        { key: 'all', label: 'Tất cả', icon: <Briefcase className="w-4 h-4" /> },
        { key: 'open', label: 'Đang mở', icon: <CheckCircle2 className="w-4 h-4" /> },
        { key: 'completed', label: 'Hoàn thành', icon: <CheckCircle2 className="w-4 h-4" /> },
        { key: 'cancelled', label: 'Đã hủy', icon: <XCircle className="w-4 h-4" /> },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Quản lý Jobs</h1>
                <p className="text-sm text-muted-foreground">Xem và quản lý tất cả các job đã đăng</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            setPage(1);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors",
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
                data={jobs}
                loading={loading}
                searchPlaceholder="Tìm theo tiêu đề..."
                serverSidePagination
                pageSize={pageSize}
                currentPage={page}
                totalItems={totalItems}
                onPageChange={setPage}
                emptyMessage="Không tìm thấy job nào"
            />
        </div>
    );
}
