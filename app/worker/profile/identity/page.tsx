'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { VerificationService } from '@/lib/services/verification.service';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import { Loader2, Shield, AlertCircle } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

export default function IdentityVerificationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');

  const handleSubmit = async () => {
    if (!frontFile || !backFile) {
      toast.error(t('identity.missingImages'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createUntypedClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result = await VerificationService.uploadIdentityDocuments(
        user.id,
        frontFile,
        backFile,
        idNumber || undefined,
        issueDate ? new Date(issueDate) : undefined
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(t('identity.success'));
      router.push('/');
    } catch (error: any) {
      console.error('Identity verification error:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t('identity.title')}
              </h1>
              <p className="text-slate-600">
                {t('identity.description')}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t('identity.whyTitle')}</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>{t('identity.whyReason1')}</li>
                <li>{t('identity.whyReason2')}</li>
                <li>{t('identity.whyReason3')}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <ImageUpload
            label={t('identity.frontLabel')}
            helperText={t('identity.helperText')}
            onFileSelect={setFrontFile}
            onFileRemove={() => setFrontFile(null)}
            accept="image/*"
            maxSize={10}
          />

          <ImageUpload
            label={t('identity.backLabel')}
            helperText={t('identity.helperText')}
            onFileSelect={setBackFile}
            onFileRemove={() => setBackFile(null)}
            accept="image/*"
            maxSize={10}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('identity.idNumber')}
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="079123456789"
              maxLength={12}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('identity.issueDate')}
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              {t('identity.privacyNotice')}
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !frontFile || !backFile}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('identity.submitting')}
              </>
            ) : (
              t('identity.submit')
            )}
          </Button>

          <p className="text-center text-sm text-slate-600">
            {t('identity.footerNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
