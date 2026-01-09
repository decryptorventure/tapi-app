'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, MapPin, Navigation, Search, CheckCircle2 } from 'lucide-react';

export default function OwnerLocationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState({ lat: 10.762622, lng: 106.660172 }); // Default TP.HCM
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createUntypedClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(data);
            if (data?.restaurant_address) {
                setAddress(data.restaurant_address);
            }
            if (data?.restaurant_lat && data?.restaurant_lng) {
                setCoordinates({ lat: data.restaurant_lat, lng: data.restaurant_lng });
            }
            setCheckingAuth(false);
        };
        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) {
            toast.error('Vui lòng nhập địa chỉ');
            return;
        }

        setLoading(true);
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    restaurant_address: address,
                    restaurant_lat: coordinates.lat,
                    restaurant_lng: coordinates.lng,
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            toast.success('Đã lưu vị trí nhà hàng!');
            router.push('/onboarding/owner/review'); // Go to Step 3: Review
        } catch (error: any) {
            console.error('Location update error:', error);
            toast.error(error.message || 'Lỗi cập nhật vị trí');
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
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
                            <div className="w-8 h-2 bg-slate-200 rounded-full" />
                        </div>
                        <span className="text-sm text-slate-500">Bước 2/3</span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <MapPin className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Vị trí nhà hàng
                            </h1>
                            <p className="text-slate-600">
                                Xác định vị trí chính xác để ứng viên dễ dàng tìm đến
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    {/* Mock Map View */}
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video border-2 border-slate-200 flex items-center justify-center group cursor-pointer hover:border-orange-300 transition-all">
                        <img
                            src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff4400(${coordinates.lng},${coordinates.lat})/${coordinates.lng},${coordinates.lat},15/600x400?access_token=none`}
                            alt="Map Placeholder"
                            className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800';
                            }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm">
                            <MapPin className="w-12 h-12 text-orange-600 animate-bounce mb-2" />
                            <p className="text-sm font-bold text-slate-700 bg-white/80 px-4 py-2 rounded-full shadow-sm">
                                Đang sử dụng bản đồ mô phỏng
                            </p>
                            <p className="text-xs text-slate-500 mt-2">Vui lòng nhập địa chỉ bên dưới để xác nhận</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Địa chỉ chi tiết <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                    placeholder="Nhập số nhà, tên đường, quận/huyện..."
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <Navigation className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Vị trí hiện tại</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Tọa độ: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                                    <br />
                                    Nhân viên sẽ sử dụng vị trí này để định vị nơi làm việc và check-in.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/onboarding/owner/profile')}
                                className="flex-1"
                            >
                                Quay lại
                            </Button>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-lg py-6"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    'Hoàn tất & Tiếp tục'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
