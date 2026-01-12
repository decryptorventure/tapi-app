'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    ArrowLeft,
    Shield,
    FileCheck,
    User,
    Building2,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ADMIN_EMAILS = ['admin@tapi.vn', 'tommy@example.com'];

type VerificationType = 'identity' | 'language' | 'license' | 'all';

interface PendingUser {
    id: string;
    full_name: string;
    email: string;
    role: 'worker' | 'owner';
    created_at: string;
    identity_front_url?: string;
    identity_back_url?: string;
    identity_verified?: boolean;
    language_certificate_url?: string;
    language_verified?: boolean;
    language_level?: string;
    primary_language?: string;
    business_license_url?: string;
    license_verified?: boolean;
    restaurant_name?: string;
}

function VerificationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = (searchParams.get('type') as VerificationType) || 'all';

    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState<PendingUser[]>([]);

    useEffect(() => {
        checkAdminAccess();
    }, [type]);

    const checkAdminAccess = async () => {
        const supabase = createUntypedClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
                router.push('/');
                return;
            }
            setIsAdmin(true);
            await fetchUsers();
        } catch (error) {
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        const supabase = createUntypedClient();
        let query = supabase.from('profiles').select('*');

        if (type === 'identity') {
            query = query.eq('identity_verified', false).not('identity_front_url', 'is', null);
        } else if (type === 'language') {
            query = query.eq('language_verified', false).not('language_certificate_url', 'is', null);
        } else if (type === 'license') {
            query = query.eq('license_verified', false).not('business_license_url', 'is', null);
        } else {
            // All pending verifications
            query = query.or('identity_verified.eq.false,language_verified.eq.false,license_verified.eq.false');
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) {
            setUsers(data as PendingUser[]);
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case 'identity': return 'Xác minh danh tính';
            case 'language': return 'Chứng chỉ ngôn ngữ';
            case 'license': return 'Giấy phép kinh doanh';
            default: return 'Tất cả xác minh';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-4xl">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">{getTypeLabel()}</h1>
                            <p className="text-sm text-muted-foreground">{users.length} yêu cầu chờ duyệt</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-card border-b border-border">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex gap-1 overflow-x-auto py-2">
                        {[
                            { key: 'all', label: 'Tất cả' },
                            { key: 'identity', label: 'Danh tính' },
                            { key: 'language', label: 'Ngôn ngữ' },
                            { key: 'license', label: 'Giấy phép' }
                        ].map(tab => (
                            <Link
                                key={tab.key}
                                href={`/admin/verifications?type=${tab.key}`}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                                    type === tab.key
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* User List */}
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {users.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-4" />
                        <h3 className="font-bold text-foreground mb-2">Không có yêu cầu chờ duyệt</h3>
                        <p className="text-muted-foreground text-sm">Tất cả đã được xử lý!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {users.map(user => (
                            <Link key={user.id} href={`/admin/verifications/${user.id}?type=${type}`}>
                                <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            user.role === 'worker' ? "bg-primary/10" : "bg-cta/10"
                                        )}>
                                            {user.role === 'worker' ? (
                                                <User className="w-5 h-5 text-primary" />
                                            ) : (
                                                <Building2 className="w-5 h-5 text-cta" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">
                                                {user.full_name || user.email}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="capitalize">{user.role}</span>
                                                <span>•</span>
                                                <span>{format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Show pending badges */}
                                        {(type === 'all' || type === 'identity') && user.identity_front_url && !user.identity_verified && (
                                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-medium">ID</span>
                                        )}
                                        {(type === 'all' || type === 'language') && user.language_certificate_url && !user.language_verified && (
                                            <span className="px-2 py-1 bg-success/10 text-success rounded text-[10px] font-medium">Lang</span>
                                        )}
                                        {(type === 'all' || type === 'license') && user.business_license_url && !user.license_verified && (
                                            <span className="px-2 py-1 bg-cta/10 text-cta rounded text-[10px] font-medium">Biz</span>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminVerificationsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <VerificationsContent />
        </Suspense>
    );
}
