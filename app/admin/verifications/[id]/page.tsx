'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    ArrowLeft,
    User,
    Building2,
    Loader2,
    CheckCircle2,
    XCircle,
    FileCheck,
    Eye,
    Calendar,
    Mail,
    Phone,
    Languages,
    ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ADMIN_EMAILS = ['admin@tapi.vn', 'tommy@example.com'];

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: 'worker' | 'owner';
    created_at: string;
    date_of_birth?: string;
    identity_front_url?: string;
    identity_back_url?: string;
    identity_verified: boolean;
    language_certificate_url?: string;
    language_verified: boolean;
    primary_language?: string;
    language_level?: string;
    business_license_url?: string;
    license_verified: boolean;
    restaurant_name?: string;
    restaurant_address?: string;
    avatar_url?: string;
}

function VerificationDetailContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const userId = params.id as string;
    const type = searchParams.get('type') || 'all';

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        checkAdminAccess();
    }, [userId]);

    const checkAdminAccess = async () => {
        const supabase = createUntypedClient();
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser || !ADMIN_EMAILS.includes(authUser.email || '')) {
                router.push('/');
                return;
            }
            setIsAdmin(true);
            await fetchUser();
        } catch (error) {
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchUser = async () => {
        const supabase = createUntypedClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setUser(data as UserProfile);
        }
    };

    const handleApprove = async (verificationType: 'identity' | 'language' | 'license') => {
        if (!user) return;
        setProcessing(true);

        const supabase = createUntypedClient();
        const updates: any = {};

        if (verificationType === 'identity') {
            updates.identity_verified = true;
        } else if (verificationType === 'language') {
            updates.language_verified = true;
        } else if (verificationType === 'license') {
            updates.license_verified = true;
            updates.can_post_jobs = true;
        }

        // Check if worker should be allowed to apply
        if (user.role === 'worker') {
            if (verificationType === 'identity' && user.language_verified) {
                updates.can_apply = true;
            } else if (verificationType === 'language' && user.identity_verified) {
                updates.can_apply = true;
            }
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            toast.error('Lỗi khi duyệt');
        } else {
            toast.success('Đã duyệt thành công!');
            await fetchUser();
        }
        setProcessing(false);
    };

    const handleReject = async (verificationType: 'identity' | 'language' | 'license') => {
        if (!user) return;
        setProcessing(true);

        const supabase = createUntypedClient();
        const updates: any = {};

        // Clear the document URL to require re-upload
        if (verificationType === 'identity') {
            updates.identity_front_url = null;
            updates.identity_back_url = null;
        } else if (verificationType === 'language') {
            updates.language_certificate_url = null;
        } else if (verificationType === 'license') {
            updates.business_license_url = null;
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            toast.error('Lỗi khi từ chối');
        } else {
            toast.success('Đã từ chối, yêu cầu upload lại');
            await fetchUser();
        }
        setProcessing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin || !user) return null;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-2xl">
                    <div className="flex items-center gap-4">
                        <Link href={`/admin/verifications?type=${type}`} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Chi tiết xác minh</h1>
                            <p className="text-sm text-muted-foreground">{user.full_name || user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
                {/* User Info */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center",
                            user.role === 'worker' ? "bg-primary/10" : "bg-cta/10"
                        )}>
                            {user.role === 'worker' ? (
                                <User className="w-8 h-8 text-primary" />
                            ) : (
                                <Building2 className="w-8 h-8 text-cta" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{user.full_name || 'Chưa có tên'}</h2>
                            <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{user.email}</span>
                        </div>
                        {user.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">{user.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">Đăng ký: {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })}</span>
                        </div>
                        {user.primary_language && (
                            <div className="flex items-center gap-2">
                                <Languages className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground capitalize">{user.primary_language} - {user.language_level?.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Identity Verification */}
                {user.identity_front_url && (
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileCheck className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-foreground">Xác minh danh tính</h3>
                            </div>
                            {user.identity_verified ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">
                                    Chờ duyệt
                                </span>
                            )}
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Mặt trước</p>
                                    <a href={user.identity_front_url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img src={user.identity_front_url} alt="ID Front" className="w-full h-32 object-cover rounded-lg border border-border" />
                                    </a>
                                </div>
                                {user.identity_back_url && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2">Mặt sau</p>
                                        <a href={user.identity_back_url} target="_blank" rel="noopener noreferrer" className="block">
                                            <img src={user.identity_back_url} alt="ID Back" className="w-full h-32 object-cover rounded-lg border border-border" />
                                        </a>
                                    </div>
                                )}
                            </div>
                            {!user.identity_verified && (
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={() => handleApprove('identity')}
                                        disabled={processing}
                                        className="flex-1 bg-success hover:bg-success/90"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Duyệt
                                    </Button>
                                    <Button
                                        onClick={() => handleReject('identity')}
                                        disabled={processing}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Từ chối
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Language Certificate */}
                {user.language_certificate_url && (
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Languages className="w-5 h-5 text-success" />
                                <h3 className="font-semibold text-foreground">Chứng chỉ ngôn ngữ</h3>
                            </div>
                            {user.language_verified ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">
                                    Chờ duyệt
                                </span>
                            )}
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {user.primary_language?.toUpperCase()} - {user.language_level?.toUpperCase()}
                                </p>
                                <a href={user.language_certificate_url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img src={user.language_certificate_url} alt="Certificate" className="w-full h-48 object-cover rounded-lg border border-border" />
                                </a>
                            </div>
                            {!user.language_verified && (
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={() => handleApprove('language')}
                                        disabled={processing}
                                        className="flex-1 bg-success hover:bg-success/90"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Duyệt
                                    </Button>
                                    <Button
                                        onClick={() => handleReject('language')}
                                        disabled={processing}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Từ chối
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Business License */}
                {user.business_license_url && (
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-cta" />
                                <h3 className="font-semibold text-foreground">Giấy phép kinh doanh</h3>
                            </div>
                            {user.license_verified ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">
                                    Chờ duyệt
                                </span>
                            )}
                        </div>
                        <div className="p-4 space-y-4">
                            {user.restaurant_name && (
                                <p className="text-sm text-foreground font-medium">{user.restaurant_name}</p>
                            )}
                            <a href={user.business_license_url} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={user.business_license_url} alt="License" className="w-full h-48 object-cover rounded-lg border border-border" />
                            </a>
                            {!user.license_verified && (
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={() => handleApprove('license')}
                                        disabled={processing}
                                        className="flex-1 bg-success hover:bg-success/90"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Duyệt
                                    </Button>
                                    <Button
                                        onClick={() => handleReject('license')}
                                        disabled={processing}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Từ chối
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminVerificationDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <VerificationDetailContent />
        </Suspense>
    );
}
