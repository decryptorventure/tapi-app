'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    QrCode,
    Loader2,
    MapPin,
    Calendar,
    Clock,
    Building2,
    AlertCircle,
    CheckCircle2,
    Camera,
    Scan
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Job, JobApplication } from '@/types/database.types';

interface ApplicationWithJob extends JobApplication {
    job: Job & {
        owner: {
            restaurant_name: string;
            restaurant_address: string;
        };
    };
}

export default function WorkerQRPage() {
    const router = useRouter();
    const params = useParams();
    const applicationId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState<ApplicationWithJob | null>(null);
    const [timeUntilShift, setTimeUntilShift] = useState<string>('');

    useEffect(() => {
        fetchApplication();
    }, [applicationId]);

    useEffect(() => {
        // Update countdown timer
        if (application?.job) {
            const timer = setInterval(updateCountdown, 1000);
            updateCountdown();
            return () => clearInterval(timer);
        }
    }, [application]);

    const updateCountdown = () => {
        if (!application?.job) return;

        const shiftDateTime = new Date(`${application.job.shift_date}T${application.job.shift_start_time}`);
        const now = new Date();
        const diff = shiftDateTime.getTime() - now.getTime();

        if (diff <= 0) {
            setTimeUntilShift('Đã bắt đầu');
        } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 24) {
                const days = Math.floor(hours / 24);
                setTimeUntilShift(`${days} ngày nữa`);
            } else if (hours > 0) {
                setTimeUntilShift(`${hours} giờ ${minutes} phút nữa`);
            } else {
                setTimeUntilShift(`${minutes} phút nữa`);
            }
        }
    };

    const fetchApplication = async () => {
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch application
            const { data: appData, error: appError } = await supabase
                .from('job_applications')
                .select('*')
                .eq('id', applicationId)
                .eq('worker_id', user.id)
                .single();

            if (appError) throw appError;
            if (!appData || appData.status !== 'approved') {
                toast.error('Đơn ứng tuyển không hợp lệ');
                router.push('/worker/jobs');
                return;
            }

            // Fetch job details
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', appData.job_id)
                .single();

            if (jobError) throw jobError;

            // Fetch restaurant info
            const { data: ownerData } = await supabase
                .from('profiles')
                .select('restaurant_name, restaurant_address')
                .eq('id', jobData.owner_id)
                .single();

            setApplication({
                ...appData,
                job: {
                    ...jobData,
                    owner: ownerData || { restaurant_name: '', restaurant_address: '' },
                },
            });

        } catch (error) {
            toast.error('Lỗi tải thông tin');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (time: string) => {
        return time.substring(0, 5);
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
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Không tìm thấy</h2>
                    <p className="text-muted-foreground mb-4">Không tìm thấy đơn ứng tuyển này</p>
                    <Link href="/worker/jobs" className="text-primary hover:underline">
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-lg">
                    <div className="flex items-center gap-4">
                        <Link href="/worker/jobs" className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <QrCode className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-lg font-bold text-foreground">Check-in</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
                {/* Status Banner */}
                <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                    <div>
                        <p className="font-medium text-success">Đơn đã được duyệt</p>
                        <p className="text-sm text-success/80">Đến địa điểm và quét mã QR của Owner</p>
                    </div>
                </div>

                {/* Scan QR Button - Primary Action */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Scan className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Quét mã QR tại cửa hàng</h2>
                    <p className="text-muted-foreground mb-6">
                        Tìm mã QR do Owner dán tại cửa hàng và quét để check-in
                    </p>
                    <Button
                        onClick={() => router.push('/worker/scan-qr')}
                        className="w-full"
                        size="lg"
                    >
                        <Camera className="w-5 h-5 mr-2" />
                        Mở Camera Quét QR
                    </Button>
                </div>

                {/* Countdown Timer */}
                <div className="bg-primary text-primary-foreground rounded-xl p-4 text-center">
                    <p className="text-sm opacity-80 mb-1">Ca làm bắt đầu</p>
                    <p className="text-2xl font-bold">{timeUntilShift}</p>
                </div>

                {/* Job Details */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
                    <h3 className="font-semibold text-foreground">{application.job.title}</h3>

                    <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <div>
                                <p className="font-medium text-foreground">{application.job.owner.restaurant_name}</p>
                                <p className="text-muted-foreground">{application.job.owner.restaurant_address}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <span className="text-foreground">{formatDate(application.job.shift_date)}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <span className="text-foreground">
                                {formatTime(application.job.shift_start_time)} - {formatTime(application.job.shift_end_time)}
                            </span>
                        </div>
                    </div>

                    {/* Pay Info */}
                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Lương/giờ</span>
                            <span className="font-bold text-cta">
                                {application.job.hourly_rate_vnd.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                    <h4 className="font-medium text-warning mb-2">📋 Hướng dẫn Check-in</h4>
                    <ul className="text-sm text-warning/80 space-y-1">
                        <li>1. Đến đúng giờ tại địa chỉ nhà hàng</li>
                        <li>2. Tìm mã QR dán tại quầy hoặc poster</li>
                        <li>3. Bấm "Mở Camera Quét QR" ở trên</li>
                        <li>4. Quét lại mã QR khi hết ca để check-out</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
