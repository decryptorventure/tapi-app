'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    Shield,
    Users,
    Building2,
    FileCheck,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Admin emails - replace with proper role-based auth later
const ADMIN_EMAILS = ['admin@tapi.vn', 'tommy@example.com'];

interface VerificationStats {
    pendingWorkers: number;
    pendingOwners: number;
    pendingIdentity: number;
    pendingLanguage: number;
    pendingLicense: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [stats, setStats] = useState<VerificationStats>({
        pendingWorkers: 0,
        pendingOwners: 0,
        pendingIdentity: 0,
        pendingLanguage: 0,
        pendingLicense: 0
    });

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        const supabase = createUntypedClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Check if user is admin
            if (!ADMIN_EMAILS.includes(user.email || '')) {
                router.push('/');
                return;
            }

            setIsAdmin(true);
            await fetchStats();
        } catch (error) {
            console.error('Admin check error:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const supabase = createUntypedClient();

        // Count pending worker verifications
        const { count: pendingWorkers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'worker')
            .eq('can_apply', false);

        // Count pending owner verifications
        const { count: pendingOwners } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'owner')
            .eq('can_post_jobs', false);

        // Count pending identity verifications
        const { count: pendingIdentity } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('identity_verified', false)
            .not('identity_front_url', 'is', null);

        // Count pending language certificates
        const { count: pendingLanguage } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('language_verified', false)
            .not('language_certificate_url', 'is', null);

        // Count pending business licenses
        const { count: pendingLicense } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('license_verified', false)
            .not('business_license_url', 'is', null);

        setStats({
            pendingWorkers: pendingWorkers || 0,
            pendingOwners: pendingOwners || 0,
            pendingIdentity: pendingIdentity || 0,
            pendingLanguage: pendingLanguage || 0,
            pendingLicense: pendingLicense || 0
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const totalPending = stats.pendingIdentity + stats.pendingLanguage + stats.pendingLicense;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border">
                <div className="container mx-auto px-4 py-6 max-w-4xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                            <p className="text-sm text-muted-foreground">Quản lý xác minh người dùng</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-xs text-muted-foreground font-medium">Workers</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.pendingWorkers}</p>
                        <p className="text-xs text-muted-foreground">chờ duyệt</p>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-cta" />
                            <span className="text-xs text-muted-foreground font-medium">Owners</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.pendingOwners}</p>
                        <p className="text-xs text-muted-foreground">chờ duyệt</p>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileCheck className="w-4 h-4 text-success" />
                            <span className="text-xs text-muted-foreground font-medium">Giấy tờ</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{totalPending}</p>
                        <p className="text-xs text-muted-foreground">chờ duyệt</p>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-warning" />
                            <span className="text-xs text-muted-foreground font-medium">Tổng</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{totalPending + stats.pendingWorkers + stats.pendingOwners}</p>
                        <p className="text-xs text-muted-foreground">cần xử lý</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h2 className="font-bold text-foreground">Xác minh giấy tờ</h2>

                    <div className="space-y-3">
                        <Link href="/admin/verifications?type=identity">
                            <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <FileCheck className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">Xác minh danh tính</h3>
                                        <p className="text-sm text-muted-foreground">CMND/CCCD của worker</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {stats.pendingIdentity > 0 && (
                                        <span className="px-2 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                                            {stats.pendingIdentity} chờ
                                        </span>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/admin/verifications?type=language">
                            <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-success/10 rounded-lg">
                                        <FileCheck className="w-5 h-5 text-success" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">Chứng chỉ ngôn ngữ</h3>
                                        <p className="text-sm text-muted-foreground">JLPT, TOPIK, IELTS...</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {stats.pendingLanguage > 0 && (
                                        <span className="px-2 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                                            {stats.pendingLanguage} chờ
                                        </span>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/admin/verifications?type=license">
                            <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-cta/10 rounded-lg">
                                        <Building2 className="w-5 h-5 text-cta" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">Giấy phép kinh doanh</h3>
                                        <p className="text-sm text-muted-foreground">Của owner/nhà hàng</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {stats.pendingLicense > 0 && (
                                        <span className="px-2 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                                            {stats.pendingLicense} chờ
                                        </span>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Warning */}
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-warning">Lưu ý bảo mật</h4>
                        <p className="text-sm text-warning/80">
                            Chỉ admin được phép truy cập trang này. Mọi hành động sẽ được ghi log.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
