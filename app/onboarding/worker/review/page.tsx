'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Loader2,
    CheckCircle2,
    User,
    Languages as LanguagesIcon,
    Video as VideoIcon,
    Edit2,
    Eye,
    Calendar,
    GraduationCap,
    Sparkles,
    ChevronRight,
    Award
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const languageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    japanese: { label: 'Tiếng Nhật', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    korean: { label: 'Tiếng Hàn', color: 'text-rose-700', bgColor: 'bg-rose-50' },
    english: { label: 'Tiếng Anh', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
};

export default function WorkerReviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [languages, setLanguages] = useState<any[]>([]);
    const [termsAccepted, setTermsAccepted] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const supabase = createClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const { data: languageData } = await supabase
                .from('language_skills')
                .select('*')
                .eq('user_id', user.id);

            setProfile(profileData);
            setLanguages(languageData || []);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async () => {
        if (!termsAccepted) {
            toast.error('Vui lòng đồng ý với điều khoản');
            return;
        }

        setLoading(true);
        const supabase = createClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    can_apply: true,
                    profile_completion_percentage: 100,
                    reliability_score: 100
                })
                .eq('id', user.id);

            toast.success('Chào mừng bạn đến với Tapy! 🎉');
            router.push('/worker/dashboard');
        } catch (error: any) {
            console.error('Submit error:', error);
            toast.error('Lỗi hoàn tất đăng ký');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-2xl mx-auto py-8">
                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-foreground">Bước 4/4</span>
                        <span className="text-sm text-success flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Hoàn tất
                        </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success w-full transition-all duration-300"></div>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-success/10 rounded-xl">
                            <CheckCircle2 className="w-6 h-6 text-success" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Xem lại thông tin
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Kiểm tra lại thông tin trước khi hoàn tất đăng ký
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 className="font-bold flex items-center gap-2 text-foreground">
                                <User className="w-5 h-5 text-primary" />
                                Thông tin cá nhân
                            </h3>
                            <Link href="/onboarding/worker/profile">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                    <Edit2 className="w-4 h-4 mr-1" />
                                    Chỉnh sửa
                                </Button>
                            </Link>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-4 items-start">
                                {profile?.avatar_url ? (
                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-primary/20">
                                        <Image
                                            src={profile.avatar_url}
                                            alt="Avatar"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                        <User className="w-10 h-10 text-primary" />
                                    </div>
                                )}
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-xl font-bold text-foreground">{profile?.full_name || 'Chưa cập nhật'}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        {profile?.date_of_birth || 'Chưa cập nhật ngày sinh'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <GraduationCap className="w-4 h-4" />
                                        {profile?.university_name || 'Chưa cập nhật trường'}
                                    </div>
                                </div>
                            </div>
                            {profile?.bio && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                                        {`"${profile.bio}"`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Languages Section */}
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 className="font-bold flex items-center gap-2 text-foreground">
                                <LanguagesIcon className="w-5 h-5 text-primary" />
                                Kỹ năng ngôn ngữ
                            </h3>
                            <Link href="/onboarding/worker/languages">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                    <Edit2 className="w-4 h-4 mr-1" />
                                    Chỉnh sửa
                                </Button>
                            </Link>
                        </div>
                        <div className="p-6">
                            {languages.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {languages.map((skill, i) => {
                                        const config = languageConfig[skill.language] || languageConfig.japanese;
                                        return (
                                            <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${config.bgColor} border border-${config.color.replace('text-', '')}/20`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 ${config.bgColor} rounded-lg`}>
                                                        <LanguagesIcon className={`w-4 h-4 ${config.color}`} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${config.color}`}>
                                                            {config.label}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground uppercase font-semibold">
                                                            {skill.level}
                                                        </p>
                                                    </div>
                                                </div>
                                                {skill.certificate_url && (
                                                    <CheckCircle2 className="w-5 h-5 text-success" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Chưa thêm kỹ năng ngôn ngữ
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Video Section */}
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 className="font-bold flex items-center gap-2 text-foreground">
                                <VideoIcon className="w-5 h-5 text-primary" />
                                Video giới thiệu
                            </h3>
                            <Link href="/onboarding/worker/video">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                    <Edit2 className="w-4 h-4 mr-1" />
                                    Chỉnh sửa
                                </Button>
                            </Link>
                        </div>
                        <div className="p-6">
                            {profile?.intro_video_url ? (
                                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                                    <video
                                        src={profile.intro_video_url}
                                        controls
                                        className="w-full h-full object-contain"
                                        preload="metadata"
                                    >
                                        Trình duyệt của bạn không hỗ trợ video.
                                    </video>
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
                                    <VideoIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Chưa upload video giới thiệu</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Success Message */}
                    <div className="bg-gradient-to-r from-success/10 to-primary/10 border border-success/20 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-success/20 rounded-xl">
                                <Sparkles className="w-6 h-6 text-success" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground mb-1">Bạn đã sẵn sàng!</h4>
                                <p className="text-sm text-muted-foreground">
                                    Hoàn tất đăng ký để bắt đầu tìm kiếm công việc phù hợp với kỹ năng của bạn
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="bg-muted/50 border border-border rounded-2xl p-4">
                        <label className="flex gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-1 w-5 h-5 text-primary border-border rounded focus:ring-primary accent-primary"
                            />
                            <span className="text-sm text-foreground">
                                Tôi đồng ý với <Link href="/terms" className="text-primary hover:underline">Điều khoản dịch vụ</Link> và <Link href="/privacy" className="text-primary hover:underline">Chính sách bảo mật</Link>
                            </span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 sticky bottom-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/onboarding/worker/video')}
                            className="flex-1 h-12"
                        >
                            Quay lại
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !termsAccepted}
                            variant="default"
                            className="flex-1 h-14 text-base font-bold bg-success hover:bg-success/90 shadow-lg hover:shadow-xl transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    Hoàn tất & Bắt đầu
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
