'use client';
import { useTranslation } from '@/lib/i18n';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import {
  Loader2,
  User,
  Calendar,
  GraduationCap,
  FileText,
  ChevronRight,
  Check
} from 'lucide-react';
import Image from 'next/image';
import { StorageService } from '@/lib/services/storage.service';

export default function WorkerProfilePage() {
    const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    universityName: '',
    bio: '',
  });

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData({
          fullName: profile.full_name || '',
          dateOfBirth: profile.date_of_birth || '',
          universityName: profile.university_name || '',
          bio: profile.bio || '',
        });
        if (profile.avatar_url) {
          setAvatarPreview(profile.avatar_url);
        }
      }
    } catch (error) {
      console.error('Profile check error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload avatar if provided using StorageService
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        const uploadResult = await StorageService.uploadWithRetry(
          'avatars',
          avatarFile,
          user.id
        );

        if (uploadResult.success && uploadResult.url) {
          avatarUrl = uploadResult.url;
        } else if (uploadResult.error) {
          toast.error(uploadResult.error.message);
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth || null,
          university_name: formData.universityName || null,
          bio: formData.bio || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Hồ sơ đã được cập nhật!');
      router.push('/onboarding/worker/languages');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Lỗi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Bước 1/4</span>
            <span className="text-sm text-muted-foreground">{t('onboarding.worker_personalInfo')}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/4 transition-all duration-300"></div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Xin chào! 👋
          </h1>
          <p className="text-muted-foreground">
            Hãy cho chúng tôi biết thêm về bạn để tìm công việc phù hợp nhất
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <label className="block text-sm font-semibold text-foreground mb-4">
              Ảnh đại diện
            </label>
            <div className="flex items-center gap-6">
              {avatarPreview ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-primary/20">
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <ImageUpload
                  label=""
                  helperText={t('onboarding.worker_avatarHints')}
                  onFileSelect={handleAvatarSelect}
                  onFileRemove={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  accept="image/*"
                  maxSize={5}
                />
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Họ và tên <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Ngày sinh <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Bạn phải từ 18 tuổi trở lên
            </p>
          </div>

          {/* University */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Trường đại học <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
              <select
                required
                value={formData.universityName}
                onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground appearance-none"
              >
                <option value="">{t('onboarding.worker_selectUniversity')}</option>
                <option value="VNU-HCM">Đại học Quốc gia TP.HCM</option>
                <option value="HCMUT">Đại học Bách Khoa</option>
                <option value="UEH">Đại học Kinh tế TP.HCM</option>
                <option value="HUFLIT">Đại học Ngoại ngữ - Tin học</option>
                <option value="RMIT">RMIT Vietnam</option>
                <option value="FTU">Đại học Ngoại thương</option>
                <option value="Other">{t('onboarding.worker_otherUniversity')}</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Giới thiệu bản thân
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground resize-none"
                placeholder={t('onboarding.worker_bioPlaceholder')}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sticky bottom-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1 h-12"
            >
              Bỏ qua, xem việc ngay
            </Button>

            <Button
              type="submit"
              disabled={loading}
              variant="default"
              className="flex-1 h-12 bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  Tiếp tục
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
