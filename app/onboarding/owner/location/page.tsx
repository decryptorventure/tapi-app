'use client';
import { useTranslation } from '@/lib/i18n';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, MapPin, Navigation, Search, CheckCircle2 } from 'lucide-react';

export default function OwnerLocationPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState({ lat: 10.762622, lng: 106.660172 }); // Default TP.HCM
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
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
        const supabase = createClient();

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
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
                        <Navigation className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-orange-900">{t('onboarding.owner_locationInfo')}</h4>
                            <p className="text-xs text-orange-700 leading-relaxed">
                                Vui lòng nhập địa chỉ chính xác của nhà hàng. Thông tin này sẽ giúp nhân viên tìm thấy bạn dễ dàng hơn.
                            </p>
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
                                    placeholder={t('onboarding.owner_addressPlaceholder')}
                                />
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
                                    t('onboarding.owner_finishAndContinue')
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
