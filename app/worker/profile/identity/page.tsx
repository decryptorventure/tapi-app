'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { VerificationService } from '@/lib/services/verification.service';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import { Loader2, Shield, AlertCircle, CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface VerificationData {
  id: string;
  status: 'pending' | 'verified' | 'rejected';
  id_front_url: string;
  id_back_url: string;
  rejection_reason?: string;
  created_at: string;
}

export default function IdentityVerificationPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [existingVerification, setExistingVerification] = useState<VerificationData | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');

  useEffect(() => {
    const fetchExistingVerification = async () => {
      try {
        const supabase = createUntypedClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Check for existing verification
        const verification = await VerificationService.getVerificationStatus(user.id, 'identity');

        if (verification) {
          setExistingVerification(verification as VerificationData);
        }
      } catch (error) {
        console.error('Error fetching verification:', error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchExistingVerification();
  }, [router]);

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
      // Refresh the page to show pending status
      router.refresh();
      window.location.reload();
    } catch (error: any) {
      console.error('Identity verification error:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show status if verification exists and is pending or verified
  if (existingVerification && (existingVerification.status === 'pending' || existingVerification.status === 'verified')) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="max-w-2xl mx-auto py-8">
          {/* Back Button */}
          <Link href="/worker/profile" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            {locale === 'vi' ? 'Quay lại hồ sơ' : 'Back to profile'}
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            {existingVerification.status === 'verified' ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {locale === 'vi' ? 'Đã xác minh danh tính' : 'Identity Verified'}
                </h1>
                <p className="text-slate-600 mb-6">
                  {locale === 'vi'
                    ? 'Danh tính của bạn đã được xác minh thành công. Bạn có thể ứng tuyển các công việc ngay bây giờ.'
                    : 'Your identity has been verified successfully. You can apply for jobs now.'}
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-orange-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {locale === 'vi' ? 'Đang xử lý xác minh' : 'Verification In Progress'}
                </h1>
                <p className="text-slate-600 mb-6">
                  {locale === 'vi'
                    ? 'Hồ sơ xác minh của bạn đang được xét duyệt. Quá trình này thường mất 24-48 giờ làm việc.'
                    : 'Your verification documents are being reviewed. This usually takes 24-48 business hours.'}
                </p>
              </>
            )}

            {/* Show uploaded images */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-2">{locale === 'vi' ? 'Mặt trước' : 'Front'}</p>
                <img
                  src={existingVerification.id_front_url}
                  alt="ID Front"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-2">{locale === 'vi' ? 'Mặt sau' : 'Back'}</p>
                <img
                  src={existingVerification.id_back_url}
                  alt="ID Back"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/worker/profile">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                  {locale === 'vi' ? 'Quay lại hồ sơ' : 'Back to Profile'}
                </Button>
              </Link>
              <Link href="/worker/feed">
                <Button variant="outline" className="w-full">
                  {locale === 'vi' ? 'Xem việc làm' : 'Browse Jobs'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show rejected status with option to re-upload
  if (existingVerification && existingVerification.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="max-w-2xl mx-auto py-8">
          {/* Back Button */}
          <Link href="/worker/profile" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            {locale === 'vi' ? 'Quay lại hồ sơ' : 'Back to profile'}
          </Link>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 mb-1">
                  {locale === 'vi' ? 'Xác minh bị từ chối' : 'Verification Rejected'}
                </h2>
                <p className="text-red-700">
                  {existingVerification.rejection_reason || (locale === 'vi'
                    ? 'Ảnh CMND/CCCD không hợp lệ. Vui lòng tải lên ảnh rõ ràng hơn.'
                    : 'ID images were invalid. Please upload clearer images.')}
                </p>
              </div>
            </div>
          </div>

          {/* Upload form for re-submission */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {locale === 'vi' ? 'Tải lại ảnh xác minh' : 'Re-upload Verification'}
                </h1>
                <p className="text-slate-600">
                  {locale === 'vi' ? 'Vui lòng tải lên ảnh CMND/CCCD rõ ràng' : 'Please upload clear ID photos'}
                </p>
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
                locale === 'vi' ? 'Gửi lại xác minh' : 'Resubmit Verification'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show upload form for new submissions
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Back Button */}
        <Link href="/worker/profile" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          {locale === 'vi' ? 'Quay lại hồ sơ' : 'Back to profile'}
        </Link>

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
