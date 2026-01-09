'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    Building2,
    Clock,
    DollarSign,
    MapPin,
    Calendar,
    Loader2,
    CheckCircle2,
    ShieldCheck,
    Briefcase,
    FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';

export default function WorkerJobDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const applicationId = params.id as string;
    const { t, locale } = useTranslation();
    const dateLocale = locale === 'vi' ? vi : enUS;

    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState<any>(null);

    useEffect(() => {
        fetchApplication();
    }, [applicationId]);

    const fetchApplication = async () => {
        const supabase = createUntypedClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('job_applications')
                .select(`
                    *,
                    job:jobs(*)
                `)
                .eq('id', applicationId)
                .single();

            if (error) throw error;
            setApplication(data);
        } catch (error: any) {
            console.error('Fetch error:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!application) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <Briefcase className="w-16 h-16 text-slate-300 mb-4" />
                <h1 className="text-xl font-bold text-slate-900 mb-2">{t('jobs.noJobs')}</h1>
                <Link href="/worker/jobs">
                    <Button variant="outline">{t('common.back')}</Button>
                </Link>
            </div>
        );
    }

    const { job } = application;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-4">
                    <Link href="/worker/jobs" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-900 truncate">
                        {t('jobs.jobDetails')}
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
                {/* Status Card */}
                <div className={cn(
                    "p-4 rounded-xl border flex items-center justify-between shadow-sm",
                    application.status === 'approved' ? "bg-green-50 border-green-100 text-green-800" :
                        application.status === 'pending' ? "bg-orange-50 border-orange-100 text-orange-800" :
                            application.status === 'completed' ? "bg-blue-50 border-blue-100 text-blue-800" :
                                "bg-slate-100 border-slate-200 text-slate-600"
                )}>
                    <div className="flex items-center gap-3">
                        {application.status === 'approved' && <CheckCircle2 className="w-5 h-5" />}
                        {application.status === 'pending' && <Clock className="w-5 h-5" />}
                        {application.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                        <span className="font-bold uppercase tracking-wider text-sm">
                            {application.status === 'approved' ? t('jobs.approved') :
                                application.status === 'pending' ? t('jobs.pending') :
                                    application.status === 'completed' ? t('jobs.completed') || 'Completed' :
                                        application.status}
                        </span>
                    </div>
                </div>

                {/* Job Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">{job.title}</h2>
                        <div className="flex items-center gap-2 text-slate-600">
                            <Building2 className="w-4 h-4" />
                            <span className="font-bold">{job.restaurant_name}</span>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">{t('jobs.shiftDate')}</p>
                                    <p className="font-bold">{format(new Date(job.shift_date), 'EEEE, dd/MM/yyyy', { locale: dateLocale })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">{t('jobs.shiftTime')}</p>
                                    <p className="font-bold">{job.shift_start_time} - {job.shift_end_time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">{t('jobs.hourlyRate')}</p>
                                    <p className="font-bold text-green-600">{job.hourly_rate_vnd.toLocaleString()} VNĐ/giờ</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">{t('jobs.location')}</p>
                                    <p className="font-bold">{job.location_name || 'Quận 1, TP.HCM'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" /> {t('jobs.description')}
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                {job.description || t('jobs.noDescription')}
                            </p>
                        </div>

                        {job.dress_code && (
                            <div className="pt-4 border-t border-slate-50">
                                <h3 className="font-black text-slate-900 mb-2 text-sm uppercase tracking-wide">{t('jobs.dressCode')}</h3>
                                <p className="text-slate-600 text-sm">{job.dress_code}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Restaurant Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">{job.restaurant_name}</h4>
                            <p className="text-xs text-slate-500">{t('jobs.trustedPartner')}</p>
                        </div>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-blue-500" />
                </div>

                {/* Action Button */}
                {application.status === 'approved' && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg">
                        <div className="max-w-2xl mx-auto flex gap-3">
                            <Link href={`/worker/jobs/${application.id}/qr`} className="flex-1">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-xl">
                                    {t('jobs.viewQr')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
