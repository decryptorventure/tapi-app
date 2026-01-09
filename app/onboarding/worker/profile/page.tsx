'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function WorkerProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
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

      toast.success(t('onboardingWorker.success') || 'Hồ sơ đã được cập nhật!');
      router.push('/onboarding/worker/languages'); // Go to language skills step
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(t('onboardingWorker.error') || 'Lỗi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t('onboarding.workerProfile')}
          </h1>
          <p className="text-slate-600">
            {t('onboarding.workerProfileDesc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <ImageUpload
            label={t('onboarding.avatarOptional')}
            helperText={t('onboarding.avatarHelper')}
            onFileSelect={(file) => setAvatarFile(file)}
            onFileRemove={() => setAvatarFile(null)}
            accept="image/*"
            maxSize={5}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('onboarding.dobLabel')}
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
              {t('onboarding.dobHelper')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('onboarding.universityLabel')}
            </label>
            <select
              required
              value={formData.universityName}
              onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">{t('onboarding.selectUniversity')}</option>
              <option value="VNU-HCM">{t('universities.vnu_hcm')}</option>
              <option value="HCMUT">{t('universities.hcmut')}</option>
              <option value="UEH">{t('universities.ueh')}</option>
              <option value="HUFLIT">{t('universities.huflit')}</option>
              <option value="RMIT">{t('universities.rmit')}</option>
              <option value="FTU">{t('universities.ftu')}</option>
              <option value="Other">{t('universities.other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('onboarding.bioLabel')}
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={t('onboarding.bioPlaceholder')}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1"
            >
              {t('onboarding.skipViewJobs')}
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('onboarding.saving')}
                </>
              ) : (
                t('onboarding.continue')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
