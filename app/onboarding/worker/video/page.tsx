'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Loader2,
    Video as VideoIcon,
    X,
    Upload,
    ChevronRight,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { StorageService } from '@/lib/services/storage.service';

export default function WorkerVideoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Use StorageService config for validation
            const config = StorageService.getBucketConfig('videos');
            if (file.size > config.maxSize) {
                toast.error(`Video quá lớn (tối đa ${config.maxSize / (1024 * 1024)}MB)`);
                return;
            }
            if (!file.type.startsWith('video/')) {
                toast.error('Vui lòng chọn file video');
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

    const handleSubmit = async () => {
        if (!videoFile) {
            router.push('/onboarding/worker/review');
            return;
        }

        setLoading(true);
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Use StorageService with retry logic
            const uploadResult = await StorageService.uploadWithRetry(
                'videos',
                videoFile,
                user.id
            );

            if (!uploadResult.success) {
                toast.error(uploadResult.error?.message || 'Lỗi upload video');
                setLoading(false);
                return;
            }

            // Update profile with video URL
            await supabase
                .from('profiles')
                .update({ intro_video_url: uploadResult.url })
                .eq('id', user.id);

            toast.success('Video đã được tải lên!');
            router.push('/onboarding/worker/review');
        } catch (error: any) {
            console.error('Video upload error:', error);
            toast.error('Lỗi upload video. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-2xl mx-auto py-8">
                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-foreground">Bước 3/4</span>
                        <span className="text-sm text-muted-foreground">Video giới thiệu</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4 transition-all duration-300"></div>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <VideoIcon className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Giới thiệu bản thân
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Một video ngắn giúp nhà tuyển dụng hiểu hơn về bạn (không bắt buộc)
                    </p>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
                    {!previewUrl ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-2xl p-16 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="video/*"
                                className="hidden"
                            />
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">
                                Click để upload video
                            </h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                MP4, MOV, WebM • Tối đa 50MB • Thời lượng 30-60 giây
                            </p>
                        </div>
                    ) : (
                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-xl">
                            <video
                                src={previewUrl}
                                controls
                                className="w-full h-full object-contain"
                            />
                            <button
                                onClick={removeVideo}
                                className="absolute top-4 right-4 bg-card hover:bg-destructive/90 p-2.5 rounded-xl shadow-lg transition-all text-foreground hover:text-destructive-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <h4 className="flex items-center gap-2 font-bold text-foreground mb-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Mẹo để video tốt hơn
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                <span>Nói rõ tên, trường, và ngôn ngữ bạn biết</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                <span>Ghi hình nơi sáng sủa, âm thanh rõ ràng</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                <span>Chia sẻ kinh nghiệm làm việc nếu có</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                <span>Mỉm cười và tự tin!</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/onboarding/worker/languages')}
                            className="flex-1 h-12"
                        >
                            Quay lại
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            variant="default"
                            className="flex-1 h-12 bg-primary hover:bg-primary/90"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Đang tải lên...
                                </>
                            ) : videoFile ? (
                                <>
                                    Tiếp tục
                                    <ChevronRight className="h-5 w-5 ml-2" />
                                </>
                            ) : (
                                <>
                                    Bỏ qua bước này
                                    <ChevronRight className="h-5 w-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
