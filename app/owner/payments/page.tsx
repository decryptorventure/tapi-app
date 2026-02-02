'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Banknote,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowLeft,
    Phone,
    Building2,
    User,
    RefreshCw,
    Copy,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { EarningsService } from '@/lib/services/earnings.service';
import { PageLoader } from '@/components/shared/page-loader';

interface PaymentRequest {
    id: string;
    worker_id: string;
    application_id: string;
    amount_vnd: number;
    payment_method: 'momo' | 'zalopay' | 'bank_transfer';
    payment_info: {
        phone?: string;
        bank_name?: string;
        bank_account?: string;
        account_holder?: string;
    };
    status: 'pending' | 'paid' | 'rejected';
    created_at: string;
    paid_at?: string;
    job_title?: string;
    worker_name?: string;
    worker_phone?: string;
}

type FilterStatus = 'all' | 'pending' | 'paid';

export default function OwnerPaymentsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
    const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Get payment requests for jobs owned by this user
            let query = supabase
                .from('payment_requests')
                .select(`
                    *,
                    worker:profiles!worker_id(full_name, phone_number),
                    application:job_applications!application_id(
                        job:jobs(title, owner_id)
                    )
                `)
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;

            if (error) throw error;

            const formatted: PaymentRequest[] = (data || []).map((item: any) => ({
                id: item.id,
                worker_id: item.worker_id,
                application_id: item.application_id,
                amount_vnd: item.amount_vnd,
                payment_method: item.payment_method,
                payment_info: item.payment_info || {},
                status: item.status,
                created_at: item.created_at,
                paid_at: item.paid_at,
                job_title: item.application?.job?.title || 'N/A',
                worker_name: item.worker?.full_name || 'Worker',
                worker_phone: item.worker?.phone_number || '',
            }));

            setRequests(formatted);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (requestId: string) => {
        setProcessingId(requestId);
        const supabase = createUntypedClient();

        try {
            const { error } = await supabase
                .from('payment_requests')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) throw error;

            toast.success('Đã xác nhận thanh toán!');
            fetchRequests();
            setSelectedRequest(null);

            // TODO: Send notification to worker
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setProcessingId(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã copy!');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã thanh toán</span>;
            case 'pending':
                return <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ thanh toán</span>;
            default:
                return null;
        }
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'momo':
            case 'zalopay':
                return <Phone className="w-4 h-4" />;
            case 'bank_transfer':
                return <Building2 className="w-4 h-4" />;
            default:
                return <Banknote className="w-4 h-4" />;
        }
    };

    const stats = {
        pending: requests.filter(r => r.status === 'pending').length,
        totalPending: requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount_vnd, 0),
    };

    if (loading && requests.length === 0) {
        return <PageLoader />;
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/owner/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Thanh toán</h1>
                                <p className="text-sm text-muted-foreground">Xác nhận thanh toán cho Worker</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchRequests}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
                {/* Stats */}
                {stats.pending > 0 && (
                    <div className="bg-warning/10 rounded-xl border border-warning/30 p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-warning" />
                            <div>
                                <p className="font-medium text-warning-foreground">
                                    {stats.pending} yêu cầu chờ thanh toán
                                </p>
                                <p className="text-sm text-warning-foreground/80">
                                    Tổng: {EarningsService.formatCurrency(stats.totalPending)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {(['pending', 'paid', 'all'] as FilterStatus[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${filterStatus === status
                                ? 'bg-cta text-cta-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {status === 'all' && 'Tất cả'}
                            {status === 'pending' && 'Chờ thanh toán'}
                            {status === 'paid' && 'Đã thanh toán'}
                        </button>
                    ))}
                </div>

                {/* Request List */}
                {requests.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                        <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                            {filterStatus === 'pending'
                                ? 'Không có yêu cầu thanh toán nào'
                                : 'Chưa có lịch sử thanh toán'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(request => (
                            <div
                                key={request.id}
                                className="bg-card rounded-xl border border-border p-4 hover:border-cta/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedRequest(request)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-muted rounded-lg">
                                            {getMethodIcon(request.payment_method)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">
                                                {EarningsService.formatCurrency(request.amount_vnd)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {request.worker_name} • {request.job_title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(request.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">Chi tiết thanh toán</h2>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="p-2 hover:bg-muted rounded-lg"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Amount */}
                            <div className="text-center py-4 bg-muted/50 rounded-xl">
                                <p className="text-sm text-muted-foreground">Số tiền cần thanh toán</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {EarningsService.formatCurrency(selectedRequest.amount_vnd)}
                                </p>
                                <div className="mt-2">{getStatusBadge(selectedRequest.status)}</div>
                            </div>

                            {/* Job & Worker Info */}
                            <div className="bg-muted/50 rounded-xl p-4">
                                <p className="text-sm font-medium text-foreground mb-2">Thông tin công việc</p>
                                <p className="text-muted-foreground">{selectedRequest.job_title}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{selectedRequest.worker_name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedRequest.worker_phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-muted/50 rounded-xl p-4">
                                <p className="text-sm font-medium text-foreground mb-2">
                                    Thông tin tài khoản Worker • {selectedRequest.payment_method.toUpperCase()}
                                </p>

                                {(selectedRequest.payment_method === 'momo' || selectedRequest.payment_method === 'zalopay') ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-muted-foreground" />
                                            <span className="font-mono text-lg text-foreground">
                                                {selectedRequest.payment_info.phone}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(selectedRequest.payment_info.phone || '')}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Ngân hàng:</span>
                                            <span className="font-medium text-foreground">{selectedRequest.payment_info.bank_name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Số TK:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-foreground">{selectedRequest.payment_info.bank_account}</span>
                                                <button onClick={() => copyToClipboard(selectedRequest.payment_info.bank_account || '')}>
                                                    <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Chủ TK:</span>
                                            <span className="font-medium text-foreground uppercase">{selectedRequest.payment_info.account_holder}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {selectedRequest.status === 'pending' && (
                                <div className="pt-4">
                                    <Button
                                        className="w-full bg-success hover:bg-success/90"
                                        onClick={() => handleMarkAsPaid(selectedRequest.id)}
                                        disabled={processingId === selectedRequest.id}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Xác nhận đã thanh toán
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        Bấm sau khi đã chuyển tiền cho Worker
                                    </p>
                                </div>
                            )}

                            {selectedRequest.status === 'paid' && selectedRequest.paid_at && (
                                <div className="pt-4 text-center text-sm text-muted-foreground">
                                    Đã thanh toán lúc {format(new Date(selectedRequest.paid_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
