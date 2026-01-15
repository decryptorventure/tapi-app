'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    QrCode,
    Download,
    Copy,
    Check,
    ArrowLeft,
    MapPin,
    Calendar,
    Clock,
    Users,
    RefreshCw,
    Printer
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { QRCodeService } from '@/lib/services/qr-code.service';

interface JobData {
    id: string;
    title: string;
    restaurant_name: string;
    location_name: string;
    shift_date: string;
    shift_start_time: string;
    shift_end_time: string;
    max_workers: number;
    current_workers: number;
}

interface QRData {
    id: string;
    qr_data: string;
    secret_key: string;
    created_at: string;
}

export default function OwnerJobQRPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [job, setJob] = useState<JobData | null>(null);
    const [qrCode, setQrCode] = useState<QRData | null>(null);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, [jobId]);

    const fetchData = async () => {
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch job data
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('id, title, restaurant_name, location_name, shift_date, shift_start_time, shift_end_time, max_workers, current_workers')
                .eq('id', jobId)
                .eq('owner_id', user.id)
                .single();

            if (jobError || !jobData) {
                toast.error('Không tìm thấy job');
                router.push('/owner/jobs');
                return;
            }

            setJob(jobData);

            // Fetch existing QR or generate new one
            const { data: existingQR } = await supabase
                .from('job_qr_codes')
                .select('*')
                .eq('job_id', jobId)
                .single();

            if (existingQR) {
                setQrCode(existingQR);
                // Regenerate QR image from stored data
                await regenerateQRImage(existingQR.qr_data);
            } else {
                // Generate new QR
                await generateNewQR(jobId, user.id);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const generateNewQR = async (jobId: string, ownerId: string) => {
        setGenerating(true);
        const supabase = createUntypedClient();

        try {
            const { qrDataUrl, qrData, secretKey } = await QRCodeService.generateJobQR(jobId, ownerId);

            // Save to database
            const { data: savedQR, error } = await supabase
                .from('job_qr_codes')
                .upsert({
                    job_id: jobId,
                    qr_data: qrData,
                    secret_key: secretKey,
                    is_active: true,
                }, { onConflict: 'job_id' })
                .select()
                .single();

            if (error) throw error;

            setQrCode(savedQR);
            setQrImage(qrDataUrl);
            toast.success('Đã tạo mã QR');
        } catch (error) {
            console.error('Generate QR error:', error);
            toast.error('Không thể tạo mã QR');
        } finally {
            setGenerating(false);
        }
    };

    const regenerateQRImage = async (qrData: string) => {
        try {
            // We need to regenerate the image from stored data
            const QRCodeLib = await import('qrcode');
            const qrImage = await QRCodeLib.default.toDataURL(qrData, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                width: 400,
                margin: 2,
                color: {
                    dark: '#1e293b',
                    light: '#ffffff',
                },
            });
            setQrImage(qrImage);
        } catch (error) {
            console.error('Regenerate QR image error:', error);
        }
    };

    const handleRefreshQR = async () => {
        const supabase = createUntypedClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await generateNewQR(jobId, user.id);
        }
    };

    const handleCopyCode = async () => {
        if (qrCode) {
            const backupCode = qrCode.secret_key.substring(0, 8).toUpperCase();
            await navigator.clipboard.writeText(backupCode);
            setCopied(true);
            toast.success('Đã copy mã backup');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadQR = () => {
        if (qrImage) {
            const link = document.createElement('a');
            link.download = `tapy-qr-${job?.title || 'job'}.png`;
            link.href = qrImage;
            link.click();
            toast.success('Đã tải QR code');
        }
    };

    const handlePrintPoster = () => {
        if (!qrRef.current) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Check-in - ${job?.title}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 40px;
                        box-sizing: border-box;
                    }
                    .container {
                        text-align: center;
                        max-width: 500px;
                    }
                    .logo {
                        font-size: 32px;
                        font-weight: bold;
                        color: #3B82F6;
                        margin-bottom: 20px;
                    }
                    h1 {
                        font-size: 28px;
                        margin-bottom: 10px;
                        color: #1e293b;
                    }
                    .restaurant {
                        font-size: 18px;
                        color: #64748b;
                        margin-bottom: 30px;
                    }
                    .qr-container {
                        background: white;
                        padding: 20px;
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        display: inline-block;
                        margin-bottom: 30px;
                    }
                    .qr-container img {
                        width: 300px;
                        height: 300px;
                    }
                    .instructions {
                        font-size: 16px;
                        color: #475569;
                        line-height: 1.6;
                    }
                    .backup-code {
                        margin-top: 20px;
                        padding: 15px;
                        background: #f1f5f9;
                        border-radius: 8px;
                        font-family: monospace;
                        font-size: 20px;
                        letter-spacing: 2px;
                    }
                    @media print {
                        body { padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">Tapy</div>
                    <h1>${job?.title}</h1>
                    <p class="restaurant">${job?.restaurant_name}</p>
                    <div class="qr-container">
                        <img src="${qrImage}" alt="QR Code" />
                    </div>
                    <p class="instructions">
                        📱 Quét mã QR này để Check-in<br>
                        Mã backup: <strong>${qrCode?.secret_key.substring(0, 8).toUpperCase()}</strong>
                    </p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-primary pt-8 pb-16 px-4">
                <div className="max-w-2xl mx-auto">
                    <Link href={`/owner/jobs/${jobId}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">QR Check-in</h1>
                            <p className="text-white/70 text-sm">Worker quét mã này để check-in</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-8 space-y-6">
                {/* QR Code Card */}
                <div ref={qrRef} className="bg-card rounded-2xl border border-border p-6 text-center">
                    {qrImage ? (
                        <div className="inline-block bg-white p-4 rounded-xl shadow-sm mb-4">
                            <img
                                src={qrImage}
                                alt="QR Code"
                                className="w-64 h-64 mx-auto"
                            />
                        </div>
                    ) : (
                        <div className="w-64 h-64 mx-auto bg-muted rounded-xl flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    <h2 className="text-xl font-bold text-foreground mb-1">{job?.title}</h2>
                    <p className="text-muted-foreground text-sm mb-4">{job?.restaurant_name}</p>

                    {/* Backup Code */}
                    {qrCode && (
                        <div className="bg-muted rounded-lg p-3 mb-4">
                            <p className="text-xs text-muted-foreground mb-1">Mã backup (nếu không quét được)</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="font-mono text-lg font-bold tracking-wider">
                                    {qrCode.secret_key.substring(0, 8).toUpperCase()}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleCopyCode}
                                >
                                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                            <Download className="w-4 h-4 mr-1" />
                            Tải ảnh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrintPoster}>
                            <Printer className="w-4 h-4 mr-1" />
                            In poster
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefreshQR}
                            disabled={generating}
                        >
                            <RefreshCw className={`w-4 h-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
                            Tạo mới
                        </Button>
                    </div>
                </div>

                {/* Job Info Card */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-bold text-foreground mb-4">Thông tin ca làm</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{job?.location_name || job?.restaurant_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">
                                {job?.shift_date && format(new Date(job.shift_date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{job?.shift_start_time} - {job?.shift_end_time}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">
                                {job?.current_workers || 0}/{job?.max_workers} workers
                            </span>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                    <h3 className="font-bold text-foreground mb-3">Hướng dẫn sử dụng</h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>In poster hoặc hiển thị mã QR tại quầy</li>
                        <li>Worker mở app Tapy và chọn "Scan QR"</li>
                        <li>Worker quét mã để check-in khi đến ca</li>
                        <li>Worker quét lại mã khi check-out</li>
                        <li>Nếu không quét được, nhập mã backup thủ công</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
