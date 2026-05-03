'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    QrCode,
    ArrowLeft,
    Printer,
    Download
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { QRCodeService } from '@/lib/services/qr-code.service';

export default function OwnerQRManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchOwnerQR();
    }, []);

    const fetchOwnerQR = async () => {
        const supabase = createClient();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { qrDataUrl } = await QRCodeService.generateOwnerQR(user.id);
            setQrDataUrl(qrDataUrl);
        } catch (error) {
            console.error('Fetch QR error:', error);
            toast.error('Lỗi tải mã QR');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!qrDataUrl) return;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = 'nha-hang-qr-checkin.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Đã tải xuống mã QR');
    };

    const handlePrint = () => {
        if (!qrDataUrl) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>In Mã QR</title>
                        <style>
                            body { font-family: sans-serif; text-align: center; padding: 40px; }
                            img { max-width: 400px; width: 100%; border: 4px solid #000; border-radius: 16px; padding: 16px; margin: 20px 0; }
                            h1 { font-size: 32px; color: #111; margin-bottom: 8px;}
                            p { font-size: 18px; color: #666; margin-bottom: 32px; }
                            .footer { font-size: 14px; color: #999; margin-top: 40px;}
                        </style>
                    </head>
                    <body>
                        <h1>QR Check-in Nhà Hàng</h1>
                        <p>Quét mã này bằng ứng dụng Tapi Worker để Check-in/Check-out ca làm việc của bạn.</p>
                        <img src="${qrDataUrl}" onload="window.print();window.onafterprint=function(){window.close()}" />
                        <div class="footer">Tapi - Việc làm bán thời gian</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-lg text-center relative">
                    <Link href="/owner/dashboard" className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground">Mã QR Check-in</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-md space-y-6">
                <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                    <QrCode className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="font-medium text-foreground">Mã QR cố định</p>
                    <p className="text-sm text-muted-foreground">
                        Sử dụng duy nhất một mã QR này cho toàn bộ nhà hàng. Nhân viên quét mã này bằng chức năng Scan QR trong ứng dụng của họ.
                    </p>
                </div>

                <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : qrDataUrl ? (
                        <div className="flex flex-col items-center p-8 space-y-6">
                            <h2 className="text-lg font-bold">Tapi Check-in</h2>
                            <div className="bg-white p-4 rounded-2xl">
                                <img src={qrDataUrl} alt="Owner QR Code" className="w-64 h-64 object-contain" />
                            </div>
                            <div className="flex gap-3 w-full">
                                <Button className="flex-1" variant="outline" onClick={handleDownload}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Tải về
                                </Button>
                                <Button className="flex-1" onClick={handlePrint}>
                                    <Printer className="w-4 h-4 mr-2" />
                                    In QR
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-muted-foreground">
                            Không thể tạo mã QR. Vui lòng thử lại.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
