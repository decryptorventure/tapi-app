'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    QrCode,
    ArrowLeft,
    RefreshCw,
    Clock,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Job {
    id: string;
    title: string;
    shift_date: string;
    shift_start_time: string;
    shift_end_time: string;
}

export default function OwnerQRManagementPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <QRManagementContent />
        </Suspense>
    );
}

function QRManagementContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('jobId');

    const [userId, setUserId] = useState<string | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [loadingJob, setLoadingJob] = useState(true);
    const [loading, setLoading] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);

    // Load user + job info
    useEffect(() => {
        if (!jobId) {
            setLoadingJob(false);
            return;
        }

        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) { router.push('/login'); return; }
            setUserId(user.id);

            const { data } = await supabase
                .from('jobs')
                .select('id, title, shift_date, shift_start_time, shift_end_time')
                .eq('id', jobId)
                .eq('owner_id', user.id)
                .single();

            setJob(data);
            setLoadingJob(false);
        });
    }, [jobId, router]);

    const generateQR = useCallback(async () => {
        if (!userId || !jobId) return;
        setLoading(true);
        setQrDataUrl(null);
        setExpiresAt(null);

        try {
            const res = await fetch('/api/qr/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ownerId: userId, jobId }),
            });
            const data = await res.json();
            if (!res.ok || !data.qrDataUrl) throw new Error(data.error || 'Không thể tạo mã QR');

            setQrDataUrl(data.qrDataUrl);
            setExpiresAt(new Date(data.expiresAt));
            toast.success('Đã tạo mã QR mới (hiệu lực 5 phút)');
        } catch (err: any) {
            toast.error(err.message || 'Lỗi tạo mã QR');
        } finally {
            setLoading(false);
        }
    }, [userId, jobId]);

    // Countdown
    useEffect(() => {
        if (!expiresAt) return;
        const tick = () => setSecondsLeft(Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const isExpired = expiresAt ? expiresAt < new Date() : false;
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const isWarning = secondsLeft <= 60 && secondsLeft > 0;

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-lg text-center relative">
                    <Link href="/owner/shifts" className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground">Mã QR Check-in</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-md space-y-6">
                {/* Missing jobId */}
                {!jobId && (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-center">
                        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                        <p className="font-medium text-foreground">Không có thông tin ca làm việc</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Vui lòng vào danh sách ca làm việc và nhấn nút QR trên ca cụ thể.
                        </p>
                        <Link href="/owner/shifts" className="mt-4 inline-block">
                            <Button variant="outline">Về danh sách ca</Button>
                        </Link>
                    </div>
                )}

                {jobId && (
                    <>
                        {/* Job info */}
                        {loadingJob ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : job ? (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <QrCode className="w-8 h-8 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-foreground">{job.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(job.shift_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {job.shift_start_time.slice(0, 5)} – {job.shift_end_time.slice(0, 5)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Mã QR ngẫu nhiên • Hiệu lực 5 phút • 1 lần dùng
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center text-sm text-destructive">
                                Không tìm thấy ca làm việc này.
                            </div>
                        )}

                        {/* QR Card */}
                        {job && (
                            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                                {loading ? (
                                    <div className="p-12 flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground">Đang tạo mã QR...</p>
                                    </div>
                                ) : qrDataUrl && !isExpired ? (
                                    <div className="flex flex-col items-center p-8 space-y-5">
                                        <h2 className="text-lg font-bold">Scan QR Code</h2>
                                        <div className="bg-white p-4 rounded-2xl shadow-inner">
                                            <img src={qrDataUrl} alt="QR Check-in" className="w-64 h-64 object-contain" />
                                        </div>
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                                            isWarning ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                                        }`}>
                                            {isWarning ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            <span>Hết hạn sau {minutes}:{String(seconds).padStart(2, '0')}</span>
                                        </div>
                                        <Button className="w-full" onClick={generateQR}>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Tạo mã mới
                                        </Button>
                                    </div>
                                ) : qrDataUrl && isExpired ? (
                                    <div className="p-12 flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-10 h-10 text-destructive" />
                                        </div>
                                        <p className="font-semibold text-foreground">Mã QR đã hết hạn</p>
                                        <Button size="lg" className="w-full" onClick={generateQR}>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Tạo mã mới
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-12 flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                                            <QrCode className="w-10 h-10 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-muted-foreground text-sm text-center">
                                            Nhấn nút bên dưới để tạo mã QR cho ca này
                                        </p>
                                        <Button size="lg" className="w-full" onClick={generateQR}>
                                            <QrCode className="w-5 h-5 mr-2" />
                                            Tạo mã QR
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
