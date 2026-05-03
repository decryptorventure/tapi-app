'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { QRCodeService } from '@/lib/services/qr-code.service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    QrCode,
    Loader2,
    Camera,
    CheckCircle2,
    XCircle,
    User,
    Clock,
    RefreshCw
} from 'lucide-react';

interface CheckInResult {
    success: boolean;
    workerName?: string;
    jobTitle?: string;
    message: string;
    type?: 'checkin' | 'checkout';
}

export default function OwnerScanQRPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<CheckInResult | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const scannerRef = useRef<any>(null);
    const [lastScanTime, setLastScanTime] = useState<number>(0);
    const SCAN_COOLDOWN_MS = 2000;

    useEffect(() => {
        checkAuth();
        return () => {
            stopScanner();
        };
    }, []);

    const checkAuth = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'owner') {
            router.push('/');
            return;
        }

        setLoading(false);
    };

    const startScanner = async () => {
        setScanning(true);
        setCameraError(null);
        setResult(null);

        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                async (decodedText) => {
                    await handleQRCode(decodedText);
                    stopScanner();
                },
                () => { }
            );
        } catch (error: any) {
            console.error('Camera error:', error);
            setCameraError(error.message || 'Không thể truy cập camera');
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (e) {
                // Ignore
            }
        }
        setScanning(false);
    };

    const handleQRCode = async (qrText: string) => {
        const now = Date.now();
        if (now - lastScanTime < SCAN_COOLDOWN_MS) {
            toast.error('Vui lòng chờ 2 giây trước khi quét tiếp');
            return;
        }
        setLastScanTime(now);

        setProcessing(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Try parsing the QR data
            let qrData: any;
            try {
                qrData = JSON.parse(qrText);
            } catch {
                setResult({
                    success: false,
                    message: 'Mã QR không hợp lệ - định dạng sai',
                });
                return;
            }

            // NEW FLOW: Owner's Job QR - owner shouldn't scan their own QR
            if (qrData.version === 2 || qrData.version === 3) {
                setResult({
                    success: false,
                    message: 'Đây là mã QR của bạn. Worker cần quét mã này, không phải bạn.',
                });
                return;
            }

            // Legacy QR: Worker-generated QR
            if (!qrData.application_id) {
                setResult({
                    success: false,
                    message: 'Mã QR không chứa thông tin worker',
                });
                return;
            }

            // Validate signature for legacy QR
            const validation = QRCodeService.validateQRCode(qrText);
            if (!validation.valid) {
                setResult({
                    success: false,
                    message: validation.error || 'Mã QR không hợp lệ',
                });
                return;
            }

            const validatedData = validation.data!;

            // Verify application belongs to owner's job
            const { data: app, error: appError } = await supabase
                .from('job_applications')
                .select(`
                    id, status, worker_id, job_id,
                    job:jobs(id, title, owner_id)
                `)
                .eq('id', validatedData.application_id)
                .single();

            if (appError || !app) {
                setResult({
                    success: false,
                    message: 'Đơn ứng tuyển không tồn tại',
                });
                return;
            }

            const job = app.job as any;

            // Check if job belongs to owner
            if (job.owner_id !== user.id) {
                setResult({
                    success: false,
                    message: 'Công việc này không thuộc nhà hàng của bạn',
                });
                return;
            }

            // Determine check-in or check-out
            let checkinType: 'checkin' | 'checkout';

            if (app.status === 'approved') {
                checkinType = 'checkin';
            } else if (app.status === 'working') {
                const { data: existingCheckout } = await supabase
                    .from('checkins')
                    .select('id')
                    .eq('application_id', app.id)
                    .eq('type', 'checkout')
                    .limit(1);

                if (existingCheckout && existingCheckout.length > 0) {
                    setResult({
                        success: false,
                        message: 'Worker đã check-out trước đó',
                    });
                    return;
                }
                checkinType = 'checkout';
            } else {
                setResult({
                    success: false,
                    message: `Trạng thái đơn không hợp lệ: ${app.status}`,
                });
                return;
            }

            const { data: worker } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', app.worker_id)
                .single();

            // Record check-in/out
            const { error: checkinError } = await supabase
                .from('checkins')
                .insert({
                    application_id: app.id,
                    type: checkinType,
                    checkin_time: new Date().toISOString(),
                    is_valid: true,
                    scanned_at: new Date().toISOString(),
                });

            if (checkinError) {
                console.error('Check-in error:', checkinError);
                setResult({
                    success: false,
                    message: 'Lỗi ghi nhận: ' + checkinError.message,
                });
                return;
            }

            if (checkinType === 'checkin') {
                await supabase
                    .from('job_applications')
                    .update({ status: 'working' })
                    .eq('id', app.id);
            }

            setResult({
                success: true,
                workerName: worker?.full_name || 'Worker',
                jobTitle: job.title,
                message: checkinType === 'checkin' ? 'Check-in thành công!' : 'Check-out thành công!',
                type: checkinType,
            });

            toast.success(checkinType === 'checkin' ? 'Check-in thành công!' : 'Check-out thành công!');

        } catch (error: any) {
            console.error('QR processing error:', error);
            setResult({
                success: false,
                message: error.message || 'Lỗi xử lý mã QR',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleManualInput = () => {
        const code = prompt('Nhập mã check-in thủ công:');
        if (code) {
            handleQRCode(code);
        }
    };

    const resetScanner = () => {
        setResult(null);
        setCameraError(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-lg">
                    <div className="flex items-center gap-4">
                        <Link href="/owner/dashboard" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-lg">
                                <QrCode className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-lg font-bold text-white">Quét QR Worker</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-lg">
                {result && (
                    <div className={`mb-6 rounded-xl p-6 text-center ${result.success
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                        }`}>
                        {result.success ? (
                            <>
                                <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                                <h2 className="text-xl font-bold mb-2">
                                    {result.type === 'checkout' ? 'Check-out Thành Công!' : 'Check-in Thành Công!'}
                                </h2>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <User className="w-5 h-5" />
                                    <span className="text-lg">{result.workerName}</span>
                                </div>
                                <p className="text-sm opacity-90">{result.jobTitle}</p>
                                <div className="flex items-center justify-center gap-2 mt-4 text-sm opacity-80">
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date().toLocaleTimeString('vi-VN')}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-16 h-16 mx-auto mb-4" />
                                <h2 className="text-xl font-bold mb-2">Thất Bại</h2>
                                <p>{result.message}</p>
                            </>
                        )}

                        <Button
                            onClick={resetScanner}
                            className="mt-6 bg-white/20 hover:bg-white/30"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Quét tiếp
                        </Button>
                    </div>
                )}

                {!result && (
                    <>
                        <div className="bg-slate-700 rounded-xl overflow-hidden mb-6">
                            {scanning ? (
                                <div id="qr-reader" className="aspect-square" />
                            ) : (
                                <div className="aspect-square flex items-center justify-center bg-slate-800">
                                    {cameraError ? (
                                        <div className="text-center p-6">
                                            <XCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
                                            <p className="text-red-300 text-sm">{cameraError}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center p-6">
                                            <Camera className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                                            <p className="text-slate-400">Nhấn nút bên dưới để bắt đầu quét</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {!scanning ? (
                                <Button
                                    onClick={startScanner}
                                    className="w-full py-6 text-lg"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    ) : (
                                        <Camera className="w-5 h-5 mr-2" />
                                    )}
                                    Bắt đầu quét QR
                                </Button>
                            ) : (
                                <Button
                                    onClick={stopScanner}
                                    variant="outline"
                                    className="w-full py-6 text-lg border-slate-600 text-white"
                                >
                                    Dừng quét
                                </Button>
                            )}

                            <Button
                                onClick={handleManualInput}
                                variant="ghost"
                                className="w-full text-slate-400"
                            >
                                Nhập mã thủ công
                            </Button>
                        </div>
                    </>
                )}

                <div className="mt-8 bg-slate-700/50 rounded-xl p-4">
                    <h4 className="font-medium text-white mb-3">📋 Hướng dẫn</h4>
                    <ul className="text-sm text-slate-300 space-y-2">
                        <li>1. Yêu cầu nhân viên xuất trình mã QR trên app</li>
                        <li>2. Nhấn &quot;Bắt đầu quét&quot; và hướng camera vào mã QR</li>
                        <li>3. Hệ thống sẽ tự động ghi nhận check-in/check-out</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
