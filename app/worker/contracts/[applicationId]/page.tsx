'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, FileText, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SignContractPage({ params }: { params: { applicationId: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [application, setApplication] = useState<any>(null);

    useEffect(() => {
        fetchContractDetails();
    }, []);

    const fetchContractDetails = async () => {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .select(`
                    *,
                    job:jobs (
                        title, 
                        hourly_rate_vnd, 
                        shift_date, 
                        shift_start_time, 
                        shift_end_time,
                        owner:profiles!jobs_owner_id_fkey(id, restaurant_name, restaurant_address)
                    ),
                    worker:profiles!job_applications_worker_id_fkey(full_name, phone_number)
                `)
                .eq('id', params.applicationId)
                .single();

            if (error) throw error;
            if ((data as any).contract_accepted_at) {
                // Already signed
                router.replace(`/worker/jobs/${data.id}`);
                return;
            }
            setApplication(data);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải thông tin hợp đồng');
            router.push('/worker/jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleSignContract = async () => {
        setSigning(true);
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('job_applications')
                .update({ contract_accepted_at: new Date().toISOString() })
                .eq('id', params.applicationId);

            if (error) throw error;
            
            toast.success('Ký hợp đồng thành công!');
            
            // Optionally dispatch notification to owner
            const { NotificationService } = await import('@/lib/services/notification.service');
            await NotificationService.createNotification({
                user_id: application.job.owner.id,
                title: 'Ứng viên đã ký hợp đồng',
                message: `${application.worker.full_name} đã xác nhận hợp đồng cho ${application.job.title}`,
                type: 'system',
                related_id: params.applicationId
            }).catch(console.error);

            router.push(`/worker/jobs/${params.applicationId}/qr`);
        } catch (error) {
            toast.error('Có lỗi xảy ra khi ký hợp đồng');
        } finally {
            setSigning(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!application) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 px-4 py-4 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold">Ký Hợp Đồng</h1>
                    <p className="text-sm text-slate-500">Xác nhận trước khi nhận việc</p>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-6 mt-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Thoả Thuận Cung Cấp Dịch Vụ</h2>
                        <p className="text-slate-500 text-sm mt-1">Vui lòng đọc kỹ các điều khoản dưới đây</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-100 h-64 overflow-y-auto space-y-4">
                        <p><strong>BÊN A (Bên thuê dịch vụ):</strong> {application.job.owner?.restaurant_name}</p>
                        <p><strong>BÊN B (Người cung cấp dịch vụ):</strong> {application.worker?.full_name}</p>
                        
                        <p><strong>1. Nội dung công việc:</strong></p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Vị trí: {application.job.title}</li>
                            <li>Địa điểm: {application.job.owner?.restaurant_address}</li>
                            <li>Thời gian làm việc: {application.job.shift_start_time} - {application.job.shift_end_time} ({new Date(application.job.shift_date).toLocaleDateString('vi-VN')})</li>
                        </ul>

                        <p><strong>2. Thù lao:</strong></p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Mức lương: {application.job.hourly_rate_vnd.toLocaleString()}đ / giờ</li>
                            <li>Phương thức thanh toán: Chuyển khoản ví Tapy hoặc tài khoản ngân hàng được cung cấp.</li>
                        </ul>

                        <p><strong>3. Cam kết:</strong></p>
                        <p>Bên B cam kết hoàn thành công việc theo đúng thời gian và yêu cầu của Bên A. Nếu vắng mặt không lý do chính đáng sẽ bị phạt theo quy định nền tảng Tapy (trừ điểm tín nhiệm, khoá tải khoản).</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-sm border border-blue-100">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>Bằng việc bấm "Đồng ý & Ký hợp đồng", bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản trên.</p>
                    </div>

                    <Button 
                        onClick={handleSignContract} 
                        disabled={signing}
                        className="w-full text-base py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                        {signing ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                        )}
                        Đồng ý & Ký hợp đồng
                    </Button>
                </div>
            </div>
        </div>
    );
}
