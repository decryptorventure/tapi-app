'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import {
    Loader2,
    Plus,
    X,
    Languages as LanguagesIcon,
    Award,
    ChevronRight,
    Upload,
    CheckCircle2
} from 'lucide-react';
import { LanguageType, LanguageLevel } from '@/types/database.types';

interface LanguageSkill {
    language: LanguageType;
    level: LanguageLevel;
    certificateFile: File | null;
}

const languageConfig: Record<LanguageType, { label: string; color: string; bgColor: string }> = {
    japanese: { label: 'Tiếng Nhật', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    korean: { label: 'Tiếng Hàn', color: 'text-rose-700', bgColor: 'bg-rose-50' },
    english: { label: 'Tiếng Anh', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
};

const levelsByLanguage: Record<LanguageType, { value: LanguageLevel; label: string }[]> = {
    japanese: [
        { value: 'n5', label: 'JLPT N5 - Sơ cấp' },
        { value: 'n4', label: 'JLPT N4 - Sơ trung' },
        { value: 'n3', label: 'JLPT N3 - Trung cấp' },
        { value: 'n2', label: 'JLPT N2 - Trung cao' },
        { value: 'n1', label: 'JLPT N1 - Cao cấp' },
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
        { value: 'a1', label: 'CEFR A1 - Beginner' },
        { value: 'a2', label: 'CEFR A2 - Elementary' },
        { value: 'b1', label: 'CEFR B1 - Intermediate' },
        { value: 'b2', label: 'CEFR B2 - Upper Intermediate' },
        { value: 'c1', label: 'CEFR C1 - Advanced' },
        { value: 'c2', label: 'CEFR C2 - Proficiency' },
    ],
};

export default function WorkerLanguagesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>([
        { language: 'japanese', level: 'n5', certificateFile: null }
    ]);

    const addLanguage = () => {
        if (languageSkills.length >= 3) {
            toast.error('Tối đa 3 ngôn ngữ');
            return;
        }

        const usedLanguages = languageSkills.map(s => s.language);
        const availableLanguage = (Object.keys(languageConfig) as LanguageType[])
            .find(l => !usedLanguages.includes(l));

        if (!availableLanguage) {
            toast.error('Đã thêm tất cả ngôn ngữ');
            return;
        }

        const defaultLevel = levelsByLanguage[availableLanguage][0].value;
        setLanguageSkills([...languageSkills, {
            language: availableLanguage,
            level: defaultLevel,
            certificateFile: null
        }]);
    };

    const removeLanguage = (index: number) => {
        if (languageSkills.length === 1) {
            toast.error('Phải có ít nhất 1 ngôn ngữ');
            return;
        }
        setLanguageSkills(languageSkills.filter((_, i) => i !== index));
    };

    const updateLanguage = (index: number, field: keyof LanguageSkill, value: any) => {
        const updated = [...languageSkills];
        if (field === 'language') {
            updated[index].language = value as LanguageType;
            updated[index].level = levelsByLanguage[value as LanguageType][0].value;
        } else {
            (updated[index] as any)[field] = value;
        }
        setLanguageSkills(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            for (const skill of languageSkills) {
                let certificateUrl = null;

                if (skill.certificateFile) {
                    const certPath = `certificates/${user.id}/${skill.language}-${Date.now()}.${skill.certificateFile.name.split('.').pop()}`;
                    const { error: uploadError } = await supabase.storage
                        .from('verifications')
                        .upload(certPath, skill.certificateFile);

                    if (!uploadError) {
                        const { data } = supabase.storage
                            .from('verifications')
                            .getPublicUrl(certPath);
                        certificateUrl = data.publicUrl;
                    }
                }

                await supabase
                    .from('language_skills')
                    .upsert({
                        user_id: user.id,
                        language_type: skill.language,
                        level: skill.level,
                        certificate_url: certificateUrl,
                        verification_status: 'pending',
                    }, { onConflict: 'user_id,language_type' });
            }

            toast.success('Đã lưu kỹ năng ngôn ngữ!');
            router.push('/onboarding/worker/video');
        } catch (error: any) {
            console.error('Submit error:', error);
            toast.error('Lỗi lưu dữ liệu');
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
                        <span className="text-sm font-semibold text-foreground">Bước 2/4</span>
                        <span className="text-sm text-muted-foreground">Kỹ năng ngôn ngữ</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-1/2 transition-all duration-300"></div>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <LanguagesIcon className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Ngôn ngữ của bạn
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Thêm kỹ năng ngôn ngữ để tăng cơ hội tìm việc phù hợp
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {languageSkills.map((skill, index) => {
                        const config = languageConfig[skill.language];
                        return (
                            <div key={index} className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
                                        <LanguagesIcon className={`w-4 h-4 ${config.color}`} />
                                        <span className={`text-sm font-semibold ${config.color}`}>
                                            Ngôn ngữ {index + 1}
                                        </span>
                                    </div>
                                    {languageSkills.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeLanguage(index)}
                                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Ngôn ngữ <span className="text-destructive">*</span>
                                        </label>
                                        <select
                                            required
                                            value={skill.language}
                                            onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                                        >
                                            {(Object.keys(languageConfig) as LanguageType[]).map((lang) => (
                                                <option
                                                    key={lang}
                                                    value={lang}
                                                    disabled={languageSkills.some((s, i) => i !== index && s.language === lang)}
                                                >
                                                    {languageConfig[lang].label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Trình độ <span className="text-destructive">*</span>
                                        </label>
                                        <select
                                            required
                                            value={skill.level}
                                            onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                                        >
                                            {levelsByLanguage[skill.language].map((level) => (
                                                <option key={level.value} value={level.value}>
                                                    {level.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        Chứng chỉ (không bắt buộc)
                                    </label>
                                    <ImageUpload
                                        label=""
                                        helperText="Upload ảnh/PDF chứng chỉ để được xác minh nhanh hơn"
                                        onFileSelect={(file) => updateLanguage(index, 'certificateFile', file)}
                                        onFileRemove={() => updateLanguage(index, 'certificateFile', null)}
                                        accept="image/*,.pdf"
                                        maxSize={10}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {languageSkills.length < 3 && (
                        <button
                            type="button"
                            onClick={addLanguage}
                            className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-semibold"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm ngôn ngữ
                        </button>
                    )}

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">
                            <strong>Mẹo:</strong> Upload chứng chỉ để được xác minh và tăng độ tin cậy của bạn lên đến 100%
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 sticky bottom-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/onboarding/worker/profile')}
                            className="flex-1 h-12"
                        >
                            Quay lại
                        </Button>

                        <Button
                            type="submit"
                            disabled={loading}
                            variant="default"
                            className="flex-1 h-12 bg-primary hover:bg-primary/90"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    Tiếp tục
                                    <ChevronRight className="h-5 w-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
