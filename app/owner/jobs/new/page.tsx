'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Loader2,
    ArrowLeft,
    Briefcase,
    FileText,
    Calendar,
    Clock,
    DollarSign,
    Star,
    Languages,
    Users,
    Shirt,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { LanguageType, LanguageLevel } from '@/types/database.types';

const languageLevels: Record<LanguageType, { value: LanguageLevel; label: string }[]> = {
    japanese: [
        { value: 'n5', label: 'N5 - Sơ cấp' },
        { value: 'n4', label: 'N4 - Sơ trung' },
        { value: 'n3', label: 'N3 - Trung cấp' },
        { value: 'n2', label: 'N2 - Trung cao' },
        { value: 'n1', label: 'N1 - Cao cấp' },
    ],
    korean: [
        { value: 'topik_1', label: 'TOPIK 1' },
        { value: 'topik_2', label: 'TOPIK 2' },
        { value: 'topik_3', label: 'TOPIK 3' },
        { value: 'topik_4', label: 'TOPIK 4' },
        { value: 'topik_5', label: 'TOPIK 5' },
        { value: 'topik_6', label: 'TOPIK 6' },
    ],
    english: [
        { value: 'a1', label: 'A1 - Beginner' },
        { value: 'a2', label: 'A2 - Elementary' },
        { value: 'b1', label: 'B1 - Intermediate' },
        { value: 'b2', label: 'B2 - Upper Intermediate' },
        { value: 'c1', label: 'C1 - Advanced' },
        { value: 'c2', label: 'C2 - Proficiency' },
    ],
};

export default function NewJobPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        shiftDate: '',
        shiftStartTime: '',
        shiftEndTime: '',
        hourlyRateVnd: '',
        requiredLanguage: '' as LanguageType | '',
        requiredLanguageLevel: '' as LanguageLevel | '',
        minReliabilityScore: 90,
        dressCode: '',
        maxWorkers: 1,
    });

    // Auth check on mount
    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createUntypedClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // Check if owner
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'owner') {
                router.push('/');
                return;
            }

            setIsAuthed(true);
        };
        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Validate
            if (!formData.requiredLanguage || !formData.requiredLanguageLevel) {
                throw new Error('Vui lòng chọn ngôn ngữ yêu cầu');
            }

            // Create job
            const { data: job, error } = await supabase
                .from('jobs')
                .insert({
                    owner_id: user.id,
                    title: formData.title,
                    description: formData.description || null,
                    shift_date: formData.shiftDate,
                    shift_start_time: formData.shiftStartTime,
                    shift_end_time: formData.shiftEndTime,
                    hourly_rate_vnd: parseInt(formData.hourlyRateVnd),
                    required_language: formData.requiredLanguage,
                    required_language_level: formData.requiredLanguageLevel,
                    min_reliability_score: formData.minReliabilityScore,
                    dress_code: formData.dressCode || null,
                    max_workers: formData.maxWorkers,
                    status: 'open',
                    current_workers: 0,
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Tin tuyển dụng đã được đăng!');
            router.push('/owner/jobs');
        } catch (error: any) {
            console.error('Job creation error:', error);
            toast.error(error.message || 'Lỗi tạo tin tuyển dụng');
        } finally {
            setLoading(false);
        }
    };

    const availableLevels = formData.requiredLanguage
        ? languageLevels[formData.requiredLanguage]
        : [];

    // Calculate form completion percentage
    const requiredFields = [
        formData.title,
        formData.shiftDate,
        formData.shiftStartTime,
        formData.shiftEndTime,
        formData.hourlyRateVnd,
        formData.requiredLanguage,
        formData.requiredLanguageLevel,
    ];
    const filledFields = requiredFields.filter(field => field !== '').length;
    const completionPercent = Math.round((filledFields / requiredFields.length) * 100);

    // Show loading spinner until auth check completes
    if (!isAuthed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-cta" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/80">
                <div className="container mx-auto px-4 py-4 max-w-3xl">
                    <div className="flex items-center gap-4">
                        <Link href="/owner/jobs" className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Link>
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-cta/10 rounded-lg">
                                <Briefcase className="w-5 h-5 text-cta" />
                            </div>
                            <h1 className="text-xl font-bold text-foreground">Đăng tin tuyển dụng</h1>
                        </div>
                        {/* Progress Indicator */}
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                                {completionPercent}%
                            </div>
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cta to-cta/80 transition-all duration-300"
                                    style={{ width: `${completionPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* SECTION 1: Basic Information */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Thông tin cơ bản</h2>
                                <p className="text-sm text-muted-foreground">Chi tiết về công việc</p>
                            </div>
                        </div>

                        {/* Job Title */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Tiêu đề công việc <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                                placeholder="VD: Nhân viên phục vụ ca tối"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Mô tả công việc
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground resize-none"
                                placeholder="Mô tả chi tiết công việc, yêu cầu, quyền lợi..."
                            />
                            <p className="text-xs text-muted-foreground mt-1.5">
                                Gợi ý: Mô tả nhiệm vụ, môi trường làm việc, quyền lợi...
                            </p>
                        </div>
                    </div>

                    {/* SECTION 2: Schedule */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <div className="p-2 bg-success/10 rounded-xl">
                                <Calendar className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Lịch làm việc</h2>
                                <p className="text-sm text-muted-foreground">Ngày giờ ca làm</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Ngày làm <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.shiftDate}
                                        onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Giờ bắt đầu <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="time"
                                        required
                                        value={formData.shiftStartTime}
                                        onChange={(e) => setFormData({ ...formData, shiftStartTime: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Giờ kết thúc <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="time"
                                        required
                                        value={formData.shiftEndTime}
                                        onChange={(e) => setFormData({ ...formData, shiftEndTime: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Requirements */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <div className="p-2 bg-warning/10 rounded-xl">
                                <Star className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Yêu cầu ứng viên</h2>
                                <p className="text-sm text-muted-foreground">Kỹ năng và điều kiện</p>
                            </div>
                        </div>

                        {/* Language Requirements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Ngôn ngữ yêu cầu <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                                    <select
                                        required
                                        value={formData.requiredLanguage}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            requiredLanguage: e.target.value as LanguageType,
                                            requiredLanguageLevel: '' // Reset level when language changes
                                        })}
                                        className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground appearance-none"
                                    >
                                        <option value="">Chọn ngôn ngữ</option>
                                        <option value="japanese">Tiếng Nhật</option>
                                        <option value="korean">Tiếng Hàn</option>
                                        <option value="english">Tiếng Anh</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Trình độ tối thiểu <span className="text-destructive">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.requiredLanguageLevel}
                                    onChange={(e) => setFormData({ ...formData, requiredLanguageLevel: e.target.value as LanguageLevel })}
                                    disabled={!formData.requiredLanguage}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                >
                                    <option value="">Chọn trình độ</option>
                                    {availableLevels.map((level) => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Reliability Score & Max Workers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Điểm tin cậy tối thiểu
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={formData.minReliabilityScore}
                                    onChange={(e) => setFormData({ ...formData, minReliabilityScore: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>0</span>
                                    <span className="font-bold text-primary">{formData.minReliabilityScore} điểm</span>
                                    <span>100</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Số lượng cần tuyển
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={formData.maxWorkers}
                                        onChange={(e) => setFormData({ ...formData, maxWorkers: parseInt(e.target.value) })}
                                        className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dress Code */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Dress code / Yêu cầu trang phục
                            </label>
                            <div className="relative">
                                <Shirt className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    value={formData.dressCode}
                                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                                    placeholder="VD: Áo trắng, quần đen, giày đen"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: Payment */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <div className="p-2 bg-cta/10 rounded-xl">
                                <DollarSign className="w-5 h-5 text-cta" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Lương thưởng</h2>
                                <p className="text-sm text-muted-foreground">Mức lương theo giờ</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Lương theo giờ (VNĐ) <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                <input
                                    type="number"
                                    required
                                    min="1000"
                                    step="1000"
                                    value={formData.hourlyRateVnd}
                                    onChange={(e) => setFormData({ ...formData, hourlyRateVnd: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground text-lg font-semibold"
                                    placeholder="50,000"
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <AlertCircle className="w-4 h-4" />
                                <span>Thị trường: 40,000 - 80,000 VNĐ/giờ</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 sticky bottom-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/owner/jobs')}
                            className="flex-1 h-12"
                        >
                            Hủy
                        </Button>

                        <Button
                            type="submit"
                            disabled={loading || completionPercent < 100}
                            variant="cta"
                            className="flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Đang đăng...
                                </>
                            ) : (
                                <>
                                    <Briefcase className="h-5 w-5 mr-2" />
                                    Đăng tin tuyển dụng
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
