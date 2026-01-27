'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUntypedClient } from '@/lib/supabase/client';
import { adminService, AdminStats, GrowthData, TopPerformer, ADMIN_EMAILS } from '@/lib/services/admin.service';
import { StatCard } from '@/components/admin/stat-card';
import { ChartContainer, ConversionFunnel, FunnelData } from '@/components/admin/chart-container';
import { Button } from '@/components/ui/button';
import {
    Users,
    Building2,
    Briefcase,
    FileCheck,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle2,
    RefreshCw,
    Loader2,
    Shield,
    ChevronRight,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
} from 'recharts';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [growthData, setGrowthData] = useState<GrowthData[]>([]);
    const [topWorkers, setTopWorkers] = useState<TopPerformer[]>([]);
    const [topEmployers, setTopEmployers] = useState<TopPerformer[]>([]);
    const [funnelData, setFunnelData] = useState<FunnelData[]>([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [statsData, growth, workers, employers, funnel] = await Promise.all([
                adminService.getStats(),
                adminService.getGrowthData(30),
                adminService.getTopWorkers(5),
                adminService.getTopEmployers(5),
                adminService.getConversionFunnel(),
            ]);

            setStats(statsData);
            setGrowthData(growth);
            setTopWorkers(workers);
            setTopEmployers(employers);
            setFunnelData(funnel);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000000) {
            return `${(value / 1000000000).toFixed(1)}B`;
        }
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}K`;
        }
        return value.toString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Tổng quan hệ thống và số liệu</p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Làm mới
                </Button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng người dùng"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="w-5 h-5 text-primary" />}
                    iconClassName="bg-primary/10"
                    description={`${stats?.totalWorkers || 0} workers, ${stats?.totalOwners || 0} owners`}
                />
                <StatCard
                    title="Tổng Jobs"
                    value={stats?.totalJobs || 0}
                    icon={<Briefcase className="w-5 h-5 text-cta" />}
                    iconClassName="bg-cta/10"
                    description={`${stats?.activeJobs || 0} đang mở`}
                />
                <StatCard
                    title="Tổng Applications"
                    value={stats?.totalApplications || 0}
                    icon={<FileCheck className="w-5 h-5 text-success" />}
                    iconClassName="bg-success/10"
                    description={`${stats?.approvedApplications || 0} đã duyệt`}
                />
                <StatCard
                    title="Doanh thu"
                    value={stats?.totalRevenue || 0}
                    icon={<DollarSign className="w-5 h-5 text-warning" />}
                    iconClassName="bg-warning/10"
                    formatValue={(v) => `${formatCurrency(v)}đ`}
                />
            </div>

            {/* Quick Actions */}
            {stats && stats.pendingVerifications > 0 && (
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-warning" />
                        <div>
                            <p className="font-medium text-warning">Có {stats.pendingVerifications} xác minh đang chờ</p>
                            <p className="text-sm text-warning/80">Cần xử lý để người dùng có thể hoạt động</p>
                        </div>
                    </div>
                    <Link href="/admin/verifications">
                        <Button size="sm" variant="outline" className="border-warning/50 text-warning hover:bg-warning/10">
                            Xem ngay
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Chart */}
                <ChartContainer
                    title="Tăng trưởng 30 ngày"
                    description="Người dùng, jobs và applications mới"
                >
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={growthData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => value.slice(5)}
                                className="text-xs"
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis
                                className="text-xs"
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="users"
                                name="Users"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="jobs"
                                name="Jobs"
                                stroke="hsl(var(--cta))"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="applications"
                                name="Applications"
                                stroke="hsl(var(--success))"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* Conversion Funnel */}
                <ChartContainer
                    title="Conversion Funnel"
                    description="Tỷ lệ chuyển đổi từ ứng tuyển → hoàn thành"
                >
                    <ConversionFunnel data={funnelData} />
                </ChartContainer>
            </div>

            {/* Top Performers Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Workers */}
                <ChartContainer
                    title="Top Workers"
                    description="Workers hoàn thành nhiều jobs nhất"
                    headerAction={
                        <Link href="/admin/users?tab=workers">
                            <Button variant="ghost" size="sm">
                                Xem tất cả
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    }
                >
                    <div className="space-y-3">
                        {topWorkers.length > 0 ? (
                            topWorkers.map((worker, index) => (
                                <div
                                    key={worker.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <span className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                        index === 0 ? "bg-warning/20 text-warning" :
                                            index === 1 ? "bg-muted text-muted-foreground" :
                                                index === 2 ? "bg-orange-100 text-orange-600" :
                                                    "bg-muted/50 text-muted-foreground"
                                    )}>
                                        {index + 1}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                        {worker.avatar_url ? (
                                            <img src={worker.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">{worker.name}</p>
                                        <p className="text-xs text-muted-foreground">{worker.extra}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-foreground">{worker.count}</p>
                                        <p className="text-xs text-muted-foreground">jobs</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
                        )}
                    </div>
                </ChartContainer>

                {/* Top Employers */}
                <ChartContainer
                    title="Top Employers"
                    description="Chủ nhà hàng đăng nhiều jobs nhất"
                    headerAction={
                        <Link href="/admin/users?tab=owners">
                            <Button variant="ghost" size="sm">
                                Xem tất cả
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    }
                >
                    <div className="space-y-3">
                        {topEmployers.length > 0 ? (
                            topEmployers.map((employer, index) => (
                                <div
                                    key={employer.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <span className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                        index === 0 ? "bg-warning/20 text-warning" :
                                            index === 1 ? "bg-muted text-muted-foreground" :
                                                index === 2 ? "bg-orange-100 text-orange-600" :
                                                    "bg-muted/50 text-muted-foreground"
                                    )}>
                                        {index + 1}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                        {employer.avatar_url ? (
                                            <img src={employer.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">{employer.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{employer.extra}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-foreground">{employer.count}</p>
                                        <p className="text-xs text-muted-foreground">jobs</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
                        )}
                    </div>
                </ChartContainer>
            </div>

            {/* Jobs Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Jobs đang mở"
                    value={stats?.activeJobs || 0}
                    icon={<Activity className="w-5 h-5 text-primary" />}
                    iconClassName="bg-primary/10"
                />
                <StatCard
                    title="Jobs hoàn thành"
                    value={stats?.completedJobs || 0}
                    icon={<CheckCircle2 className="w-5 h-5 text-success" />}
                    iconClassName="bg-success/10"
                />
                <StatCard
                    title="Applications đã duyệt"
                    value={stats?.approvedApplications || 0}
                    icon={<FileCheck className="w-5 h-5 text-cta" />}
                    iconClassName="bg-cta/10"
                />
                <StatCard
                    title="Shifts hoàn thành"
                    value={stats?.completedApplications || 0}
                    icon={<TrendingUp className="w-5 h-5 text-warning" />}
                    iconClassName="bg-warning/10"
                />
            </div>
        </div>
    );
}
