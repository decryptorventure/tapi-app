'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { Plus, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface LanguageSkillForm {
  language: string;
  level: string;
  certificateFile: File | null;
}

interface LanguageSkill {
  id: string;
  language: string;
  level: string;
  certificate_url: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
}

export default function LanguageSkillsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [skills, setSkills] = useState<LanguageSkill[]>([]);
  const [formData, setFormData] = useState<LanguageSkillForm>({
    language: '',
    level: '',
    certificateFile: null,
  });

  const languageLevels: Record<string, string[]> = {
    japanese: ['N5', 'N4', 'N3', 'N2', 'N1'],
    korean: ['TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6'],
    english: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  };

  const loadSkills = async () => {
    const supabase = createUntypedClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('language_skills')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setSkills((data as LanguageSkill[]) || []);
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleAddSkill = async () => {
    if (!formData.language || !formData.level || !formData.certificateFile) {
      toast.error(t('languageSkills.fillAll'));
      return;
    }

    setLoading(true);
    const supabase = createUntypedClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload certificate
      const certPath = `certificates/${user.id}/${formData.language}-${Date.now()}.${formData.certificateFile.name.split('.').pop()
        }`;
      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(certPath, formData.certificateFile);

      if (uploadError) throw uploadError;

      const { data: certUrl } = supabase.storage
        .from('verifications')
        .getPublicUrl(certPath);

      // Insert language skill
      const { error: insertError } = await supabase
        .from('language_skills')
        .insert({
          user_id: user.id,
          language: formData.language,
          level: formData.level.toLowerCase().replace(' ', '_'),
          certificate_url: certUrl.publicUrl,
          verification_status: 'pending',
        });

      if (insertError) throw insertError;

      toast.success(t('languageSkills.success'));
      setShowForm(false);
      setFormData({ language: '', level: '', certificateFile: null });

      // Reload skills
      await loadSkills();
    } catch (error: any) {
      console.error('Add skill error:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="text-green-600 font-medium">{t('worker.verified')}</span>;
      case 'pending':
        return <span className="text-orange-600 font-medium">{t('worker.pending')}</span>;
      case 'rejected':
        return <span className="text-red-600 font-medium">{t('languageSkills.rejected')}</span>;
      default:
        return null;
    }
  };

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'japanese': return t('onboarding.japanese');
      case 'korean': return t('onboarding.korean');
      case 'english': return t('onboarding.english');
      default: return lang;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t('languageSkills.title')}
          </h1>
          <p className="text-slate-600">
            {t('languageSkills.description')}
          </p>
        </div>

        {/* Existing Skills */}
        {skills.length > 0 && (
          <div className="space-y-4 mb-6">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 mb-1">
                    {getLanguageName(skill.language)} - {skill.level.toUpperCase().replace('_', ' ')}
                  </p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(skill.verification_status)}
                    {getStatusText(skill.verification_status)}
                  </div>
                  {skill.verification_status === 'rejected' && skill.rejection_reason && (
                    <p className="text-sm text-red-600 mt-2">
                      {t('languageSkills.rejectionReason')}: {skill.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Skill Form */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full border-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('languageSkills.addLanguage')}
          </Button>
        ) : (
          <div className="border border-slate-200 rounded-lg p-6 space-y-4 bg-white shadow-sm">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('languageSkills.language')}
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value, level: '' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">{t('languageSkills.chooseLanguage')}</option>
                <option value="japanese">{t('onboarding.japanese')}</option>
                <option value="korean">{t('onboarding.korean')}</option>
                <option value="english">{t('onboarding.english')}</option>
              </select>
            </div>

            {formData.language && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('languageSkills.level')}
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">{t('languageSkills.chooseLevel')}</option>
                  {languageLevels[formData.language]?.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ImageUpload
              label={t('languageSkills.certificateLabel')}
              helperText={t('languageSkills.certificateHelper')}
              onFileSelect={(file) => setFormData({ ...formData, certificateFile: file })}
              onFileRemove={() => setFormData({ ...formData, certificateFile: null })}
              accept="image/*,application/pdf"
              maxSize={10}
            />

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ language: '', level: '', certificateFile: null });
                }}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>

              <Button
                onClick={handleAddSkill}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('languageSkills.saving')}
                  </>
                ) : (
                  t('languageSkills.addSkill')
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Button
            onClick={() => router.push('/worker/profile/identity')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
          >
            {t('languageSkills.nextIdentity')}
          </Button>
        </div>
      </div>
    </div>
  );
}
