'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    Star,
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle,
    Award,
    Info,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    PenaltyService,
    PenaltyHistoryEntry,
    FreezeStatus,
    PENALTY_LABELS,
    PenaltyReason
} from '@/lib/services/penalty.service';

export default function WorkerReliabilityPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reliabilityScore, setReliabilityScore] = useState(100);
    const [history, setHistory] = useState<PenaltyHistoryEntry[]>([]);
    const [freezeStatus, setFreezeStatus] = useState<FreezeStatus | null>(null);
    const [stats, setStats] = useState({
        completedJobs: 0,
        noShows: 0,
        lateCancels: 0,
        averageScore: 100,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('reliability_score')
                .eq('id', user.id)
                .single();

            setReliabilityScore(profile?.reliability_score || 100);

            // Fetch history
            const historyData = await PenaltyService.getPenaltyHistory(user.id, 30);
            setHistory(historyData);

            // Fetch freeze status
            const freeze = await PenaltyService.getFreezeStatus(user.id);
            setFreezeStatus(freeze);

            // Calculate stats from history
            const noShows = historyData.filter(h => h.reason === PenaltyReason.NO_SHOW).length;
            const lateCancels = historyData.filter(h =>
                h.reason === PenaltyReason.LATE_CANCEL_3H ||
                h.reason === PenaltyReason.LATE_CANCEL_12H ||
                h.reason === PenaltyReason.LATE_CANCEL_24H
            ).length;
            const completions = historyData.filter(h => h.reason === PenaltyReason.COMPLETION).length;

            setStats({
                completedJobs: completions,
                noShows,
                lateCancels,
                averageScore: profile?.reliability_score || 100,
            });
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-success';
        if (score >= 70) return 'text-warning';
        return 'text-destructive';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 90) return 'bg-success';
        if (score >= 70) return 'bg-warning';
        return 'bg-destructive';
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="w-4 h-4 text-success" />;
        if (change < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
        return null;
    };

    const getReasonIcon = (reason: PenaltyReason) => {
        switch (reason) {
            case PenaltyReason.NO_SHOW:
                return <XCircle className="w-5 h-5 text-destructive" />;
            case PenaltyReason.LATE_CANCEL_3H:
            case PenaltyReason.LATE_CANCEL_12H:
            case PenaltyReason.LATE_CANCEL_24H:
                return <Clock className="w-5 h-5 text-warning" />;
            case PenaltyReason.COMPLETION:
            case PenaltyReason.EXCELLENT_REVIEW:
                return <CheckCircle2 className="w-5 h-5 text-success" />;
            case PenaltyReason.ON_TIME_STREAK:
                return <Award className="w-5 h-5 text-primary" />;
            default:
                return <AlertTriangle className="w-5 h-5 text-muted-foreground" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className={`pt-8 pb-16 px-4 ${getScoreBgColor(reliabilityScore)}`}>
                <div className="max-w-2xl mx-auto">
                    <Link href="/worker/profile" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </Link>

                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                            <Star className="w-10 h-10 text-white fill-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2">{reliabilityScore}</h1>
                        <p className="text-white/80">Điểm Tin Cậy</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-8 space-y-6">
                {/* Freeze Alert */}
                {freezeStatus?.isFrozen && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-destructive">Tài khoản bị tạm khóa</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {freezeStatus.freezeUntil
                                        ? `Khóa đến: ${format(freezeStatus.freezeUntil, 'dd/MM/yyyy HH:mm', { locale: vi })}`
                                        : 'Khóa vĩnh viễn do vi phạm nghiêm trọng'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Số lần không đến làm: {freezeStatus.noShowCount}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Score Summary */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="font-bold text-foreground mb-4">Tổng quan</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-success/10 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-success">{stats.completedJobs}</p>
                            <p className="text-xs text-muted-foreground mt-1">Ca hoàn thành</p>
                        </div>
                        <div className="bg-destructive/10 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-destructive">{stats.noShows}</p>
                            <p className="text-xs text-muted-foreground mt-1">Không đến làm</p>
                        </div>
                        <div className="bg-warning/10 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-warning">{stats.lateCancels}</p>
                            <p className="text-xs text-muted-foreground mt-1">Hủy muộn</p>
                        </div>
                        <div className="bg-primary/10 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-primary">{reliabilityScore >= 90 ? 'Tốt' : reliabilityScore >= 70 ? 'TB' : 'Thấp'}</p>
                            <p className="text-xs text-muted-foreground mt-1">Xếp hạng</p>
                        </div>
                    </div>
                </div>

                {/* Score Progress */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="font-bold text-foreground mb-4">Thanh điểm</h2>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`absolute left-0 top-0 h-full transition-all duration-500 ${getScoreBgColor(reliabilityScore)}`}
                            style={{ width: `${reliabilityScore}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>0</span>
                        <span className="text-warning">70 (Tối thiểu)</span>
                        <span className="text-success">90 (Tốt)</span>
                        <span>100</span>
                    </div>
                </div>

                {/* History */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="font-bold text-foreground">Lịch sử điểm</h2>
                    </div>

                    {history.length === 0 ? (
                        <div className="p-8 text-center">
                            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">Chưa có lịch sử</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {history.map((entry) => (
                                <div key={entry.id} className="p-4 flex items-center gap-4">
                                    <div className="flex-shrink-0">
                                        {getReasonIcon(entry.reason)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">
                                            {entry.reasonLabel}
                                        </p>
                                        {entry.relatedJobTitle && (
                                            <p className="text-sm text-muted-foreground truncate">
                                                {entry.relatedJobTitle}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {format(entry.createdAt, 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center gap-1 justify-end">
                                            {getChangeIcon(entry.scoreChange)}
                                            <span className={`font-bold ${entry.scoreChange > 0 ? 'text-success' :
                                                    entry.scoreChange < 0 ? 'text-destructive' :
                                                        'text-muted-foreground'
                                                }`}>
                                                {entry.scoreChange > 0 ? '+' : ''}{entry.scoreChange}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {entry.previousScore} → {entry.newScore}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tips */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                    <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        Cách tăng điểm tin cậy
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span>Hoàn thành các ca làm việc đúng giờ (+1 điểm mỗi ca)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Star className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                            <span>Nhận đánh giá 5 sao từ chủ quán (+2 điểm)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Award className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Đúng giờ 5 lần liên tiếp (+3 điểm bonus)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                            <span className="text-destructive font-medium">Không đến làm (No-show): -20 điểm, cấm nếu 3 lần!</span>
                        </li>
                    </ul>
                </div>

                {/* CTA */}
                <Link href="/worker/feed">
                    <Button className="w-full h-12" size="lg">
                        Tìm việc để tăng điểm
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
