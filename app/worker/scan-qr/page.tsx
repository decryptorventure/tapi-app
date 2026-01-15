'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    QrCode,
    Camera,
    CheckCircle2,
    XCircle,
    MapPin,
    Clock,
    ArrowLeft,
    RefreshCw,
    AlertTriangle
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
    const [gpsStatus, setGpsStatus] = useState<'checking' | 'success' | 'error' | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const scannerRef = useRef<any>(null);
    const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    useEffect(() => {
        // Check camera permission
        navigator.permissions?.query({ name: 'camera' as PermissionName })
            .then(result => setCameraPermission(result.state as any))
            .catch(() => setCameraPermission('prompt'));

        // Get GPS location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setGpsStatus('success');
                },
                () => {
                    setGpsStatus('error');
                }
            );
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
        const supabase = createUntypedClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Vui lòng đăng nhập');
        }

        // Validate QR code
        const validation = QRCodeService.validateJobQR(qrData);
        if (!validation.valid) {
            throw new Error(validation.error || 'Mã QR không hợp lệ');
        }

        const jobId = validation.jobId;
        if (!jobId) {
            throw new Error('Không tìm thấy thông tin job');
        }

        // Check if worker has approved application for this job
        const { data: application, error: appError } = await supabase
            .from('job_applications')
            .select('id, status, job:jobs(title, restaurant_name, restaurant_lat, restaurant_lng)')
            .eq('job_id', jobId)
            .eq('worker_id', user.id)
            .single();

        if (appError || !application) {
            throw new Error('Bạn chưa được duyệt cho job này');
        }

        if (application.status !== 'approved') {
            throw new Error('Đơn ứng tuyển của bạn chưa được duyệt');
        }

        const job = application.job as any;

        // Validate GPS if location available
        if (userLocation && job.restaurant_lat && job.restaurant_lng) {
            const gpsValidation = QRCodeService.validateGPSLocation(
                userLocation,
                { latitude: job.restaurant_lat, longitude: job.restaurant_lng }
            );

            if (!gpsValidation.valid) {
                throw new Error(gpsValidation.error);
            }
        }

        // Check existing check-in status
        const { data: existingCheckins } = await supabase
            .from('checkins')
            .select('id, type, checkin_time')
            .eq('application_id', application.id)
            .order('checkin_time', { ascending: false })
            .limit(1);

        const lastCheckin = existingCheckins?.[0];
        const checkinType = lastCheckin?.type === 'checkin' ? 'checkout' : 'checkin';

        // Get QR code ID
        const { data: qrCodeRecord } = await supabase
            .from('job_qr_codes')
            .select('id')
            .eq('job_id', jobId)
            .single();

        // Record check-in/check-out
        const { error: checkinError } = await supabase
            .from('checkins')
            .insert({
                application_id: application.id,
                type: checkinType,
                checkin_time: new Date().toISOString(),
                latitude: userLocation?.latitude,
                longitude: userLocation?.longitude,
                distance_from_restaurant_meters: userLocation && job.restaurant_lat ?
                    QRCodeService.calculateDistanceMeters(
                        userLocation,
                        { latitude: job.restaurant_lat, longitude: job.restaurant_lng }
                    ) : null,
                is_valid: true,
                qr_code_id: qrCodeRecord?.id,
                scanned_at: new Date().toISOString(),
            });

        if (checkinError) {
            throw new Error('Lỗi ghi nhận check-in');
        }

        // Success
        setResult({
            success: true,
            type: checkinType,
            jobTitle: job.title,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            message: checkinType === 'checkin'
                ? 'Đã check-in thành công! Chúc bạn làm việc vui vẻ.'
                : 'Đã check-out thành công! Cảm ơn bạn đã làm việc.',
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
                {/* GPS Status */}
                <div className={`p-4 rounded-xl flex items-center gap-3 ${gpsStatus === 'success' ? 'bg-success/10 border border-success/20' :
                        gpsStatus === 'error' ? 'bg-warning/10 border border-warning/20' :
                            'bg-muted'
                    }`}>
                    <MapPin className={`w-5 h-5 ${gpsStatus === 'success' ? 'text-success' :
                            gpsStatus === 'error' ? 'text-warning' :
                                'text-muted-foreground'
                        }`} />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                            {gpsStatus === 'success' ? 'Vị trí đã xác định' :
                                gpsStatus === 'error' ? 'Không lấy được vị trí' :
                                    'Đang xác định vị trí...'}
                        </p>
                        {gpsStatus === 'error' && (
                            <p className="text-xs text-muted-foreground">Check-in vẫn hoạt động nhưng không xác minh vị trí</p>
                        )}
                    </div>
                </div>

                {/* Scanner / Result Area */}
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
                            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10 text-success" />
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
                            <h2 className="text-xl font-bold text-foreground mb-2">Không thể check-in</h2>
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

                {/* Instructions */}
                {scanState === 'idle' && (
                    <div className="bg-muted/50 rounded-2xl p-6">
                        <h3 className="font-bold text-foreground mb-3">Hướng dẫn</h3>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>Tìm mã QR tại quầy hoặc poster của cửa hàng</li>
                            <li>Mở camera và đưa vào khung quét</li>
                            <li>Đợi xác nhận check-in thành công</li>
                            <li>Quét lại mã khi hết ca để check-out</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}
