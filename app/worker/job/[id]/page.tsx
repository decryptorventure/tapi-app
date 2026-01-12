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
    ShieldCheck,
    FileText,
    Languages,
    Star,
    Users,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useJobQualification, useApplyToJob } from '@/hooks/use-job-matching';
import { useAuth } from '@/hooks/use-auth';
import { ImageCarousel } from '@/components/ui/image-carousel';

interface Job {
    id: string;
    title: string;
    description: string;
    shift_date: string;
    shift_start_time: string;
    shift_end_time: string;
    hourly_rate_vnd: number;
    required_language: string;
    required_language_level: string;
    dress_code: string;
    min_reliability_score: number;
    max_workers: number;
    current_workers: number;
    thumbnail_url?: string;
    owner: {
        restaurant_name: string;
        restaurant_address: string;
        avatar_url: string;
        restaurant_logo_url?: string;
        restaurant_cover_urls?: string[];
    };
}

export default function JobDetailPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;
    const { t, locale } = useTranslation();
    const { user } = useAuth();
    const dateLocale = locale === 'vi' ? vi : enUS;

    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState<Job | null>(null);

    const { data: qualification } = useJobQualification(jobId, user?.id || null);
    const applyMutation = useApplyToJob();

    const isInstantBook = qualification?.qualification.qualifiesForInstantBook;

    useEffect(() => {
        fetchJob();
    }, [jobId]);

    const fetchJob = async () => {
        const supabase = createUntypedClient();
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    owner:profiles!owner_id(restaurant_name, restaurant_address, avatar_url, restaurant_logo_url, restaurant_cover_urls)
                `)
                .eq('id', jobId)
                .single();

            if (error) throw error;
            setJob(data as Job);
        } catch (error: any) {
            console.error('Fetch error:', error);
            toast.error('Không tìm thấy công việc');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!user?.id) {
            router.push('/login');
            return;
        }
        applyMutation.mutate({ jobId, workerId: user.id });
    };

    // Calculate estimated earnings
    const calculateEarnings = (startTime: string, endTime: string, rate: number) => {
        const [startH] = startTime.split(':').map(Number);
        const [endH] = endTime.split(':').map(Number);
        const hours = endH - startH;
        return Math.round(hours * rate);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h1 className="text-xl font-bold text-foreground mb-2">Không tìm thấy công việc</h1>
                <Link href="/worker/feed">
                    <Button variant="outline">Quay lại</Button>
                </Link>
            </div>
        );
    }

    const estimatedEarnings = calculateEarnings(job.shift_start_time, job.shift_end_time, job.hourly_rate_vnd);

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-4">
                    <Link href="/worker/feed" className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <h1 className="text-lg font-bold text-foreground truncate">
                        {t('jobs.jobDetails')}
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
                {/* Restaurant Images Carousel */}
                {(job.thumbnail_url || (job.owner?.restaurant_cover_urls && job.owner.restaurant_cover_urls.length > 0)) && (
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-muted shadow-md">
                        <ImageCarousel
                            images={[
                                ...(job.thumbnail_url ? [job.thumbnail_url] : []),
                                ...(job.owner?.restaurant_cover_urls || [])
                            ]}
                            alt={job.title}
                            className="w-full h-full"
                        />
                        {isInstantBook && (
                            <span className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 bg-success text-white text-xs font-semibold rounded-lg shadow-lg z-10">
                                <Sparkles className="w-3 h-3" />
                                Instant Book
                            </span>
                        )}
                    </div>
                )}

                {/* Job Info Card */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-foreground mb-2">{job.title}</h2>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="w-4 h-4" />
                                    <span className="font-bold">{job.owner?.restaurant_name}</span>
                                </div>
                            </div>
                            {isInstantBook && (
                                <span className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success text-xs font-medium rounded-full">
                                    <Sparkles className="w-3 h-3" />
                                    Instant Book
                                </span>
                            )}
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
                                    <p className="font-bold text-foreground">{job.owner?.restaurant_address || 'Chưa cập nhật'}</p>
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
                        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
                            {job.owner?.restaurant_logo_url ? (
                                <img
                                    src={job.owner.restaurant_logo_url}
                                    alt={job.owner.restaurant_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Building2 className="w-6 h-6 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">{job.owner?.restaurant_name}</h4>
                            <p className="text-xs text-muted-foreground">{t('jobs.trustedPartner')}</p>
                        </div>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border shadow-lg">
                <div className="max-w-2xl mx-auto">
                    <Button
                        onClick={handleApply}
                        disabled={applyMutation.isPending || qualification?.hasApplied}
                        className={cn(
                            "w-full font-bold py-6 rounded-xl flex items-center justify-center gap-2",
                            qualification?.hasApplied
                                ? "bg-muted text-muted-foreground"
                                : isInstantBook
                                    ? "bg-success hover:bg-success/90 text-white"
                                    : "bg-cta hover:bg-cta/90 text-white"
                        )}
                    >
                        {applyMutation.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : qualification?.hasApplied ? (
                            qualification.applicationStatus === 'pending' ? (
                                <>
                                    <Clock className="w-5 h-5" />
                                    Đang chờ duyệt
                                </>
                            ) : qualification.applicationStatus === 'approved' ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Đã nhận
                                </>
                            ) : (
                                'Đã ứng tuyển'
                            )
                        ) : isInstantBook ? (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Nhận job ngay
                            </>
                        ) : (
                            'Gửi yêu cầu'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
