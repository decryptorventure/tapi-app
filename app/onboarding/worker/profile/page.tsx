'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function WorkerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    universityName: '',
    bio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createUntypedClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload avatar if provided
      let avatarUrl = null;
      if (avatarFile) {
        const avatarPath = `avatars/${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, avatarFile);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(avatarPath);
          avatarUrl = data.publicUrl;
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          date_of_birth: formData.dateOfBirth || null,
          university_name: formData.universityName || null,
          bio: formData.bio || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Hồ sơ đã được cập nhật!');
      router.push('/onboarding/worker/languages'); // Go to language skills step
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Lỗi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Hoàn thiện hồ sơ Worker
          </h1>
          <p className="text-slate-600">
            Thông tin này giúp nhà tuyển dụng hiểu về bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <ImageUpload
            label="Ảnh đại diện (tùy chọn)"
            helperText="Tải lên ảnh chân dung rõ mặt"
            onFileSelect={(file) => setAvatarFile(file)}
            onFileRemove={() => setAvatarFile(null)}
            accept="image/*"
            maxSize={5}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ngày sinh
            </label>
            <input
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">
              Phải từ 18 tuổi trở lên
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trường đại học
            </label>
            <select
              required
              value={formData.universityName}
              onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Chọn trường</option>
              <option value="VNU-HCM">Đại học Quốc gia TP.HCM</option>
              <option value="HCMUT">Đại học Bách Khoa TP.HCM</option>
              <option value="UEH">Đại học Kinh tế TP.HCM</option>
              <option value="HUFLIT">Đại học Ngoại ngữ - Tin học</option>
              <option value="RMIT">RMIT Vietnam</option>
              <option value="FTU">Đại học Ngoại thương</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Giới thiệu bản thân (tùy chọn)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Giới thiệu về bản thân, kinh nghiệm làm việc, sở thích..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1"
            >
              Bỏ qua - xem việc làm
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Tiếp tục'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
