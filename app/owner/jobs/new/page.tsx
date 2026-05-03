'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
    AlertCircle,
    ImageIcon,
    Upload,
    X
} from 'lucide-react';
import Link from 'next/link';
import { LanguageType, LanguageLevel } from '@/types/database.types';
import { useTranslation } from '@/lib/i18n';

// We map dynamic translation keys instead of hardcoded strings
const languageLevels: Record<LanguageType, { value: LanguageLevel; key: string }[]> = {
    japanese: [
        { value: 'n5', key: 'languageLevels.japanese.n5' },
        { value: 'n4', key: 'languageLevels.japanese.n4' },
        { value: 'n3', key: 'languageLevels.japanese.n3' },
        { value: 'n2', key: 'languageLevels.japanese.n2' },
        { value: 'n1', key: 'languageLevels.japanese.n1' },
    ],
    korean: [
        { value: 'topik_1', key: 'languageLevels.korean.topik_1' },
        { value: 'topik_2', key: 'languageLevels.korean.topik_2' },
        { value: 'topik_3', key: 'languageLevels.korean.topik_3' },
        { value: 'topik_4', key: 'languageLevels.korean.topik_4' },
        { value: 'topik_5', key: 'languageLevels.korean.topik_5' },
        { value: 'topik_6', key: 'languageLevels.korean.topik_6' },
    ],
    english: [
        { value: 'a1', key: 'languageLevels.english.a1' },
        { value: 'a2', key: 'languageLevels.english.a2' },
        { value: 'b1', key: 'languageLevels.english.b1' },
        { value: 'b2', key: 'languageLevels.english.b2' },
        { value: 'c1', key: 'languageLevels.english.c1' },
        { value: 'c2', key: 'languageLevels.english.c2' },
    ],
};

export default function NewJobPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
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

    const uploadThumbnail = async (file: File): Promise<string | null> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `jobs/${user.id}/${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
            .from('restaurants')
            .upload(fileName, file);

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('restaurants')
            .getPublicUrl(fileName);

        return publicUrl;
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadThumbnail(file);
            if (url) {
                setThumbnailUrl(url);
                toast.success('Đã tải ảnh lên');
            }
        } catch (error) {
            toast.error('Lỗi khi upload ảnh');
        } finally {
            setUploading(false);
        }
    };

    // Auth check on mount
    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
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

        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Validate
            if (!formData.requiredLanguage || !formData.requiredLanguageLevel) {
                throw new Error(t('forms.validation.missingLanguage'));
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
                    thumbnail_url: thumbnailUrl,
                    status: 'open',
                    current_workers: 0,
                })
                .select()
                .single();

            if (error) throw error;

            toast.success(t('forms.validation.successJob'));
            router.push('/owner/jobs');
        } catch (error: any) {
            console.error('Job creation error:', error);
            toast.error(error.message || t('forms.validation.errorJob'));
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
                            <h1 className="text-xl font-bold text-foreground">{t('forms.createJob')}</h1>
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
                                <h2 className="text-lg font-bold text-foreground">{t("forms.hiringStats")}</h2>
                                <p className="text-sm text-muted-foreground">{t("forms.descriptionPlaceholder")}</p>
                            </div>
                        </div>

                        {/* Job Title */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {t('forms.jobTitle')} <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                                placeholder={t('forms.jobTitlePlaceholder')}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {t('forms.description')}
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

                        {/* Thumbnail Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Ảnh thumbnail công việc
                            </label>
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    <div className="w-32 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                                        {thumbnailUrl ? (
                                            <img
                                                src={thumbnailUrl}
                                                alt="Thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                    )}
                                    {thumbnailUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailUrl(null)}
                                            className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full text-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        ref={thumbnailInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => thumbnailInputRef.current?.click()}
                                        disabled={uploading}
                                        className="mb-2"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Tải ảnh lên
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Ảnh sẽ hiển thị trong danh sách công việc (16:9 khuyến nghị)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Schedule */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <div className="p-2 bg-success/10 rounded-xl">
                                <Calendar className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">{t("forms.timeAndSalary")}</h2>
                                <p className="text-sm text-muted-foreground">...</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {t("forms.date")} <span className="text-destructive">*</span>
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
                                    {t("forms.startTime")} <span className="text-destructive">*</span>
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
                                    {t("forms.endTime")} <span className="text-destructive">*</span>
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
                                <h2 className="text-lg font-bold text-foreground">{t("forms.requirements")}</h2>
                                
                            </div>
                        </div>

                        {/* Language Requirements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {t("forms.language")} <span className="text-destructive">*</span>
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
                                        <option value="">{t("forms.language")}</option>
                                        <option value="japanese">{t("languageLevels.japanese.n5")}</option>
                                        <option value="korean">Tiếng Hàn</option>
                                        <option value="english">Tiếng Anh</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {t("forms.targetLevel")} <span className="text-destructive">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.requiredLanguageLevel}
                                    onChange={(e) => setFormData({ ...formData, requiredLanguageLevel: e.target.value as LanguageLevel })}
                                    disabled={!formData.requiredLanguage}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                >
                                    <option value="">--</option>
                                    {availableLevels.map((level) => (
                                        <option key={level.value} value={level.value}>
                                            {t(level.key)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Reliability Score & Max Workers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {t("forms.reliabilityScore")}
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
