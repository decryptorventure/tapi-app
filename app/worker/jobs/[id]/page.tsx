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
    FileText,
    Languages,
    Star,
    Users,
    QrCode,
    Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
                    job:jobs(*, owner:profiles!owner_id(restaurant_name, restaurant_address, avatar_url))
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

    // Calculate estimated earnings
    const calculateEarnings = (startTime: string, endTime: string, rate: number) => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const hours = (endH + endM / 60) - (startH + startM / 60);
        return Math.round(hours * rate);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!application) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
                <h1 className="text-xl font-bold text-foreground mb-2">{t('jobs.noJobs')}</h1>
                <Link href="/worker/jobs">
                    <Button variant="outline">{t('common.back')}</Button>
                </Link>
            </div>
        );
    }

    const { job } = application;
    const estimatedEarnings = calculateEarnings(job.shift_start_time, job.shift_end_time, job.hourly_rate_vnd);

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-4">
                    <Link href="/worker/jobs" className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <h1 className="text-lg font-bold text-foreground truncate">
                        {t('jobs.jobDetails')}
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
                {/* Status Card */}
                <div className={cn(
                    "p-4 rounded-xl border flex items-center justify-between",
                    application.status === 'approved' ? "bg-success/10 border-success/20 text-success" :
                        application.status === 'pending' ? "bg-warning/10 border-warning/20 text-warning" :
                            application.status === 'completed' ? "bg-primary/10 border-primary/20 text-primary" :
                                "bg-muted border-border text-muted-foreground"
                )}>
                    <div className="flex items-center gap-3">
                        {application.status === 'approved' && <CheckCircle2 className="w-5 h-5" />}
                        {application.status === 'pending' && <Clock className="w-5 h-5" />}
                        {application.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                        <span className="font-bold uppercase tracking-wider text-sm">
                            {application.status === 'approved' ? t('jobs.approved') :
                                application.status === 'pending' ? t('jobs.pending') :
                                    application.status === 'completed' ? t('common.status.completed') :
                                        application.status}
                        </span>
                    </div>
                    {application.is_instant_book && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-success/20 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Instant Book
                        </span>
                    )}
                </div>

                {/* Job Info Card */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-2xl font-black text-foreground mb-2">{job.title}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span className="font-bold">{job.owner?.restaurant_name || job.restaurant_name}</span>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">{t('jobs.shiftDate')}</p>
                                    <p className="font-bold text-foreground">{format(new Date(job.shift_date), 'EEEE, dd/MM/yyyy', { locale: dateLocale })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">{t('jobs.shiftTime')}</p>
                                    <p className="font-bold text-foreground">{job.shift_start_time} - {job.shift_end_time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-success/10 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-success" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">{t('jobs.hourlyRate')}</p>
                                    <p className="font-bold text-success">{job.hourly_rate_vnd.toLocaleString()} VNĐ/giờ</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-destructive/10 rounded-lg">
                                    <MapPin className="w-5 h-5 text-destructive" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">{t('jobs.location')}</p>
                                    <p className="font-bold text-foreground">{job.owner?.restaurant_address || job.location_name || 'Quận 1, TP.HCM'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Salary Breakdown */}
                        <div className="mt-6 p-4 bg-cta/5 border border-cta/20 rounded-xl">
                            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-cta" />
                                Thu nhập dự kiến
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lương theo giờ</span>
                                    <span className="font-medium text-foreground">{job.hourly_rate_vnd.toLocaleString()}đ × {((parseInt(job.shift_end_time) - parseInt(job.shift_start_time))).toFixed(0)}h</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-cta/10">
                                    <span className="font-bold text-foreground">Tổng thu nhập</span>
                                    <span className="font-black text-cta text-lg">{estimatedEarnings.toLocaleString()}đ</span>
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="mt-6 grid grid-cols-3 gap-3">
                            <div className="p-3 bg-muted rounded-xl text-center">
                                <Languages className="w-5 h-5 mx-auto mb-1 text-primary" />
                                <p className="text-xs font-bold text-foreground">{t(`feed.${job.required_language}`)}</p>
                                <p className="text-[10px] text-muted-foreground">{job.required_language_level?.toUpperCase() || 'Any'}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-xl text-center">
                                <Star className="w-5 h-5 mx-auto mb-1 text-warning" />
                                <p className="text-xs font-bold text-foreground">{job.min_reliability_score || 70}+</p>
                                <p className="text-[10px] text-muted-foreground">Điểm tin cậy</p>
                            </div>
                            <div className="p-3 bg-muted rounded-xl text-center">
                                <Users className="w-5 h-5 mx-auto mb-1 text-success" />
                                <p className="text-xs font-bold text-foreground">{job.current_workers || 0}/{job.max_workers || 1}</p>
                                <p className="text-[10px] text-muted-foreground">Vị trí</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="pt-4 border-t border-border">
                            <h3 className="font-black text-foreground mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" /> {t('jobs.description')}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                {job.description || t('jobs.noDescription')}
                            </p>
                        </div>

                        {job.dress_code && (
                            <div className="pt-4 border-t border-border">
                                <h3 className="font-black text-foreground mb-2 text-sm uppercase tracking-wide">{t('jobs.dressCode')}</h3>
                                <p className="text-muted-foreground text-sm">{job.dress_code}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Restaurant Card */}
                <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">{job.owner?.restaurant_name || job.restaurant_name}</h4>
                            <p className="text-xs text-muted-foreground">{t('jobs.trustedPartner')}</p>
                        </div>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
            </div>

            {/* Floating Action Button */}
            {application.status === 'approved' && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border shadow-lg">
                    <div className="max-w-2xl mx-auto">
                        <Link href="/worker/scan-qr">
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 rounded-xl flex items-center justify-center gap-2">
                                <QrCode className="w-5 h-5" />
                                Quét QR để Check-in
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

