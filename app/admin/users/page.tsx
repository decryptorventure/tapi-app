'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUntypedClient } from '@/lib/supabase/client';
import { adminService, UserListItem, ADMIN_EMAILS } from '@/lib/services/admin.service';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import {
    Users,
    Building2,
    Eye,
    Lock,
    Unlock,
    Trash2,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type TabType = 'all' | 'workers' | 'owners';

export default function UsersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const pageSize = 20;

    useEffect(() => {
        fetchUsers();
    }, [activeTab, page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const roleFilter = activeTab === 'all' ? undefined : activeTab === 'workers' ? 'worker' : 'owner';
            const result = await adminService.getUsers({
                role: roleFilter,
                page,
                limit: pageSize,
            });
            setUsers(result.data);
            setTotalItems(result.total);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLock = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId);
        try {
            await adminService.toggleAccountLock(userId, !currentStatus, 7);
            toast.success(currentStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
            fetchUsers();
        } catch (error) {
            console.error('Error toggling lock:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Bạn có chắc muốn xóa người dùng này? Hành động này có thể hoàn tác.')) {
            return;
        }

        setActionLoading(userId);
        try {
            const supabase = createUntypedClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await adminService.deleteUser(userId, user.id);
                toast.success('Đã xóa người dùng');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setActionLoading(null);
        }
    };

    const columns: ColumnDef<UserListItem>[] = [
        {
            accessorKey: 'full_name',
            header: 'Người dùng',
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-sm font-medium text-muted-foreground">
                                    {user.full_name?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email || user.phone_number}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'role',
            header: 'Loại',
            cell: ({ row }) => {
                const role = row.original.role;
                return (
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                        role === 'worker'
                            ? "bg-primary/10 text-primary"
                            : "bg-cta/10 text-cta"
                    )}>
                        {role === 'worker' ? <Users className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {role === 'worker' ? 'Worker' : 'Owner'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'is_verified',
            header: 'Trạng thái',
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="flex flex-col gap-1">
                        <span className={cn(
                            "inline-flex items-center gap-1 text-xs",
                            user.is_verified ? "text-success" : "text-warning"
                        )}>
                            {user.is_verified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {user.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </span>
                        {user.is_account_frozen && (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive">
                                <Lock className="w-3 h-3" />
                                Đã khóa
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'reliability_score',
            header: 'Điểm tin cậy',
            cell: ({ row }) => {
                const score = row.original.reliability_score;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full",
                                    score >= 90 ? "bg-success" : score >= 70 ? "bg-warning" : "bg-destructive"
                                )}
                                style={{ width: `${score}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium">{score}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Ngày tạo',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(row.original.created_at), 'dd/MM/yyyy', { locale: vi })}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const user = row.original;
                const isLoading = actionLoading === user.id;

                return (
                    <div className="flex items-center gap-1 justify-end">
                        <Link href={`/admin/users/${user.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleToggleLock(user.id, user.is_account_frozen)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.is_account_frozen ? (
                                <Unlock className="w-4 h-4 text-success" />
                            ) : (
                                <Lock className="w-4 h-4 text-warning" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(user.id)}
                            disabled={isLoading}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
        { key: 'all', label: 'Tất cả', icon: <Users className="w-4 h-4" /> },
        { key: 'workers', label: 'Workers', icon: <Users className="w-4 h-4" /> },
        { key: 'owners', label: 'Owners', icon: <Building2 className="w-4 h-4" /> },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
                <p className="text-sm text-muted-foreground">Xem, chỉnh sửa và quản lý tài khoản người dùng</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            setPage(1);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors",
                            activeTab === tab.key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                searchPlaceholder="Tìm theo tên, email, SĐT..."
                serverSidePagination
                pageSize={pageSize}
                currentPage={page}
                totalItems={totalItems}
                onPageChange={setPage}
                emptyMessage="Không tìm thấy người dùng nào"
            />
        </div>
    );
}
