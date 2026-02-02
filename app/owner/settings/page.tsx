'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    Building2,
    Camera,
    Upload,
    X,
    Loader2,
    Save,
    MapPin,
    Phone,
    Mail,
    ImageIcon,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { MapPicker } from '@/components/map/map-picker';

interface OwnerProfile {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    restaurant_name: string;
    restaurant_address: string;
    restaurant_logo_url: string | null;
    restaurant_cover_urls: string[];
    cuisine_type: string;
}

export default function OwnerSettingsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<OwnerProfile | null>(null);
    const [formData, setFormData] = useState({
        restaurant_name: '',
        restaurant_address: '',
        cuisine_type: '',
        restaurant_lat: null as number | null,
        restaurant_lng: null as number | null
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const supabase = createUntypedClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setProfile(data);
            setFormData({
                restaurant_name: data.restaurant_name || '',
                restaurant_address: data.restaurant_address || '',
                cuisine_type: data.cuisine_type || '',
                restaurant_lat: data.restaurant_lat,
                restaurant_lng: data.restaurant_lng
            });
        } catch (error) {
            toast.error('Lỗi khi tải thông tin');
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file: File, path: string): Promise<string | null> => {
        const supabase = createUntypedClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${path}/${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
            .from('restaurants')
            .upload(fileName, file);

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('restaurants')
            .getPublicUrl(fileName);

        return publicUrl;
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, `logos/${profile.id}`);
            if (url) {
                const supabase = createUntypedClient();
                await supabase
                    .from('profiles')
                    .update({ restaurant_logo_url: url })
                    .eq('id', profile.id);

                setProfile({ ...profile, restaurant_logo_url: url });
                toast.success('Đã cập nhật logo');
            }
        } catch (error) {
            toast.error('Lỗi khi upload logo');
        } finally {
            setUploading(false);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !profile) return;

        const currentCovers = profile.restaurant_cover_urls || [];
        if (currentCovers.length + files.length > 5) {
            toast.error('Tối đa 5 ảnh bìa');
            return;
        }

        setUploading(true);
        try {
            const newUrls: string[] = [];
            for (const file of Array.from(files)) {
                const url = await uploadImage(file, `covers/${profile.id}`);
                if (url) newUrls.push(url);
            }

            const updatedCovers = [...currentCovers, ...newUrls];
            const supabase = createUntypedClient();
            await supabase
                .from('profiles')
                .update({ restaurant_cover_urls: updatedCovers })
                .eq('id', profile.id);

            setProfile({ ...profile, restaurant_cover_urls: updatedCovers });
            toast.success('Đã thêm ảnh bìa');
        } catch (error) {
            toast.error('Lỗi khi upload ảnh');
        } finally {
            setUploading(false);
        }
    };

    const removeCover = async (index: number) => {
        if (!profile) return;
        const updatedCovers = profile.restaurant_cover_urls.filter((_, i) => i !== index);

        const supabase = createUntypedClient();
        await supabase
            .from('profiles')
            .update({ restaurant_cover_urls: updatedCovers })
            .eq('id', profile.id);

        setProfile({ ...profile, restaurant_cover_urls: updatedCovers });
        toast.success('Đã xóa ảnh');
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);

        const supabase = createUntypedClient();
        const { error } = await supabase
            .from('profiles')
            .update(formData)
            .eq('id', profile.id);

        if (error) {
            toast.error('Lỗi khi lưu');
        } else {
            toast.success('Đã lưu thông tin');
        }
        setSaving(false);
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
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-4">
                    <Link href="/owner/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <h1 className="text-lg font-bold text-foreground">Cài đặt nhà hàng</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
                {/* Logo Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Logo nhà hàng
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                                {profile?.restaurant_logo_url ? (
                                    <img
                                        src={profile.restaurant_logo_url}
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Camera className="w-8 h-8 text-muted-foreground" />
                                )}
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Tải lên logo
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">PNG, JPG (max 2MB)</p>
                        </div>
                    </div>
                </div>

                {/* View Landing Page */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-foreground">Trang tuyển dụng</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Chia sẻ link này để thu hút nhân viên
                            </p>
                        </div>
                        <Link href={`/r/${profile?.id}`} target="_blank">
                            <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Xem trang
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Cover Photos Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-foreground flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-cta" />
                            Ảnh bìa nhà hàng
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            {profile?.restaurant_cover_urls?.length || 0}/5 ảnh
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {profile?.restaurant_cover_urls?.map((url, index) => (
                            <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                                <img src={url} alt={`Cover ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeCover(index)}
                                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ))}

                        {(profile?.restaurant_cover_urls?.length || 0) < 5 && (
                            <button
                                onClick={() => coverInputRef.current?.click()}
                                disabled={uploading}
                                className="aspect-video rounded-lg border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors"
                            >
                                <Upload className="w-5 h-5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Thêm ảnh</span>
                            </button>
                        )}
                    </div>
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleCoverUpload}
                        className="hidden"
                    />
                </div>

                {/* Restaurant Info Form */}
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <h2 className="font-bold text-foreground mb-4">Thông tin nhà hàng</h2>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-2">Tên nhà hàng</label>
                        <input
                            type="text"
                            value={formData.restaurant_name}
                            onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                            placeholder="Nhập tên nhà hàng"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-2">Địa chỉ</label>
                        <textarea
                            value={formData.restaurant_address}
                            onChange={(e) => setFormData({ ...formData, restaurant_address: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground resize-none"
                            placeholder="Nhập địa chỉ"
                        />
                    </div>

                    {/* Map Picker */}
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-2">Vị trí trên bản đồ (Để nhân viên tìm đường)</label>
                        <MapPicker
                            value={formData.restaurant_lat && formData.restaurant_lng ? {
                                lat: formData.restaurant_lat,
                                lng: formData.restaurant_lng,
                                address: formData.restaurant_address
                            } : undefined}
                            onChange={(location) => {
                                setFormData(prev => ({
                                    ...prev,
                                    restaurant_lat: location.lat,
                                    restaurant_lng: location.lng,
                                    restaurant_address: location.address || prev.restaurant_address
                                }));
                            }}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-2">Loại ẩm thực</label>
                        <select
                            value={formData.cuisine_type}
                            onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                        >
                            <option value="">Chọn loại</option>
                            <option value="japanese">Nhật Bản</option>
                            <option value="korean">Hàn Quốc</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
                <div className="max-w-2xl mx-auto">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 rounded-xl"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </div>
        </div>
    );
}
