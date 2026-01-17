'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    Loader2,
    ArrowLeft,
    Camera,
    User,
    Mail,
    Phone,
    Calendar,
    GraduationCap,
    FileText,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { ImageUpload } from '@/components/shared/image-upload';

interface ProfileData {
    full_name: string;
    email: string;
    phone_number: string;
    date_of_birth: string;
    university_name: string;
    bio: string;
    avatar_url: string | null;
}

export default function EditProfilePage() {
    const router = useRouter();
    const { locale } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({
        full_name: '',
        email: '',
        phone_number: '',
        date_of_birth: '',
        university_name: '',
        bio: '',
        avatar_url: null,
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

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

            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('full_name, email, phone_number, date_of_birth, university_name, bio, avatar_url')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setProfile({
                full_name: profileData.full_name || '',
                email: profileData.email || '',
                phone_number: profileData.phone_number || '',
                date_of_birth: profileData.date_of_birth || '',
                university_name: profileData.university_name || '',
                bio: profileData.bio || '',
                avatar_url: profileData.avatar_url,
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error(locale === 'vi' ? 'Lỗi tải thông tin' : 'Error loading profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let avatarUrl = profile.avatar_url;

            // Upload new avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatarUrl = publicUrl;
            }

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    phone_number: profile.phone_number,
                    date_of_birth: profile.date_of_birth || null,
                    university_name: profile.university_name || null,
                    bio: profile.bio || null,
                    avatar_url: avatarUrl,
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success(locale === 'vi' ? 'Đã lưu thông tin' : 'Profile saved');
            router.push('/worker/profile');
        } catch (error: any) {
            console.error('Error saving profile:', error);
            toast.error(error.message || (locale === 'vi' ? 'Lỗi lưu thông tin' : 'Error saving profile'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-lg">
                    <div className="flex items-center gap-4">
                        <Link href="/worker/profile">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-lg font-bold text-slate-900">
                            {locale === 'vi' ? 'Chỉnh sửa hồ sơ' : 'Edit Profile'}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
                {/* Avatar Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                                {avatarFile ? (
                                    <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                                ) : profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    profile.full_name?.charAt(0) || 'U'
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                                <Camera className="w-4 h-4 text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setAvatarFile(file);
                                    }}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-slate-500">
                            {locale === 'vi' ? 'Nhấn vào biểu tượng camera để thay đổi ảnh' : 'Tap camera icon to change photo'}
                        </p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <User className="w-4 h-4 inline mr-1" />
                            {locale === 'vi' ? 'Họ và tên *' : 'Full Name *'}
                        </label>
                        <input
                            type="text"
                            value={profile.full_name}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder={locale === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                            required
                        />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={profile.email}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                            disabled
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <Phone className="w-4 h-4 inline mr-1" />
                            {locale === 'vi' ? 'Số điện thoại' : 'Phone Number'}
                        </label>
                        <input
                            type="tel"
                            value={profile.phone_number}
                            onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="0912345678"
                        />
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {locale === 'vi' ? 'Ngày sinh' : 'Date of Birth'}
                        </label>
                        <input
                            type="date"
                            value={profile.date_of_birth}
                            onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* University */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <GraduationCap className="w-4 h-4 inline mr-1" />
                            {locale === 'vi' ? 'Trường đại học' : 'University'}
                        </label>
                        <input
                            type="text"
                            value={profile.university_name}
                            onChange={(e) => setProfile({ ...profile, university_name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder={locale === 'vi' ? 'VD: Đại học Bách khoa Hà Nội' : 'e.g. MIT'}
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <FileText className="w-4 h-4 inline mr-1" />
                            {locale === 'vi' ? 'Giới thiệu bản thân' : 'Bio'}
                        </label>
                        <textarea
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            placeholder={locale === 'vi' ? 'Viết một vài dòng về bản thân...' : 'Write a few lines about yourself...'}
                        />
                    </div>
                </div>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={saving || !profile.full_name}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 py-6"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {locale === 'vi' ? 'Đang lưu...' : 'Saving...'}
                        </>
                    ) : (
                        locale === 'vi' ? 'Lưu thay đổi' : 'Save Changes'
                    )}
                </Button>
            </div>
        </div>
    );
}
