'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    QrCode,
    Camera,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowLeft,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

type ScanState = 'idle' | 'scanning' | 'validating' | 'success' | 'error';

interface CheckinResult {
    success: boolean;
    type: 'checkin' | 'checkout';
    jobTitle: string;
    time: string;
    message: string;
}

export default function WorkerScanQRPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CheckinResult | null>(null);
    const scannerRef = useRef<any>(null);
    const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    useEffect(() => {
        // Check camera permission
        if (typeof navigator !== 'undefined' && navigator.permissions) {
            navigator.permissions.query({ name: 'camera' as PermissionName })
                .then(result => setCameraPermission(result.state as any))
                .catch(() => setCameraPermission('prompt'));
        }

        return () => {
            stopScanner();
        };
    }, []);

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (e) {
                // Scanner might already be stopped
            }
        }
    };

    const startScanning = async () => {
        setScanState('scanning');
        setError(null);

        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                onScanSuccess,
                () => { } // Ignore scan errors
            );
        } catch (error: any) {
            console.error('Scanner error:', error);
            setError(t('checkin.errorTitle'));
            setScanState('error');
        }
    };

    const onScanSuccess = async (decodedText: string) => {
        await stopScanner();
        setScanState('validating');

        try {
            await processCheckin(decodedText);
        } catch (error: any) {
            setError(error.message || 'Lỗi xử lý check-in');
            setScanState('error');
        }
    };

    const processCheckin = async (qrData: string) => {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Vui lòng đăng nhập');

        // Parse và validate QR (chỉ hỗ trợ v4 — token ngẫu nhiên có thời hạn)
        let parsed: any;
        try {
            parsed = JSON.parse(qrData);
        } catch {
            throw new Error('Mã QR không đúng định dạng');
        }

        if (parsed.version !== 4 || !parsed.token) {
            throw new Error('Mã QR không hợp lệ. Vui lòng yêu cầu nhà hàng tạo mã mới.');
        }

        const res = await fetch('/api/qr/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: parsed.token }),
        });
        const validation = await res.json();
        if (!validation.valid) throw new Error(validation.error || 'Mã QR không hợp lệ');

        const jobId: string = validation.jobId;

        // Tìm application của worker cho đúng job này
        const { data: application, error: appError } = await supabase
            .from('job_applications')
            .select('id, status, job_id')
            .eq('worker_id', user.id)
            .eq('job_id', jobId)
            .in('status', ['approved', 'working'])
            .single();

        if (appError || !application) {
            throw new Error('Bạn không có đơn ứng tuyển hợp lệ cho ca làm việc này.');
        }

        // Lấy thông tin job
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, title, shift_date, shift_start_time, shift_end_time')
            .eq('id', jobId)
            .single();

        if (jobError || !job) throw new Error('Không tìm thấy thông tin ca làm việc.');

        const nowMs = Date.now();

        const parseVnDateTime = (dateStr: string, timeStr: string): Date => {
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hour, minute] = timeStr.split(':').map(Number);
            return new Date(
                `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` +
                `T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00+07:00`
            );
        };

        // Xác định checkin hay checkout
        const { data: checkinRecords } = await supabase
            .from('checkins')
            .select('type')
            .eq('application_id', application.id)
            .in('type', ['checkin', 'checkout']);

        const hasCheckin = checkinRecords?.some(r => r.type === 'checkin') ?? false;
        const hasCheckout = checkinRecords?.some(r => r.type === 'checkout') ?? false;

        let checkinType: 'checkin' | 'checkout';
        let isLate = false;

        if (!hasCheckin) {
            // Chưa checkin → thực hiện checkin
            checkinType = 'checkin';
            const shiftStartMs = parseVnDateTime(job.shift_date, job.shift_start_time).getTime();
            const earliestMs = shiftStartMs - 15 * 60 * 1000;
            if (nowMs < earliestMs) {
                const earliestStr = new Date(earliestMs).toLocaleTimeString('vi-VN', {
                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
                });
                throw new Error(`Chưa tới giờ check-in. Bạn có thể check-in từ ${earliestStr}.`);
            }
            isLate = nowMs > shiftStartMs;
        } else if (hasCheckin && !hasCheckout) {
            // Đã checkin, chưa checkout → thực hiện checkout
            checkinType = 'checkout';
        } else {
            throw new Error('Ca làm việc này đã hoàn thành cả check-in lẫn check-out.');
        }

        const isCheckin = checkinType === 'checkin';
        const lateMinutes = isCheckin && isLate
            ? Math.floor((nowMs - parseVnDateTime(job.shift_date, job.shift_start_time).getTime()) / 60_000)
            : 0;

        // Ghi checkin/checkout
        const { error: insertError } = await supabase
            .from('checkins')
            .insert({
                application_id: application.id,
                worker_id: user.id,
                job_id: job.id,
                type: checkinType,
                checkin_time: new Date().toISOString(),
                scanned_at: new Date().toISOString(),
                is_valid: true,
                ...(isCheckin && isLate ? { notes: `Check-in muộn ${lateMinutes} phút` } : {}),
            });

        if (insertError) throw new Error(`Lỗi ghi nhận: ${insertError.message}`);

        // Cập nhật status
        if (isCheckin) {
            const { error: statusError } = await supabase
                .from('job_applications')
                .update({ status: 'working' })
                .eq('id', application.id);
            if (statusError) throw new Error(`Lỗi cập nhật trạng thái: ${statusError.message}`);
        } else {
            const { error: statusError } = await supabase
                .from('job_applications')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', application.id);
            if (statusError) throw new Error(`Lỗi cập nhật trạng thái: ${statusError.message}`);
        }

        // Hiển thị kết quả
        const timeStr = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
        });

        const successMessage = isCheckin
            ? (isLate ? `Check-in thành công (muộn ${lateMinutes} phút)! Chúc bạn làm việc vui vẻ.` : 'Check-in thành công! Chúc bạn làm việc vui vẻ.')
            : 'Check-out thành công! Ca làm đã hoàn thành.';

        setResult({
            success: true,
            type: checkinType,
            jobTitle: job.title,
            time: timeStr,
            message: successMessage,
        });
        setScanState('success');
        toast.success(isCheckin
            ? (isLate ? 'Check-in thành công (muộn)!' : 'Check-in thành công!')
            : 'Check-out thành công!'
        );
    };

    const handleRetry = () => {
        setError(null);
        setResult(null);
        setScanState('idle');
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-primary pt-8 pb-16 px-4">
                <div className="max-w-lg mx-auto">
                    <Link href="/worker/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
                        <ArrowLeft className="w-5 h-5" />
                        <span>{t('checkin.goBack')}</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{t('checkin.pageTitle')}</h1>
                            <p className="text-white/70 text-sm">{t('checkin.pageSubtitle')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 -mt-8 space-y-6">
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    {scanState === 'idle' && (
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Camera className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">{t('checkin.readyToScan')}</h2>
                            <p className="text-muted-foreground mb-6">{t('checkin.pointCameraDesc')}</p>
                            <Button onClick={startScanning} size="lg" className="w-full">
                                <Camera className="w-5 h-5 mr-2" />
                                {t('checkin.openCamera')}
                            </Button>
                        </div>
                    )}

                    {scanState === 'scanning' && (
                        <div>
                            <div id="qr-reader" className="w-full aspect-square bg-black" />
                            <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">{t('checkin.scanning')}</p>
                                <Button variant="outline" size="sm" onClick={stopScanner} className="mt-2">
                                    {t('checkin.cancel')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {scanState === 'validating' && (
                        <div className="p-8 text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-foreground font-medium">{t('checkin.validating')}</p>
                        </div>
                    )}

                    {scanState === 'success' && result && (
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">
                                {result.type === 'checkin' ? t('checkin.checkinSuccess') : t('checkin.checkoutSuccess')}
                            </h2>
                            <p className="text-muted-foreground mb-4">{result.message}</p>

                            <div className="bg-muted rounded-xl p-4 mb-6">
                                <p className="text-sm text-muted-foreground">Job</p>
                                <p className="font-bold text-foreground">{result.jobTitle}</p>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{result.time}</span>
                                </div>
                            </div>

                            <Button onClick={() => router.push('/worker/dashboard')} className="w-full">
                                {t('checkin.toDashboard')}
                            </Button>
                        </div>
                    )}

                    {scanState === 'error' && (
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-10 h-10 text-destructive" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">{t('checkin.errorTitle')}</h2>
                            <p className="text-muted-foreground mb-6">{error}</p>

                            <div className="flex flex-col gap-2">
                                <Button onClick={handleRetry} className="w-full">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    {t('checkin.retry')}
                                </Button>
                                <Button variant="outline" onClick={() => router.push('/worker/dashboard')}>
                                    {t('checkin.toDashboard')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {scanState === 'idle' && (
                    <div className="bg-muted/50 rounded-2xl p-6">
                        <h3 className="font-bold text-foreground mb-3">{t('checkin.instructions')}</h3>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>{t('checkin.instruction1')}</li>
                            <li>{t('checkin.instruction2')}</li>
                            <li>{t('checkin.instruction3')}</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}
