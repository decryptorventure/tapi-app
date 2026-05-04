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

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Vui lòng đăng nhập');
        }

        // Validate Owner QR code (async — uses Web Crypto API in browser)
        const validation = await QRCodeService.validateOwnerQRAsync(qrData);
        if (!validation.valid) {
            throw new Error(validation.error || 'Mã QR không hợp lệ');
        }

        const ownerId = validation.ownerId;
        if (!ownerId) {
            throw new Error('Dữ liệu QR thiếu thông tin nhà hàng');
        }

        // Find ALL worker's applications for this owner
        // Include 'rejected' to handle cases where cleanup incorrectly rejected working apps
        const { data: applications, error: appError } = await supabase
            .from('job_applications')
            .select(`
                id, 
                status, 
                job:jobs!inner(
                    id,
                    title, 
                    owner_id
                )
            `)
            .eq('worker_id', user.id)
            .eq('job.owner_id', ownerId)
            .in('status', ['approved', 'working', 'rejected'])
            .order('created_at', { ascending: false });

        if (appError || !applications || applications.length === 0) {
            throw new Error('Bạn không có ca làm việc nào đang chờ tại nhà hàng này.');
        }

        // Step 1: Try to find an application that needs checkout
        // Check 'working' apps first, then 'rejected' apps with existing checkin (incorrectly rejected)
        let application: typeof applications[0] | null = null;
        let checkinType: 'checkin' | 'checkout' = 'checkin';

        const checkoutCandidates = applications.filter(a => a.status === 'working' || a.status === 'rejected');
        
        for (const app of checkoutCandidates) {
            const { data: checkinRecords } = await supabase
                .from('checkins')
                .select('id, type')
                .eq('application_id', app.id)
                .in('type', ['checkin', 'checkout']);

            const hasCheckin = checkinRecords?.some(r => r.type === 'checkin');
            const hasCheckout = checkinRecords?.some(r => r.type === 'checkout');

            if (hasCheckin && !hasCheckout) {
                // This application needs checkout
                application = app;
                checkinType = 'checkout';

                // Restore status if it was incorrectly rejected
                if (app.status === 'rejected') {
                    await supabase
                        .from('job_applications')
                        .update({ status: 'working' })
                        .eq('id', app.id);
                }
                break;
            }
        }

        // Step 2: If no checkout needed, find an 'approved' application for checkin
        if (!application) {
            const approvedApps = applications.filter(a => a.status === 'approved');
            
            for (const app of approvedApps) {
                const { data: existingCheckin } = await supabase
                    .from('checkins')
                    .select('id')
                    .eq('application_id', app.id)
                    .eq('type', 'checkin')
                    .limit(1);

                if (!existingCheckin || existingCheckin.length === 0) {
                    application = app;
                    checkinType = 'checkin';
                    break;
                }
            }
        }

        if (!application) {
            throw new Error('Không có ca làm việc nào cần check-in/check-out tại nhà hàng này.');
        }

        const job = application.job as any;

        // Record check-in/check-out
        const { error: checkinError } = await supabase
            .from('checkins')
            .insert({
                application_id: application.id,
                type: checkinType,
                checkin_time: new Date().toISOString(),
                is_valid: true,
                scanned_at: new Date().toISOString(),
            });

        if (checkinError) {
            console.error('Checkin insert error:', checkinError);
            throw new Error(`Lỗi ghi nhận ${checkinType === 'checkin' ? 'check-in' : 'check-out'}`);
        }

        // Update application status on checkin
        if (checkinType === 'checkin') {
            await supabase
                .from('job_applications')
                .update({ status: 'working' })
                .eq('id', application.id);
        }
        // NOTE: On checkout, status remains 'working' until owner confirms (Timee flow)

        // Success
        setResult({
            success: true,
            type: checkinType,
            jobTitle: job.title,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            message: checkinType === 'checkin'
                ? 'Đã check-in thành công! Chúc bạn làm việc vui vẻ.'
                : 'Đã check-out thành công! Chờ xác nhận từ chủ nhà hàng.',
        });
        setScanState('success');
        toast.success(checkinType === 'checkin' ? 'Check-in thành công!' : 'Check-out thành công!');
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
