'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createUntypedClient } from '@/lib/supabase/client';
import { adminService, UserDetail } from '@/lib/services/admin.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    Building2,
    Calendar,
    MapPin,
    Shield,
    Lock,
    Unlock,
    Trash2,
    Save,
    Loader2,
    CheckCircle2,
    XCircle,
    KeyRound,
    AlertTriangle,
    Star,
    Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserDetail | null>(null);
    const [editedUser, setEditedUser] = useState<Partial<UserDetail>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({
        totalApplications: 0,
        completedJobs: 0,
        totalEarnings: 0,
    });

    useEffect(() => {
        if (userId) {
            fetchUser();
            fetchUserStats();
        }
    }, [userId]);

    const fetchUser = async () => {
        try {
            const data = await adminService.getUserById(userId);
            if (!data) {
                toast.error('Không tìm thấy người dùng');
                router.push('/admin/users');
                return;
            }
            setUser(data);
            setEditedUser(data);
        } catch (error) {
            console.error('Error fetching user:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        const supabase = createUntypedClient();

        // Applications count
        const { count: totalApplications } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('worker_id', userId);

        // Completed jobs
        const { count: completedJobs } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('worker_id', userId)
            .eq('status', 'completed');

        // Earnings
        const { data: earnings } = await supabase
            .from('wallet_transactions')
            .select('amount_vnd')
            .eq('user_id', userId)
            .eq('transaction_type', 'earning');

        setStats({
            totalApplications: totalApplications || 0,
            completedJobs: completedJobs || 0,
            totalEarnings: earnings?.reduce((sum, e) => sum + (e.amount_vnd || 0), 0) || 0,
        });
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const updated = await adminService.updateUser(userId, editedUser);
            setUser(updated);
            setIsEditing(false);
            toast.success('Đã cập nhật thông tin');
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleLock = async () => {
        if (!user) return;
        setActionLoading('lock');
        try {
            await adminService.toggleAccountLock(userId, !user.is_account_frozen, 7);
            toast.success(user.is_account_frozen ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản 7 ngày');
            fetchUser();
        } catch (error) {
            console.error('Error toggling lock:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
        setActionLoading('delete');
        try {
            const supabase = createUntypedClient();
            const { data: { user: admin } } = await supabase.auth.getUser();
            if (admin) {
                await adminService.deleteUser(userId, admin.id);
                toast.success('Đã xóa người dùng');
                router.push('/admin/users');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) {
            toast.error('Người dùng không có email');
            return;
        }
        if (!confirm(`Gửi email reset password tới ${user.email}?`)) return;

        setActionLoading('reset');
        try {
            const supabase = createUntypedClient();
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            toast.success('Đã gửi email reset password');
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Quay lại
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Chi tiết người dùng</h1>
                        <p className="text-sm text-muted-foreground">ID: {userId.slice(0, 8)}...</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Lưu
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            Chỉnh sửa
                        </Button>
                    )}
                </div>
            </div>

            {/* Account Status Alert */}
            {user.is_account_frozen && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-destructive">Tài khoản đang bị khóa</p>
                        {user.frozen_until && (
                            <p className="text-sm text-destructive/80">
                                Mở khóa lúc: {format(new Date(user.frozen_until), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Cover section */}
                <div className="h-24 bg-gradient-to-r from-primary/20 to-cta/20" />

                <div className="px-6 pb-6">
                    {/* Avatar and main info */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 -mt-10">
                        <div className="w-20 h-20 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>

                        <div className="flex-1 pt-2">
                            <div className="flex items-center gap-3 mb-1">
                                {isEditing ? (
                                    <Input
                                        value={editedUser.full_name || ''}
                                        onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                                        className="text-xl font-bold max-w-xs"
                                    />
                                ) : (
                                    <h2 className="text-xl font-bold text-foreground">{user.full_name}</h2>
                                )}
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    user.role === 'worker' ? "bg-primary/10 text-primary" : "bg-cta/10 text-cta"
                                )}>
                                    {user.role === 'worker' ? 'Worker' : 'Owner'}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {user.phone_number}
                                </span>
                                {user.email && (
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {user.email}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Tham gia {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards (for Workers) */}
            {user.role === 'worker' && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card rounded-lg border border-border p-4 text-center">
                        <Briefcase className="w-5 h-5 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">{stats.totalApplications}</p>
                        <p className="text-xs text-muted-foreground">Đơn ứng tuyển</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4 text-center">
                        <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">{stats.completedJobs}</p>
                        <p className="text-xs text-muted-foreground">Hoàn thành</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4 text-center">
                        <Star className="w-5 h-5 text-warning mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">{user.reliability_score}</p>
                        <p className="text-xs text-muted-foreground">Điểm tin cậy</p>
                    </div>
                </div>
            )}

            {/* Verification Status */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Trạng thái xác minh</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                        {user.identity_verified ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                            <p className="font-medium text-foreground">Danh tính</p>
                            <p className="text-xs text-muted-foreground">
                                {user.identity_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user.language_verified ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                            <p className="font-medium text-foreground">Ngôn ngữ</p>
                            <p className="text-xs text-muted-foreground">
                                {user.language_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                            </p>
                        </div>
                    </div>

                    {user.role === 'owner' && (
                        <div className="flex items-center gap-3">
                            {user.license_verified ? (
                                <CheckCircle2 className="w-5 h-5 text-success" />
                            ) : (
                                <XCircle className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                                <p className="font-medium text-foreground">Giấy phép</p>
                                <p className="text-xs text-muted-foreground">
                                    {user.license_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Info */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Thông tin thêm</h3>
                <div className="space-y-4">
                    {user.role === 'worker' && (
                        <>
                            <div>
                                <label className="text-sm text-muted-foreground">Trường học</label>
                                {isEditing ? (
                                    <Input
                                        value={editedUser.university_name || ''}
                                        onChange={(e) => setEditedUser({ ...editedUser, university_name: e.target.value })}
                                        placeholder="Nhập tên trường"
                                    />
                                ) : (
                                    <p className="font-medium text-foreground">{user.university_name || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Ngày sinh</label>
                                <p className="font-medium text-foreground">
                                    {user.date_of_birth ? format(new Date(user.date_of_birth), 'dd/MM/yyyy', { locale: vi }) : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Bio</label>
                                {isEditing ? (
                                    <textarea
                                        value={editedUser.bio || ''}
                                        onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                                        className="w-full border rounded-lg p-2 text-sm"
                                        rows={3}
                                    />
                                ) : (
                                    <p className="font-medium text-foreground">{user.bio || '-'}</p>
                                )}
                            </div>
                        </>
                    )}

                    {user.role === 'owner' && (
                        <>
                            <div>
                                <label className="text-sm text-muted-foreground">Tên nhà hàng</label>
                                {isEditing ? (
                                    <Input
                                        value={editedUser.restaurant_name || ''}
                                        onChange={(e) => setEditedUser({ ...editedUser, restaurant_name: e.target.value })}
                                    />
                                ) : (
                                    <p className="font-medium text-foreground">{user.restaurant_name || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Địa chỉ</label>
                                {isEditing ? (
                                    <Input
                                        value={editedUser.restaurant_address || ''}
                                        onChange={(e) => setEditedUser({ ...editedUser, restaurant_address: e.target.value })}
                                    />
                                ) : (
                                    <p className="font-medium text-foreground">{user.restaurant_address || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Loại ẩm thực</label>
                                <p className="font-medium text-foreground capitalize">{user.cuisine_type || '-'}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Hành động</h3>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={handleToggleLock}
                        disabled={actionLoading === 'lock'}
                    >
                        {actionLoading === 'lock' ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : user.is_account_frozen ? (
                            <Unlock className="w-4 h-4 mr-2 text-success" />
                        ) : (
                            <Lock className="w-4 h-4 mr-2 text-warning" />
                        )}
                        {user.is_account_frozen ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleResetPassword}
                        disabled={actionLoading === 'reset' || !user.email}
                    >
                        {actionLoading === 'reset' ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <KeyRound className="w-4 h-4 mr-2" />
                        )}
                        Reset mật khẩu
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={actionLoading === 'delete'}
                    >
                        {actionLoading === 'delete' ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Xóa người dùng
                    </Button>
                </div>
            </div>
        </div>
    );
}
