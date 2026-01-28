'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    Wallet,
    ArrowLeft,
    TrendingUp,
    Banknote,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    ArrowDownRight,
    Gift,
    AlertTriangle,
    ChevronRight,
    X,
    Smartphone,
    Building2,
    QrCode
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { EarningsService, WalletBalance, Transaction } from '@/lib/services/earnings.service';
import { WithdrawalService, WithdrawalRequest, PaymentMethod } from '@/lib/services/withdrawal.service';

export default function WorkerWalletPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState<WalletBalance | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [summary, setSummary] = useState({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        pendingCount: 0,
    });

    // Withdrawal modal state
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        method: 'momo' as PaymentMethod,
        phone: '',
        bankName: '',
        bankAccount: '',
        accountHolder: '',
    });

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch all wallet data in parallel
            const [walletBalance, txHistory, earningSummary, userWithdrawals] = await Promise.all([
                EarningsService.getWalletBalance(user.id),
                EarningsService.getTransactionHistory(user.id, 20),
                EarningsService.getEarningsSummary(user.id),
                WithdrawalService.getUserRequests(user.id),
            ]);

            setBalance(walletBalance);
            setTransactions(txHistory);
            setSummary(earningSummary);
            setWithdrawals(userWithdrawals);
        } catch (error) {
            console.error('Fetch wallet error:', error);
            toast.error('Lỗi tải dữ liệu ví');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setWithdrawLoading(true);

        const supabase = createUntypedClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error('Vui lòng đăng nhập lại');
            return;
        }

        const amount = parseInt(withdrawForm.amount);
        if (isNaN(amount) || amount < 50000) {
            toast.error('Số tiền rút tối thiểu là 50,000đ');
            setWithdrawLoading(false);
            return;
        }

        const paymentInfo: any = {};
        if (withdrawForm.method === 'momo' || withdrawForm.method === 'zalopay') {
            if (!withdrawForm.phone) {
                toast.error('Vui lòng nhập số điện thoại');
                setWithdrawLoading(false);
                return;
            }
            paymentInfo.phone = withdrawForm.phone;
        } else {
            if (!withdrawForm.bankName || !withdrawForm.bankAccount || !withdrawForm.accountHolder) {
                toast.error('Vui lòng nhập đầy đủ thông tin ngân hàng');
                setWithdrawLoading(false);
                return;
            }
            paymentInfo.bank_name = withdrawForm.bankName;
            paymentInfo.bank_account = withdrawForm.bankAccount;
            paymentInfo.account_holder = withdrawForm.accountHolder;
        }

        const result = await WithdrawalService.createRequest(user.id, {
            amount_vnd: amount,
            payment_method: withdrawForm.method,
            payment_info: paymentInfo,
        });

        if (result.success) {
            toast.success('Yêu cầu rút tiền đã được gửi! Chúng tôi sẽ xử lý trong 24h.');
            setShowWithdrawModal(false);
            fetchWalletData();
            setWithdrawForm({
                amount: '',
                method: 'momo',
                phone: '',
                bankName: '',
                bankAccount: '',
                accountHolder: '',
            });
        } else {
            toast.error(result.error || 'Có lỗi xảy ra');
        }

        setWithdrawLoading(false);
    };

    const getTransactionIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'earning':
                return <ArrowDownRight className="w-5 h-5 text-success" />;
            case 'payout':
                return <ArrowUpRight className="w-5 h-5 text-primary" />;
            case 'penalty':
                return <AlertTriangle className="w-5 h-5 text-destructive" />;
            case 'bonus':
                return <Gift className="w-5 h-5 text-warning" />;
            default:
                return <Banknote className="w-5 h-5 text-muted-foreground" />;
        }
    };

    const getTransactionColor = (type: Transaction['type']) => {
        switch (type) {
            case 'earning':
            case 'bonus':
                return 'text-success';
            case 'payout':
            case 'penalty':
                return 'text-destructive';
            default:
                return 'text-foreground';
        }
    };

    const getStatusBadge = (status: Transaction['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3 h-3" />
                        Hoàn thành
                    </span>
                );
            case 'pending':
                return (
                    <span className="flex items-center gap-1 text-xs text-warning">
                        <Clock className="w-3 h-3" />
                        Đang xử lý
                    </span>
                );
            case 'failed':
                return (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="w-3 h-3" />
                        Thất bại
                    </span>
                );
            default:
                return null;
        }
    };

    const getWithdrawalStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">Đã chuyển</span>;
            case 'processing':
                return <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">Đang xử lý</span>;
            case 'pending':
                return <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs font-medium rounded-full">Chờ duyệt</span>;
            case 'rejected':
                return <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full">Từ chối</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const withdrawCheck = balance ? EarningsService.canWithdraw(balance) : { canWithdraw: false, minAmount: 50000 };
    const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending' || w.status === 'processing');

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-primary/80 pt-8 pb-20 px-4">
                <div className="max-w-lg mx-auto">
                    <Link href="/worker/dashboard" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </Link>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <Wallet className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl font-bold text-primary-foreground">Ví của tôi</h1>
                    </div>

                    {/* Balance Card */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <p className="text-primary-foreground/70 text-sm mb-1">Số dư khả dụng</p>
                        <p className="text-4xl font-bold text-primary-foreground mb-4">
                            {EarningsService.formatCurrency(balance?.available || 0)}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-primary-foreground/80">
                                <Clock className="w-4 h-4" />
                                <span>Đang xử lý: {EarningsService.formatCurrency(balance?.pending || 0)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full mt-4 bg-white text-primary hover:bg-white/90"
                            disabled={!withdrawCheck.canWithdraw || hasPendingWithdrawal}
                            onClick={() => setShowWithdrawModal(true)}
                        >
                            <Banknote className="w-4 h-4 mr-2" />
                            {hasPendingWithdrawal
                                ? 'Đang có yêu cầu chờ xử lý'
                                : withdrawCheck.canWithdraw
                                    ? 'Rút tiền'
                                    : withdrawCheck.reason}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 -mt-8 space-y-6">
                {/* Pending Withdrawals */}
                {withdrawals.filter(w => w.status === 'pending' || w.status === 'processing').length > 0 && (
                    <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4">
                        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-warning" />
                            Yêu cầu rút tiền đang xử lý
                        </h3>
                        <div className="space-y-2">
                            {withdrawals.filter(w => w.status === 'pending' || w.status === 'processing').map(w => (
                                <div key={w.id} className="flex items-center justify-between bg-card rounded-xl p-3">
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {EarningsService.formatCurrency(w.amount_vnd)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {w.payment_method.toUpperCase()} • {format(new Date(w.created_at), 'dd/MM HH:mm')}
                                        </p>
                                    </div>
                                    {getWithdrawalStatusBadge(w.status)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Earnings Summary */}
                <div className="bg-card rounded-2xl border border-border p-5">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-success" />
                        Thu nhập
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-success">
                                {(summary.today / 1000).toFixed(0)}k
                            </p>
                            <p className="text-xs text-muted-foreground">Hôm nay</p>
                        </div>
                        <div className="text-center border-x border-border">
                            <p className="text-2xl font-bold text-primary">
                                {(summary.thisWeek / 1000).toFixed(0)}k
                            </p>
                            <p className="text-xs text-muted-foreground">Tuần này</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-warning">
                                {(summary.thisMonth / 1000).toFixed(0)}k
                            </p>
                            <p className="text-xs text-muted-foreground">Tháng này</p>
                        </div>
                    </div>
                </div>

                {/* Total Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card rounded-xl border border-border p-4">
                        <p className="text-sm text-muted-foreground mb-1">Tổng thu nhập</p>
                        <p className="text-xl font-bold text-success">
                            {EarningsService.formatCurrency(balance?.total_earned || 0)}
                        </p>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4">
                        <p className="text-sm text-muted-foreground mb-1">Đã rút</p>
                        <p className="text-xl font-bold text-primary">
                            {EarningsService.formatCurrency(balance?.total_withdrawn || 0)}
                        </p>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold text-foreground">Lịch sử giao dịch</h3>
                        {summary.pendingCount > 0 && (
                            <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs font-medium rounded-full">
                                {summary.pendingCount} đang xử lý
                            </span>
                        )}
                    </div>

                    {transactions.length === 0 ? (
                        <div className="p-8 text-center">
                            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">Chưa có giao dịch nào</p>
                            <Link href="/worker/feed" className="mt-4 inline-block">
                                <Button variant="outline" size="sm">
                                    Tìm việc ngay
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center gap-4">
                                    <div className="p-2 bg-muted rounded-lg">
                                        {getTransactionIcon(tx.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">
                                            {tx.description}
                                        </p>
                                        {tx.job_title && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {tx.job_title}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground">
                                                {format(tx.created_at, 'dd/MM HH:mm', { locale: vi })}
                                            </span>
                                            {getStatusBadge(tx.status)}
                                        </div>
                                    </div>
                                    <p className={`font-bold ${getTransactionColor(tx.type)}`}>
                                        {tx.type === 'earning' || tx.type === 'bonus' ? '+' : '-'}
                                        {EarningsService.formatCurrency(tx.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">Thời gian xử lý</p>
                            <p className="text-sm text-muted-foreground">
                                Yêu cầu rút tiền sẽ được xử lý trong vòng 24 giờ làm việc.
                                Số tiền tối thiểu để rút là 50,000đ.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">Rút tiền</h2>
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleWithdraw} className="p-4 space-y-4">
                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Số tiền muốn rút
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min={50000}
                                        max={balance?.available || 0}
                                        value={withdrawForm.amount}
                                        onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all text-foreground text-lg font-bold"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                        VNĐ
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tối thiểu 50,000đ • Khả dụng: {EarningsService.formatCurrency(balance?.available || 0)}
                                </p>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Phương thức nhận tiền
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'momo', label: 'MoMo', icon: Smartphone, color: 'text-pink-600' },
                                        { value: 'zalopay', label: 'ZaloPay', icon: Smartphone, color: 'text-blue-600' },
                                        { value: 'bank_transfer', label: 'Ngân hàng', icon: Building2, color: 'text-slate-600' },
                                    ].map((method) => (
                                        <button
                                            key={method.value}
                                            type="button"
                                            onClick={() => setWithdrawForm({ ...withdrawForm, method: method.value as PaymentMethod })}
                                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${withdrawForm.method === method.value
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <method.icon className={`w-5 h-5 ${method.color}`} />
                                            <span className="text-xs font-medium text-foreground">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Info */}
                            {(withdrawForm.method === 'momo' || withdrawForm.method === 'zalopay') ? (
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Số điện thoại {withdrawForm.method === 'momo' ? 'MoMo' : 'ZaloPay'}
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={withdrawForm.phone}
                                        onChange={(e) => setWithdrawForm({ ...withdrawForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all text-foreground"
                                        placeholder="0901234567"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Tên ngân hàng
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={withdrawForm.bankName}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all text-foreground"
                                            placeholder="VD: Vietcombank, Techcombank..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Số tài khoản
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={withdrawForm.bankAccount}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, bankAccount: e.target.value })}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all text-foreground"
                                            placeholder="Nhập số tài khoản"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Tên chủ tài khoản
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={withdrawForm.accountHolder}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all text-foreground uppercase"
                                            placeholder="NGUYEN VAN A"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Note */}
                            <div className="bg-muted/50 rounded-xl p-3">
                                <p className="text-sm text-muted-foreground">
                                    Yêu cầu sẽ được xử lý trong 24 giờ làm việc. Bạn sẽ nhận được thông báo khi hoàn tất.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-bold"
                                disabled={withdrawLoading}
                            >
                                {withdrawLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Banknote className="w-5 h-5 mr-2" />
                                        Gửi yêu cầu rút tiền
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
