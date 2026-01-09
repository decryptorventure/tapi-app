'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Loader2,
    CheckCircle2,
    Building2,
    MapPin,
    FileText,
    Edit2,
    ChevronRight,
    Store
} from 'lucide-react';
import Link from 'next/link';

export default function OwnerReviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [profile, setProfile] = useState<any>(null);

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

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profileData);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        const supabase = createUntypedClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            console.log('Completing owner onboarding for:', user.id);
            const { error } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    can_post_jobs: true,
                    profile_completion_percentage: 100
                })
                .eq('id', user.id);

            if (error) {
                console.error('Owner onboarding completion error:', error);
                throw error;
            }

            toast.success('Hồ sơ nhà hàng đã sẵn sàng!');
            router.push('/owner/dashboard');
        } catch (error: any) {
            toast.error('Lỗi khi hoàn tất hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="max-w-2xl mx-auto py-8">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex gap-1">
                            <div className="w-8 h-2 bg-orange-600 rounded-full" />
                            <div className="w-8 h-2 bg-orange-600 rounded-full" />
                            <div className="w-8 h-2 bg-orange-600 rounded-full" />
                        </div>
                        <span className="text-sm text-slate-500">Bước 3/3</span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Xác nhận thông tin
                            </h1>
                            <p className="text-slate-600">
                                Kiểm tra lại lần cuối trước khi đăng tin tuyển dụng
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Section: Restaurant Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                                <Building2 className="w-4 h-4 text-orange-600" />
                                Thông tin nhà hàng
                            </h3>
                            <Link href="/onboarding/owner/profile">
                                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                                    <Edit2 className="w-4 h-4 mr-1" /> Sửa
                                </Button>
                            </Link>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-orange-50 rounded-xl">
                                    <Store className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">{profile?.restaurant_name}</h4>
                                    <p className="text-sm text-slate-500 capitalize">Ẩm thực: {profile?.cuisine_type === 'japanese' ? 'Nhật Bản' : 'Hàn Quốc'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span>GPKD: {profile?.business_license_number || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Location */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                                <MapPin className="w-4 h-4 text-orange-600" />
                                Địa chỉ & Vị trí
                            </h3>
                            <Link href="/onboarding/owner/location">
                                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                                    <Edit2 className="w-4 h-4 mr-1" /> Sửa
                                </Button>
                            </Link>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {profile?.restaurant_address || 'Chưa cập nhật địa chỉ'}
                                </p>
                            </div>

                            {/* Static Map View */}
                            <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video border border-slate-200">
                                <img
                                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff4400(${profile?.restaurant_lng},${profile?.restaurant_lat})/${profile?.restaurant_lng},${profile?.restaurant_lat},15/600x400?access_token=none`}
                                    alt="Restaurant Location"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800';
                                    }}
                                />
                                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/50 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tọa độ chính xác</p>
                                    <p className="text-xs font-mono text-slate-700">{profile?.restaurant_lat?.toFixed(4)}, {profile?.restaurant_lng?.toFixed(4)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-blue-800 leading-relaxed">
                                Bằng cách nhấp vào &quot;Hoàn tất&quot;, bạn xác nhận rằng mình có thẩm quyền đại diện cho nhà hàng và cam kết các thông tin cung cấp là đúng sự thật.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/onboarding/owner/location')}
                            className="flex-1"
                        >
                            Quay lại
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-lg py-6"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <span className="flex items-center">
                                    Hoàn tất & Bắt đầu <ChevronRight className="ml-2 w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
