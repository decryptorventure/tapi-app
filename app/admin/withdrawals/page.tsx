'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    Banknote,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowLeft,
    Phone,
    Building2,
    User,
    Search,
    RefreshCw,
    QrCode,
    Copy,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { WithdrawalService, WithdrawalRequest } from '@/lib/services/withdrawal.service';
import { EarningsService } from '@/lib/services/earnings.service';

type FilterStatus = 'all' | 'pending' | 'processing' | 'completed' | 'rejected';

export default function AdminWithdrawalsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await WithdrawalService.getAllRequests(
                filterStatus === 'all' ? undefined : filterStatus
            );
            setRequests(data);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (
        requestId: string,
        status: 'processing' | 'completed' | 'rejected'
    ) => {
        setProcessingId(requestId);

        const supabase = createUntypedClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error('Vui lòng đăng nhập lại');
            return;
        }

        const result = await WithdrawalService.updateStatus(
            requestId,
            status,
            user.id,
            adminNotes
        );

        if (result.success) {
            toast.success(
                status === 'completed'
                    ? 'Đã xác nhận chuyển tiền!'
                    : status === 'processing'
                        ? 'Đã đánh dấu đang xử lý'
                        : 'Đã từ chối yêu cầu'
            );
            fetchRequests();
            setSelectedRequest(null);
            setAdminNotes('');
        } else {
            toast.error(result.error || 'Có lỗi xảy ra');
        }

        setProcessingId(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã copy!');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã chuyển</span>;
            case 'processing':
                return <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center gap-1"><Loader2 className="w-3 h-3" /> Đang xử lý</span>;
            case 'pending':
                return <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Từ chối</span>;
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
        processing: requests.filter(r => r.status === 'processing').length,
        today: requests.filter(r =>
            r.status === 'completed' &&
            new Date(r.processed_at || '').toDateString() === new Date().toDateString()
        ).reduce((sum, r) => sum + r.amount_vnd, 0),
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Quản lý Rút tiền</h1>
                                <p className="text-sm text-muted-foreground">Xử lý yêu cầu rút tiền từ Worker</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchRequests}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                        <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">Đang xử lý</p>
                        <p className="text-2xl font-bold text-primary">{stats.processing}</p>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">Đã chuyển hôm nay</p>
                        <p className="text-2xl font-bold text-success">{EarningsService.formatCurrency(stats.today)}</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {(['all', 'pending', 'processing', 'completed', 'rejected'] as FilterStatus[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${filterStatus === status
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {status === 'all' && 'Tất cả'}
                            {status === 'pending' && 'Chờ duyệt'}
                            {status === 'processing' && 'Đang xử lý'}
                            {status === 'completed' && 'Đã chuyển'}
                            {status === 'rejected' && 'Từ chối'}
                        </button>
                    ))}
                </div>

                {/* Request List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                        <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Không có yêu cầu nào</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(request => (
                            <div
                                key={request.id}
                                className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
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
                                                {request.user_name || 'Worker'} • {request.payment_method.toUpperCase()}
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
                            <h2 className="text-lg font-bold text-foreground">Chi tiết Yêu cầu</h2>
                            <button
                                onClick={() => { setSelectedRequest(null); setAdminNotes(''); }}
                                className="p-2 hover:bg-muted rounded-lg"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Amount */}
                            <div className="text-center py-4 bg-muted/50 rounded-xl">
                                <p className="text-sm text-muted-foreground">Số tiền</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {EarningsService.formatCurrency(selectedRequest.amount_vnd)}
                                </p>
                                <div className="mt-2">{getStatusBadge(selectedRequest.status)}</div>
                            </div>

                            {/* User Info */}
                            <div className="bg-muted/50 rounded-xl p-4">
                                <p className="text-sm font-medium text-foreground mb-2">Người yêu cầu</p>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{selectedRequest.user_name || 'N/A'}</p>
                                        <p className="text-sm text-muted-foreground">{selectedRequest.user_phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-muted/50 rounded-xl p-4">
                                <p className="text-sm font-medium text-foreground mb-2">
                                    Thông tin thanh toán • {selectedRequest.payment_method.toUpperCase()}
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

                            {/* Admin Notes */}
                            {selectedRequest.status === 'pending' || selectedRequest.status === 'processing' ? (
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Ghi chú (tùy chọn)
                                    </label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground resize-none"
                                        rows={2}
                                        placeholder="Ghi chú nội bộ..."
                                    />
                                </div>
                            ) : selectedRequest.admin_notes ? (
                                <div className="bg-muted/50 rounded-xl p-4">
                                    <p className="text-sm font-medium text-foreground mb-1">Ghi chú admin</p>
                                    <p className="text-muted-foreground">{selectedRequest.admin_notes}</p>
                                </div>
                            ) : null}

                            {/* Actions */}
                            {selectedRequest.status === 'pending' && (
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                                        disabled={processingId === selectedRequest.id}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Từ chối
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={() => handleUpdateStatus(selectedRequest.id, 'processing')}
                                        disabled={processingId === selectedRequest.id}
                                    >
                                        {processingId === selectedRequest.id ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Clock className="w-4 h-4 mr-2" />
                                        )}
                                        Bắt đầu xử lý
                                    </Button>
                                </div>
                            )}

                            {selectedRequest.status === 'processing' && (
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                                        disabled={processingId === selectedRequest.id}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Từ chối
                                    </Button>
                                    <Button
                                        className="flex-1 bg-success hover:bg-success/90"
                                        onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                                        disabled={processingId === selectedRequest.id}
                                    >
                                        {processingId === selectedRequest.id ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                        )}
                                        Đã chuyển tiền
                                    </Button>
                                </div>
                            )}

                            {(selectedRequest.status === 'completed' || selectedRequest.status === 'rejected') && (
                                <div className="pt-4 text-center text-sm text-muted-foreground">
                                    Xử lý bởi admin lúc {selectedRequest.processed_at && format(new Date(selectedRequest.processed_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
