'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Video, X, Upload, Play, CheckCircle2 } from 'lucide-react';

export default function WorkerVideoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createUntypedClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCheckingAuth(false);
        };
        checkAuth();
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                toast.error('Video quá lớn. Giới hạn 50MB.');
                return;
            }
            if (!file.type.startsWith('video/')) {
                toast.error('Vui lòng chọn tệp video.');
                return;
            }
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const removeVideo = () => {
        setVideoFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoFile) {
            // Optional in some cases, but roadmap says Step 3 is Intro Video
            // Let's make it optional for now to not block flow, but show warning
            router.push('/onboarding/worker/review');
            return;
        }

        setLoading(true);
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const fileExt = videoFile.name.split('.').pop();
            const filePath = `videos/${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('videos')
                .upload(filePath, videoFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('videos')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    intro_video_url: data.publicUrl,
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            toast.success('Video đã được tải lên!');
            router.push('/onboarding/worker/review');
        } catch (error: any) {
            console.error('Video upload error:', error);
            toast.error(error.message || 'Lỗi tải video');
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="max-w-2xl mx-auto py-8">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex gap-1">
                            <div className="w-8 h-2 bg-blue-600 rounded-full" />
                            <div className="w-8 h-2 bg-blue-600 rounded-full" />
                            <div className="w-8 h-2 bg-blue-600 rounded-full" />
                            <div className="w-8 h-2 bg-slate-200 rounded-full" />
                        </div>
                        <span className="text-sm text-slate-500">Bước 3/4</span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Video className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Video giới thiệu
                            </h1>
                            <p className="text-slate-600">
                                Gây ấn tượng với nhà tuyển dụng bằng một video ngắn 30-60 giây
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    {!previewUrl ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="video/*"
                                className="hidden"
                            />
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-2">
                                Tải lên video của bạn
                            </h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto">
                                Kéo thả hoặc nhấp để chọn tệp video. Hỗ trợ MP4, MOV, WebM. Tối đa 50MB.
                            </p>
                        </div>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-lg">
                            <video
                                src={previewUrl}
                                controls
                                className="max-h-full max-w-full"
                            />
                            <button
                                onClick={removeVideo}
                                className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-colors z-10"
                            >
                                <X className="w-5 h-5 text-slate-700" />
                            </button>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h4 className="flex items-center gap-2 font-medium text-blue-900 mb-2">
                            <Play className="w-4 h-4" />
                            Mẹo quay video:
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Mỉm cười và chào hỏi thân thiện</li>
                            <li>Giới thiệu tên và kinh nghiệm làm việc (nếu có)</li>
                            <li>Nói về trình độ ngôn ngữ của bạn (Nhật/Hàn/Anh)</li>
                            <li>Đảm bảo đủ ánh sáng và âm thanh rõ ràng</li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/onboarding/worker/languages')}
                            className="flex-1"
                        >
                            Quay lại
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang tải lên...
                                </>
                            ) : videoFile ? (
                                'Tiếp tục'
                            ) : (
                                'Bỏ qua bước này'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
