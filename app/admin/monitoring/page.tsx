'use client';

import { useState, useEffect } from 'react';
import { createUntypedClient } from '@/lib/supabase/client';
import {
    Users,
    Briefcase,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';

interface Metrics {
    activeWorkers: number;
    activeJobs: number;
    totalApplications: number;
    approvedApplications: number;
    instantBookRate: number;
    checkInSuccessRate: number;
    noShowRate: number;
    avgReliabilityScore: number;
}

export default function MonitoringDashboard() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchMetrics = async () => {
        setLoading(true);
        const supabase = createUntypedClient();

        try {
            // Active workers (registered, not frozen)
            const { count: activeWorkers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'worker')
                .eq('is_account_frozen', false);

            // Active jobs (open status)
            const { count: activeJobs } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'open');

            // Total applications (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const { count: totalApplications } = await supabase
                .from('job_applications')
                .select('*', { count: 'exact', head: true })
                .gte('applied_at', weekAgo.toISOString());

            // Approved applications (last 7 days)
            const { count: approvedApplications } = await supabase
                .from('job_applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved')
                .gte('applied_at', weekAgo.toISOString());

            // Instant book rate
            const { data: instantBookData } = await supabase
                .from('job_applications')
                .select('is_instant_book')
                .gte('applied_at', weekAgo.toISOString());

            const instantBooks = instantBookData?.filter(a => a.is_instant_book).length || 0;
            const instantBookRate = instantBookData?.length
                ? (instantBooks / instantBookData.length) * 100
                : 0;

            // Check-in success rate
            const { data: checkinsData } = await supabase
                .from('checkins')
                .select('is_valid, checkin_type')
                .eq('checkin_type', 'check_in')
                .gte('checkin_time', weekAgo.toISOString());

            const validCheckins = checkinsData?.filter(c => c.is_valid !== false).length || 0;
            const checkInSuccessRate = checkinsData?.length
                ? (validCheckins / checkinsData.length) * 100
                : 100;

            // No-show rate
            const { count: noShowCount } = await supabase
                .from('job_applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'no_show')
                .gte('applied_at', weekAgo.toISOString());

            const noShowRate = approvedApplications && approvedApplications > 0
                ? ((noShowCount || 0) / (approvedApplications + (noShowCount || 0))) * 100
                : 0;

            // Average reliability score
            const { data: reliabilityData } = await supabase
                .from('profiles')
                .select('reliability_score')
                .eq('role', 'worker')
                .eq('is_account_frozen', false);

            const avgScore = reliabilityData?.length
                ? reliabilityData.reduce((sum, p) => sum + p.reliability_score, 0) / reliabilityData.length
                : 85;

            setMetrics({
                activeWorkers: activeWorkers || 0,
                activeJobs: activeJobs || 0,
                totalApplications: totalApplications || 0,
                approvedApplications: approvedApplications || 0,
                instantBookRate: Math.round(instantBookRate),
                checkInSuccessRate: Math.round(checkInSuccessRate),
                noShowRate: Math.round(noShowRate * 10) / 10,
                avgReliabilityScore: Math.round(avgScore),
            });

            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const MetricCard = ({
        title,
        value,
        icon: Icon,
        suffix = '',
        target,
        alertThreshold,
        isGood
    }: {
        title: string;
        value: number | string;
        icon: any;
        suffix?: string;
        target?: number;
        alertThreshold?: number;
        isGood?: (v: number) => boolean;
    }) => {
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        const showAlert = alertThreshold !== undefined && isGood && !isGood(numValue);

        return (
            <div className={`bg-card border rounded-xl p-6 ${showAlert ? 'border-destructive' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${showAlert ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <Icon className={`w-6 h-6 ${showAlert ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                    {showAlert && <AlertTriangle className="w-5 h-5 text-destructive" />}
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                    {value}{suffix}
                </div>
                <div className="text-sm text-muted-foreground">{title}</div>
                {target !== undefined && (
                    <div className="text-xs text-muted-foreground mt-2">
                        Mục tiêu: {target}{suffix}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Monitoring Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Phase 2 Soft Launch - Real-time KPIs
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {lastUpdated && (
                            <span className="text-sm text-muted-foreground">
                                Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
                            </span>
                        )}
                        <button
                            onClick={fetchMetrics}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Workers hoạt động"
                        value={metrics?.activeWorkers || 0}
                        icon={Users}
                        target={100}
                    />
                    <MetricCard
                        title="Jobs đang mở"
                        value={metrics?.activeJobs || 0}
                        icon={Briefcase}
                    />
                    <MetricCard
                        title="Đơn ứng tuyển (7 ngày)"
                        value={metrics?.totalApplications || 0}
                        icon={Clock}
                    />
                    <MetricCard
                        title="Điểm reliability TB"
                        value={metrics?.avgReliabilityScore || 0}
                        icon={TrendingUp}
                    />
                </div>

                {/* Key Performance Indicators */}
                <div className="bg-card border border-border rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-6">Chỉ số quan trọng</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Instant Book Rate"
                            value={metrics?.instantBookRate || 0}
                            suffix="%"
                            icon={CheckCircle2}
                            target={70}
                            alertThreshold={50}
                            isGood={(v) => v >= 50}
                        />
                        <MetricCard
                            title="Check-in thành công"
                            value={metrics?.checkInSuccessRate || 0}
                            suffix="%"
                            icon={CheckCircle2}
                            target={90}
                            alertThreshold={80}
                            isGood={(v) => v >= 80}
                        />
                        <MetricCard
                            title="Tỷ lệ No-show"
                            value={metrics?.noShowRate || 0}
                            suffix="%"
                            icon={XCircle}
                            target={5}
                            alertThreshold={10}
                            isGood={(v) => v <= 10}
                        />
                        <MetricCard
                            title="Approval Rate"
                            value={metrics?.totalApplications
                                ? Math.round((metrics?.approvedApplications / metrics?.totalApplications) * 100)
                                : 0}
                            suffix="%"
                            icon={CheckCircle2}
                        />
                    </div>
                </div>

                {/* Alert Thresholds Legend */}
                <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Ngưỡng cảnh báo</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>Instant Book: &lt;50% → Cảnh báo</div>
                        <div>Check-in: &lt;80% → Cảnh báo</div>
                        <div>No-show: &gt;10% → Cảnh báo</div>
                        <div>API p95: &gt;1s → Cảnh báo</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
