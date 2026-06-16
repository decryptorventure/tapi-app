'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, FileText, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export default function SignContractPage({ params }: { params: { applicationId: string } }) {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [application, setApplication] = useState<any>(null);

    useEffect(() => {
        fetchContractDetails();
    }, []);

    const fetchContractDetails = async () => {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .select(`
                    *,
                    job:jobs (
                        title, 
                        hourly_rate_vnd, 
                        shift_date, 
                        shift_start_time, 
                        shift_end_time,
                        owner:profiles!jobs_owner_id_fkey(id, restaurant_name, restaurant_address)
                    ),
                    worker:profiles!job_applications_worker_id_fkey(full_name, phone_number)
                `)
                .eq('id', params.applicationId)
                .single();

            if (error) throw error;
            if ((data as any).contract_accepted_at) {
                router.replace(`/worker/jobs/${data.id}`);
                return;
            }
            setApplication(data);
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
            router.push('/worker/jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleSignContract = async () => {
        setSigning(true);
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('job_applications')
                .update({ contract_accepted_at: new Date().toISOString() })
                .eq('id', params.applicationId);

            if (error) throw error;

            toast.success(t('worker.contract_success'));

            const { NotificationService } = await import('@/lib/services/notification.service');
            await NotificationService.createNotification({
                user_id: application.job.owner.id,
                title: t('worker.contract_title'),
                message: `${application.worker.full_name} - ${application.job.title}`,
                type: 'system',
                related_id: params.applicationId
            }).catch(console.error);

            router.push(`/worker/jobs/${params.applicationId}/qr`);
        } catch (error) {
            toast.error(t('worker.contract_error'));
        } finally {
            setSigning(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!application) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <div className="bg-white border-b sticky top-0 z-10 px-4 py-4 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold">{t('worker.contract_title')}</h1>
                    <p className="text-sm text-slate-500">{t('worker.contract_subtitle')}</p>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-6 mt-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{t('worker.contract_docTitle')}</h2>
                        <p className="text-slate-500 text-sm mt-1">{t('worker.contract_readCarefully')}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-100 h-64 overflow-y-auto space-y-4">
                        <p><strong>{t('worker.contract_partyA')}:</strong> {application.job.owner?.restaurant_name}</p>
                        <p><strong>{t('worker.contract_partyB')}:</strong> {application.worker?.full_name}</p>

                        <p><strong>{t('worker.contract_section1')}:</strong></p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('worker.contract_position')}: {application.job.title}</li>
                            <li>{t('worker.contract_location')}: {application.job.owner?.restaurant_address}</li>
                            <li>{t('worker.contract_workTime')}: {application.job.shift_start_time} - {application.job.shift_end_time} ({new Date(application.job.shift_date).toLocaleDateString()})</li>
                        </ul>

                        <p><strong>{t('worker.contract_section2')}:</strong></p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('worker.contract_salary')}: {application.job.hourly_rate_vnd.toLocaleString()} VNĐ/h</li>
                            <li>{t('worker.contract_paymentMethod')}</li>
                        </ul>

                        <p><strong>{t('worker.contract_section3')}:</strong></p>
                        <p>{t('worker.contract_commitment')}</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-sm border border-blue-100">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{t('worker.contract_disclaimer')}</p>
                    </div>

                    <Button
                        onClick={handleSignContract}
                        disabled={signing}
                        className="w-full text-base py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                        {signing ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                        )}
                        {t('worker.contract_signBtn')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
