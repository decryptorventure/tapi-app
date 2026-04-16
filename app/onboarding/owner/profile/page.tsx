'use client';
import { useTranslation } from '@/lib/i18n';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import { Loader2, Building2, MapPin, FileText } from 'lucide-react';

export default function OwnerProfilePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        restaurantName: '',
        cuisineType: '',
        restaurantAddress: '',
        businessLicenseNumber: '',
        phone: '',
        email: '',
    });

    const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
    const [existingLicenseUrl, setExistingLicenseUrl] = useState<string | null>(null);

    // Fetch existing data if any
    useEffect(() => {
        const fetchInitialData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch profile data
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('phone_number, email, restaurant_name, cuisine_type, restaurant_address, business_license_number, restaurant_logo_url, restaurant_cover_urls')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setFormData({
                        restaurantName: profile.restaurant_name || '',
                        cuisineType: profile.cuisine_type || '',
                        restaurantAddress: profile.restaurant_address || '',
                        businessLicenseNumber: profile.business_license_number || '',
                        phone: profile.phone_number || '',
                        email: profile.email || '',
                    });
                    setExistingLogoUrl(profile.restaurant_logo_url || null);
                    if (profile.restaurant_cover_urls && Array.isArray(profile.restaurant_cover_urls) && profile.restaurant_cover_urls.length > 0) {
                        setExistingCoverUrl(profile.restaurant_cover_urls[0]);
                    }
                }

                // Fetch license verification if exists
                const { data: verification } = await supabase
                    .from('business_verifications')
                    .select('license_url')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (verification) {
                    setExistingLicenseUrl(verification.license_url);
                }
            }
        };
        fetchInitialData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Upload restaurant logo
            let logoUrl = null;
            if (logoFile) {
                const ext = logoFile.name.split('.').pop();
                const logoPath = `${user.id}/logo-${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('restaurants')
                    .upload(logoPath, logoFile);

                if (!uploadError) {
                    const { data } = supabase.storage
                        .from('restaurants')
                        .getPublicUrl(logoPath);
                    logoUrl = data.publicUrl;
                }
            }

            // Upload restaurant cover
            let coverUrl = null;
            if (coverFile) {
                const ext = coverFile.name.split('.').pop();
                const coverPath = `${user.id}/cover-${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('restaurants')
                    .upload(coverPath, coverFile);

                if (!uploadError) {
                    const { data } = supabase.storage
                        .from('restaurants')
                        .getPublicUrl(coverPath);
                    coverUrl = data.publicUrl;
                }
            }

            // Upload business license if provided
            let licenseUrl = null;
            if (licenseFile) {
                const licensePath = `verifications/${user.id}/business-license-${Date.now()}.${licenseFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage
                    .from('verifications')
                    .upload(licensePath, licenseFile);

                if (!uploadError) {
                    const { data } = supabase.storage
                        .from('verifications')
                        .getPublicUrl(licensePath);
                    licenseUrl = data.publicUrl;
                } else {
                    console.error('License upload error:', uploadError);
                }
            }

            // Update profile with restaurant info
            const updateData: any = {
                restaurant_name: formData.restaurantName,
                cuisine_type: formData.cuisineType,
                restaurant_address: formData.restaurantAddress,
                business_license_number: formData.businessLicenseNumber,
                phone_number: formData.phone,
                email: formData.email,
            };

            if (logoUrl) updateData.restaurant_logo_url = logoUrl;
            if (coverUrl) updateData.restaurant_cover_urls = [coverUrl];

            const { error: profileError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Create business verification record if license uploaded
            if (licenseUrl && formData.businessLicenseNumber) {
                const { error: verificationError } = await supabase
                    .from('business_verifications')
                    .insert({
                        owner_id: user.id,
                        license_url: licenseUrl,
                        license_number: formData.businessLicenseNumber,
                        status: 'pending',
                    } as any);

                if (verificationError) {
                    console.error('Verification record error:', verificationError);
                    // Don't throw - profile still updated
                }
            }

            toast.success('Thông tin nhà hàng đã được lưu!');
            router.push('/onboarding/owner/location');
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast.error(error.message || 'Lỗi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="max-w-2xl mx-auto py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Building2 className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Thông tin Nhà hàng
                            </h1>
                            <p className="text-slate-600">
                                Điền thông tin để đăng tuyển nhân viên
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    {/* Restaurant Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tên nhà hàng <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.restaurantName}
                            onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            placeholder="VD: Sushi Tokyo, K-BBQ House..."
                        />
                    </div>

                    {/* Cuisine Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Loại ẩm thực <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.cuisineType}
                            onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        >
                            <option value="">{t('onboarding.owner_selectCuisineType')}</option>
                            <option value="japanese">🇯🇵 Nhật Bản</option>
                            <option value="korean">🇰🇷 Hàn Quốc</option>
                            <option value="vietnamese">🇻🇳 Việt Nam</option>
                            <option value="western">🍔 Âu Mỹ</option>
                        </select>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Số điện thoại liên hệ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                placeholder="0901234567"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email liên hệ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                placeholder="restaurant@example.com"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Địa chỉ nhà hàng <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={formData.restaurantAddress}
                            onChange={(e) => setFormData({ ...formData, restaurantAddress: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            placeholder={t('onboarding.owner_addressPlaceholder')}
                        />
                    </div>

                    {/* Logo & Cover */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ImageUpload
                            label={t('onboarding.owner_restaurantLogo')}
                            helperText={t('onboarding.owner_squareImageHint')}
                            onFileSelect={(file) => setLogoFile(file)}
                            onFileRemove={() => {
                                setLogoFile(null);
                                setExistingLogoUrl(null);
                            }}
                            existingUrl={existingLogoUrl || undefined}
                            accept="image/*"
                        />
                        <ImageUpload
                            label={t('onboarding.owner_restaurantCover')}
                            helperText={t('onboarding.owner_landscapeImageHint')}
                            onFileSelect={(file) => setCoverFile(file)}
                            onFileRemove={() => {
                                setCoverFile(null);
                                setExistingCoverUrl(null);
                            }}
                            existingUrl={existingCoverUrl || undefined}
                            accept="image/*"
                        />
                    </div>

                    {/* Business License */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-slate-600" />
                            <h3 className="font-medium text-slate-900">{t('onboarding.owner_businessLicense')}</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Số giấy phép kinh doanh
                            </label>
                            <input
                                type="text"
                                value={formData.businessLicenseNumber}
                                onChange={(e) => setFormData({ ...formData, businessLicenseNumber: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                placeholder="VD: 0123456789"
                            />
                        </div>

                        <div className="mt-4">
                            <ImageUpload
                                label={t('onboarding.owner_licenseImageOptional')}
                                helperText={t('onboarding.owner_uploadClearScan')}
                                onFileSelect={(file) => setLicenseFile(file)}
                                onFileRemove={() => {
                                    setLicenseFile(null);
                                    setExistingLicenseUrl(null);
                                }}
                                existingUrl={existingLicenseUrl || undefined}
                                accept="image/*,.pdf"
                                maxSize={10}
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <p className="text-sm text-blue-800">
                                💡 <strong>{t('onboarding.owner_note')}</strong> Giấy phép kinh doanh sẽ được xác minh trong 24-48 giờ.
                                Bạn vẫn có thể đăng tin tuyển dụng trong thời gian chờ xác minh.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/owner/dashboard')}
                            className="flex-1"
                            disabled={loading}
                        >
                            Bỏ qua - hoàn thiện sau
                        </Button>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                t('onboarding.owner_saveAndContinue')
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
