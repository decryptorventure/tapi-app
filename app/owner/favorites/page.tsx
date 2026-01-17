'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft,
    Heart,
    Star,
    Users,
    Loader2,
    Search,
    Trash2,
    MessageSquare,
    Calendar,
    RefreshCw
} from 'lucide-react';

interface FavoriteWorker {
    id: string;
    worker_id: string;
    notes: string | null;
    created_at: string;
    worker: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        reliability_score: number;
        bio: string | null;
    };
}

export default function FavoriteWorkersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [favorites, setFavorites] = useState<FavoriteWorker[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        const supabase = createUntypedClient();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('favorite_workers')
                .select(`
                    id,
                    worker_id,
                    notes,
                    created_at,
                    worker:profiles!worker_id (
                        id,
                        full_name,
                        avatar_url,
                        reliability_score,
                        bio
                    )
                `)
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFavorites((data || []) as any);
        } catch (error) {
            console.error('Fetch favorites error:', error);
            toast.error('Lỗi tải danh sách');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchFavorites();
        toast.success('Đã cập nhật');
    };

    const handleRemoveFavorite = async (id: string) => {
        const supabase = createUntypedClient();
        try {
            const { error } = await supabase
                .from('favorite_workers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Đã xóa khỏi danh sách yêu thích');
            setFavorites(favorites.filter(f => f.id !== id));
        } catch (error) {
            toast.error('Lỗi xóa worker');
        }
    };

    const filteredFavorites = favorites.filter(f =>
        f.worker?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <div className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/80">
                <div className="container mx-auto px-4 py-4 max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/owner/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 rounded-lg">
                                    <Heart className="w-5 h-5 text-rose-500" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-foreground">Workers yêu thích</h1>
                                    <p className="text-xs text-muted-foreground">{favorites.length} workers</p>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="h-9 w-9"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm worker..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                    />
                </div>

                {/* Favorites List */}
                {filteredFavorites.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-rose-50 rounded-2xl flex items-center justify-center">
                            <Heart className="w-8 h-8 text-rose-300" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            {searchTerm ? 'Không tìm thấy worker' : 'Chưa có worker yêu thích'}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Nhấn vào nút ❤️ khi xem hồ sơ worker để thêm vào danh sách'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredFavorites.map((favorite) => (
                            <div
                                key={favorite.id}
                                className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    {favorite.worker?.avatar_url ? (
                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                                            <Image
                                                src={favorite.worker.avatar_url}
                                                alt={favorite.worker.full_name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                                            {favorite.worker?.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-foreground truncate">
                                                {favorite.worker?.full_name || 'Worker'}
                                            </h4>
                                            <div className="flex items-center gap-1 text-warning">
                                                <Star className="w-4 h-4 fill-warning" />
                                                <span className="text-sm font-semibold">
                                                    {favorite.worker?.reliability_score || 100}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                            {favorite.worker?.bio || 'Chưa có giới thiệu'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/p/${favorite.worker_id}`}>
                                                <Button variant="outline" size="sm">
                                                    Xem hồ sơ
                                                </Button>
                                            </Link>
                                            <button
                                                onClick={() => handleRemoveFavorite(favorite.id)}
                                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                title="Xóa khỏi yêu thích"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
