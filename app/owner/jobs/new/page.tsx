'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Briefcase } from 'lucide-react';
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

    // Show loading spinner until auth check completes
    if (!isAuthed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-3xl">
                    <div className="flex items-center gap-4">
                        <Link href="/owner/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Briefcase className="w-5 h-5 text-orange-600" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900">Đăng tin tuyển dụng</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    {/* Job Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tiêu đề công việc <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            placeholder="VD: Nhân viên phục vụ ca tối"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mô tả công việc
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            placeholder="Mô tả chi tiết công việc, yêu cầu, quyền lợi..."
                        />
                    </div>

                    {/* Shift Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Ngày làm <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.shiftDate}
                                onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Giờ bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.shiftStartTime}
                                onChange={(e) => setFormData({ ...formData, shiftStartTime: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Giờ kết thúc <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.shiftEndTime}
                                onChange={(e) => setFormData({ ...formData, shiftEndTime: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Hourly Rate */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Lương theo giờ (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            required
                            min="1000"
                            step="1000"
                            value={formData.hourlyRateVnd}
                            onChange={(e) => setFormData({ ...formData, hourlyRateVnd: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            placeholder="50000"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Thị trường: 40,000 - 80,000 VNĐ/giờ
                        </p>
                    </div>

                    {/* Language Requirements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Ngôn ngữ yêu cầu <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.requiredLanguage}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    requiredLanguage: e.target.value as LanguageType,
                                    requiredLanguageLevel: '' // Reset level when language changes
                                })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            >
                                <option value="">Chọn ngôn ngữ</option>
                                <option value="japanese">🇯🇵 Tiếng Nhật</option>
                                <option value="korean">🇰🇷 Tiếng Hàn</option>
                                <option value="english">🇬🇧 Tiếng Anh</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Trình độ tối thiểu <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.requiredLanguageLevel}
                                onChange={(e) => setFormData({ ...formData, requiredLanguageLevel: e.target.value as LanguageLevel })}
                                disabled={!formData.requiredLanguage}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors disabled:bg-slate-100"
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
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Điểm tin cậy tối thiểu
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={formData.minReliabilityScore}
                                onChange={(e) => setFormData({ ...formData, minReliabilityScore: parseInt(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>0</span>
                                <span className="font-medium text-orange-600">{formData.minReliabilityScore} điểm</span>
                                <span>100</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Số lượng cần tuyển
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={formData.maxWorkers}
                                onChange={(e) => setFormData({ ...formData, maxWorkers: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Dress Code */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Dress code / Yêu cầu trang phục
                        </label>
                        <input
                            type="text"
                            value={formData.dressCode}
                            onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            placeholder="VD: Áo trắng, quần đen, giày đen"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/owner/dashboard')}
                            className="flex-1"
                        >
                            Hủy
                        </Button>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang đăng...
                                </>
                            ) : (
                                'Đăng tin tuyển dụng'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
