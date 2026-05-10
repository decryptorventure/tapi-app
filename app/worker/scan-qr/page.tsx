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
import { QRCodeService } from '@/lib/services/qr-code.service';

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
            setError('Không thể mở camera. Vui lòng cấp quyền camera.');
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

        const validation = await QRCodeService.validateOwnerQRAsync(qrData);
        if (!validation.valid) throw new Error(validation.error || 'Mã QR không hợp lệ');

        const ownerId = validation.ownerId;
        if (!ownerId) throw new Error('Dữ liệu QR thiếu thông tin nhà hàng');

        // Current time in Vietnam timezone
        const nowUTC = new Date();
        const vnNow = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        const today = vnNow.getFullYear() + '-'
            + String(vnNow.getMonth() + 1).padStart(2, '0') + '-'
            + String(vnNow.getDate()).padStart(2, '0');
        const currentMinutes = vnNow.getHours() * 60 + vnNow.getMinutes();

        // Helper: parse "HH:MM:SS" or "HH:MM" to minutes since midnight
        const timeToMinutes = (t: string) => {
            const parts = t.split(':');
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        };

        // Find worker's applications for this owner — TODAY only
        const { data: applications, error: appError } = await supabase
            .from('job_applications')
            .select(`
                id, status,
                job:jobs!inner(
                    id, title, owner_id,
                    shift_date, shift_start_time, shift_end_time
                )
            `)
            .eq('worker_id', user.id)
            .eq('job.owner_id', ownerId)
            .eq('job.shift_date', today)
            .in('status', ['approved', 'working'])
            .order('created_at', { ascending: false });

        if (appError || !applications || applications.length === 0) {
            throw new Error('Bạn không có ca làm việc hôm nay tại nhà hàng này.');
        }

        let application: typeof applications[0] | null = null;
        let checkinType: 'checkin' | 'checkout' = 'checkin';
        let isLate = false;
        let earlyMessage = '';

        // --- PRIORITY 1: Find 'working' app that needs CHECKOUT ---
        const workingApps = applications.filter(a => a.status === 'working');
        for (const app of workingApps) {
            const { data: records } = await supabase
                .from('checkins')
                .select('id, type')
                .eq('application_id', app.id)
                .in('type', ['checkin', 'checkout']);

            const hasCheckin = records?.some(r => r.type === 'checkin');
            const hasCheckout = records?.some(r => r.type === 'checkout');

            if (hasCheckin && !hasCheckout) {
                const job = app.job as any;
                const shiftEndMin = timeToMinutes(job.shift_end_time);
                const checkoutDeadline = shiftEndMin + 120;

                if (currentMinutes > checkoutDeadline) {
                    throw new Error(
                        `Đã quá giờ check-out 2 tiếng. Ca kết thúc lúc ${job.shift_end_time.substring(0, 5)}. ` +
                        `Vui lòng liên hệ nhà hàng.`
                    );
                }

                application = app;
                checkinType = 'checkout';
                break;
            }
        }

        // --- PRIORITY 2: Find 'approved' app that needs CHECKIN ---
        if (!application) {
            // Sort by shift_start_time to pick the nearest upcoming shift
            const approvedApps = applications
                .filter(a => a.status === 'approved')
                .sort((a, b) => {
                    const jobA = a.job as any;
                    const jobB = b.job as any;
                    return timeToMinutes(jobA.shift_start_time) - timeToMinutes(jobB.shift_start_time);
                });

            for (const app of approvedApps) {
                const { data: existing } = await supabase
                    .from('checkins')
                    .select('id')
                    .eq('application_id', app.id)
                    .eq('type', 'checkin')
                    .limit(1);

                if (existing && existing.length > 0) continue; // already checked in

                const job = app.job as any;
                const shiftStartMin = timeToMinutes(job.shift_start_time);
                const checkinEarliest = shiftStartMin - 15;       // 15 min before shift
                const checkinDeadline = shiftStartMin + 120;      // 2 hours after shift start

                if (currentMinutes < checkinEarliest) {
                    // Too early — show the shift time
                    earlyMessage = `Chưa tới giờ check-in. Ca "${job.title}" bắt đầu lúc ${job.shift_start_time.substring(0, 5)}, ` +
                        `bạn có thể check-in từ ${Math.floor(checkinEarliest / 60).toString().padStart(2, '0')}:${(checkinEarliest % 60).toString().padStart(2, '0')}.`;
                    continue;
                }

                if (currentMinutes > checkinDeadline) {
                    continue; // Past deadline, skip
                }

                // Within check-in window
                isLate = currentMinutes > shiftStartMin;
                application = app;
                checkinType = 'checkin';
                break;
            }
        }

        if (!application) {
            if (earlyMessage) throw new Error(earlyMessage);
            throw new Error('Không có ca làm việc nào cần check-in/check-out hôm nay.');
        }

        const job = application.job as any;

        // --- Record check-in or check-out ---
        // NOTE: worker_id is REQUIRED by RLS policy ("Workers can checkin" checks auth.uid() = worker_id)
        const isCheckin = checkinType === 'checkin';
        const checkinPayload: Record<string, any> = {
            application_id: application.id,
            worker_id: user.id,
            job_id: job.id,
            type: checkinType,
            checkin_time: new Date().toISOString(),
            scanned_at: new Date().toISOString(),
            is_valid: isCheckin ? !isLate : true,
        };

        // Optional fields
        if (isCheckin && isLate) {
            checkinPayload.notes = `Check-in muộn ${currentMinutes - timeToMinutes(job.shift_start_time)} phút`;
        }

        const { error: insertError } = await supabase
            .from('checkins')
            .insert(checkinPayload);

        if (insertError) {
            console.error('Checkin insert error:', insertError);
            throw new Error(`Lỗi ghi nhận ${isCheckin ? 'check-in' : 'check-out'}: ${insertError.message}`);
        }

        // --- Update application status ---
        if (checkinType === 'checkin') {
            await supabase
                .from('job_applications')
                .update({ status: 'working' })
                .eq('id', application.id);
        } else {
            // Checkout → completed
            await supabase
                .from('job_applications')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', application.id);
        }

        // --- Success UI ---
        const timeStr = vnNow.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const lateNote = isLate ? ` (muộn ${currentMinutes - timeToMinutes(job.shift_start_time)} phút)` : '';

        setResult({
            success: true,
            type: checkinType,
            jobTitle: job.title,
            time: timeStr,
            message: checkinType === 'checkin'
                ? `Đã check-in thành công${lateNote}! Chúc bạn làm việc vui vẻ.`
                : 'Đã check-out thành công! Ca làm đã hoàn thành.',
        });
        setScanState('success');
        toast.success(
            checkinType === 'checkin'
                ? `Check-in thành công!${lateNote}`
                : 'Check-out thành công! Ca làm hoàn thành.'
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
                        <span>Quay lại</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Scan QR Check-in</h1>
                            <p className="text-white/70 text-sm">Quét mã QR tại cửa hàng</p>
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
                            <h2 className="text-xl font-bold text-foreground mb-2">Sẵn sàng quét</h2>
                            <p className="text-muted-foreground mb-6">
                                Đặt camera hướng vào mã QR tại cửa hàng
                            </p>
                            <Button onClick={startScanning} size="lg" className="w-full">
                                <Camera className="w-5 h-5 mr-2" />
                                Mở Camera
                            </Button>
                        </div>
                    )}

                    {scanState === 'scanning' && (
                        <div>
                            <div id="qr-reader" className="w-full aspect-square bg-black" />
                            <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">Đang quét mã QR...</p>
                                <Button variant="outline" size="sm" onClick={stopScanner} className="mt-2">
                                    Hủy
                                </Button>
                            </div>
                        </div>
                    )}

                    {scanState === 'validating' && (
                        <div className="p-8 text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-foreground font-medium">Đang xác thực...</p>
                        </div>
                    )}

                    {scanState === 'success' && result && (
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">
                                {result.type === 'checkin' ? 'Check-in thành công!' : 'Check-out thành công!'}
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
                                Về Dashboard
                            </Button>
                        </div>
                    )}

                    {scanState === 'error' && (
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-10 h-10 text-destructive" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">Lỗi thao tác</h2>
                            <p className="text-muted-foreground mb-6">{error}</p>

                            <div className="flex flex-col gap-2">
                                <Button onClick={handleRetry} className="w-full">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Thử lại
                                </Button>
                                <Button variant="outline" onClick={() => router.push('/worker/dashboard')}>
                                    Về Dashboard
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {scanState === 'idle' && (
                    <div className="bg-muted/50 rounded-2xl p-6">
                        <h3 className="font-bold text-foreground mb-3">Hướng dẫn</h3>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>Tìm mã QR tại quầy hoặc poster của cửa hàng</li>
                            <li>Mở camera và đưa vào khung quét</li>
                            <li>Hệ thống tự động ghi nhận check-in hoặc check-out</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}
