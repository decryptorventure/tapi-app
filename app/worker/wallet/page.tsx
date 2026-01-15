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
    TrendingDown,
    Banknote,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    ArrowDownRight,
    Gift,
    AlertTriangle,
    Calendar,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { EarningsService, WalletBalance, Transaction } from '@/lib/services/earnings.service';

export default function WorkerWalletPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState<WalletBalance | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        pendingCount: 0,
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
            const [walletBalance, txHistory, earningSummary] = await Promise.all([
                EarningsService.getWalletBalance(user.id),
                EarningsService.getTransactionHistory(user.id, 20),
                EarningsService.getEarningsSummary(user.id),
            ]);

            setBalance(walletBalance);
            setTransactions(txHistory);
            setSummary(earningSummary);
        } catch (error) {
            console.error('Fetch wallet error:', error);
            toast.error('Lỗi tải dữ liệu ví');
        } finally {
            setLoading(false);
        }
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const withdrawCheck = balance ? EarningsService.canWithdraw(balance) : { canWithdraw: false, minAmount: 50000 };

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
                            disabled={!withdrawCheck.canWithdraw}
                            onClick={() => toast.info('Tính năng rút tiền sẽ sớm ra mắt!')}
                        >
                            <Banknote className="w-4 h-4 mr-2" />
                            {withdrawCheck.canWithdraw ? 'Rút tiền' : withdrawCheck.reason}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 -mt-8 space-y-6">
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
                                Thu nhập sẽ được cộng vào ví sau 24 giờ kể từ khi hoàn thành ca làm.
                                Bạn có thể rút tiền khi số dư đạt tối thiểu 50,000đ.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
