'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    AlertCircle,
    ImageIcon,
    Upload,
    X,
    Save
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

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
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

    useEffect(() => {
        fetchJob();
    }, [jobId]);

    const fetchJob = async () => {
        const supabase = createUntypedClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: job, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .eq('owner_id', user.id)
                .single();

            if (error || !job) {
                toast.error('Không tìm thấy tin tuyển dụng');
                router.push('/owner/jobs');
                return;
            }

            setFormData({
                title: job.title || '',
                description: job.description || '',
                shiftDate: job.shift_date || '',
                shiftStartTime: job.shift_start_time?.slice(0, 5) || '',
                shiftEndTime: job.shift_end_time?.slice(0, 5) || '',
                hourlyRateVnd: job.hourly_rate_vnd?.toString() || '',
                requiredLanguage: job.required_language || '',
                requiredLanguageLevel: job.required_language_level || '',
                minReliabilityScore: job.min_reliability_score || 90,
                dressCode: job.dress_code || '',
                maxWorkers: job.max_workers || 1,
            });
            setThumbnailUrl(job.thumbnail_url || null);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu');
            router.push('/owner/jobs');
        } finally {
            setLoading(false);
        }
    };

    const uploadThumbnail = async (file: File): Promise<string | null> => {
        const supabase = createUntypedClient();
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
                toast.success('Đã tải ảnh lên thành công!');
            } else {
                toast.error('Lỗi khi tải ảnh');
            }
        } catch (error) {
            toast.error('Lỗi khi upload ảnh');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const supabase = createUntypedClient();

        try {
            const { error } = await supabase
                .from('jobs')
                .update({
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
                })
                .eq('id', jobId);

            if (error) throw error;

            toast.success('Đã cập nhật tin tuyển dụng!');
            router.push('/owner/jobs');
        } catch (error: any) {
            console.error('Update error:', error);
            toast.error(error.message || 'Lỗi cập nhật tin');
        } finally {
            setSaving(false);
        }
    };

    const availableLevels = formData.requiredLanguage
        ? languageLevels[formData.requiredLanguage]
        : [];

    if (loading) {
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
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Briefcase className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-xl font-bold text-foreground">Chỉnh sửa tin</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
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

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Tiêu đề công việc <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Mô tả công việc
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground resize-none"
                            />
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Ảnh thumbnail
                            </label>
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    <div className="w-32 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                                        {thumbnailUrl ? (
                                            <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
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
                                <div>
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
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Tải ảnh lên
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <div className="p-2 bg-success/10 rounded-xl">
                                <Calendar className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Lịch làm việc</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Ngày làm *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.shiftDate}
                                    onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Giờ bắt đầu *</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.shiftStartTime}
                                    onChange={(e) => setFormData({ ...formData, shiftStartTime: e.target.value })}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Giờ kết thúc *</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.shiftEndTime}
                                    onChange={(e) => setFormData({ ...formData, shiftEndTime: e.target.value })}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <div className="p-2 bg-warning/10 rounded-xl">
                                <Star className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Yêu cầu ứng viên</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Ngôn ngữ *</label>
                                <select
                                    required
                                    value={formData.requiredLanguage}
                                    onChange={(e) => setFormData({ ...formData, requiredLanguage: e.target.value as LanguageType, requiredLanguageLevel: '' })}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                                >
                                    <option value="">Chọn ngôn ngữ</option>
                                    <option value="japanese">Tiếng Nhật</option>
                                    <option value="korean">Tiếng Hàn</option>
                                    <option value="english">Tiếng Anh</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Trình độ *</label>
                                <select
                                    required
                                    value={formData.requiredLanguageLevel}
                                    onChange={(e) => setFormData({ ...formData, requiredLanguageLevel: e.target.value as LanguageLevel })}
                                    disabled={!formData.requiredLanguage}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground disabled:opacity-50"
                                >
                                    <option value="">Chọn trình độ</option>
                                    {availableLevels.map((level) => (
                                        <option key={level.value} value={level.value}>{level.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Điểm tin cậy tối thiểu</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={formData.minReliabilityScore}
                                    onChange={(e) => setFormData({ ...formData, minReliabilityScore: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>0</span>
                                    <span className="font-bold text-primary">{formData.minReliabilityScore} điểm</span>
                                    <span>100</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Số lượng tuyển</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.maxWorkers}
                                    onChange={(e) => setFormData({ ...formData, maxWorkers: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Dress code</label>
                            <input
                                type="text"
                                value={formData.dressCode}
                                onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
                                placeholder="VD: Áo trắng, quần đen"
                            />
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                            <div className="p-2 bg-cta/10 rounded-xl">
                                <DollarSign className="w-5 h-5 text-cta" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Lương thưởng</h2>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Lương theo giờ (VNĐ) <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="1000"
                                step="1000"
                                value={formData.hourlyRateVnd}
                                onChange={(e) => setFormData({ ...formData, hourlyRateVnd: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground text-lg font-semibold"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 sticky bottom-4">
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
                            disabled={saving}
                            variant="cta"
                            className="flex-1 h-12 text-base font-semibold"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2" />
                                    Lưu thay đổi
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
