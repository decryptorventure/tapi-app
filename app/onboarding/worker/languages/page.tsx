'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import { Loader2, Plus, X, Languages, Award } from 'lucide-react';
import { LanguageType, LanguageLevel } from '@/types/database.types';

interface LanguageSkill {
    language: LanguageType;
    level: LanguageLevel;
    certificateFile: File | null;
}

const languageOptions: { value: LanguageType; label: string; flag: string }[] = [
    { value: 'japanese', label: 'Tiếng Nhật', flag: '🇯🇵' },
    { value: 'korean', label: 'Tiếng Hàn', flag: '🇰🇷' },
    { value: 'english', label: 'Tiếng Anh', flag: '🇬🇧' },
];

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

import { useTranslation } from '@/lib/i18n';

export default function WorkerLanguagesPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>([
        { language: 'japanese', level: 'n5', certificateFile: null }
    ]);

    const languageOptions: { value: LanguageType; label: string; flag: string }[] = [
        { value: 'japanese', label: t('onboarding.japanese'), flag: '🇯🇵' },
        { value: 'korean', label: t('onboarding.korean'), flag: '🇰🇷' },
        { value: 'english', label: t('onboarding.english'), flag: '🇬🇧' },
    ];

    const levelsByLanguage: Record<LanguageType, { value: LanguageLevel; label: string }[]> = {
        japanese: [
            { value: 'n5', label: t('languageLevels.japanese.n5') },
            { value: 'n4', label: t('languageLevels.japanese.n4') },
            { value: 'n3', label: t('languageLevels.japanese.n3') },
            { value: 'n2', label: t('languageLevels.japanese.n2') },
            { value: 'n1', label: t('languageLevels.japanese.n1') },
        ],
        korean: [
            { value: 'topik_1', label: t('languageLevels.korean.topik_1') },
            { value: 'topik_2', label: t('languageLevels.korean.topik_2') },
            { value: 'topik_3', label: t('languageLevels.korean.topik_3') },
            { value: 'topik_4', label: t('languageLevels.korean.topik_4') },
            { value: 'topik_5', label: t('languageLevels.korean.topik_5') },
            { value: 'topik_6', label: t('languageLevels.korean.topik_6') },
        ],
        english: [
            { value: 'a1', label: t('languageLevels.english.a1') },
            { value: 'a2', label: t('languageLevels.english.a2') },
            { value: 'b1', label: t('languageLevels.english.b1') },
            { value: 'b2', label: t('languageLevels.english.b2') },
            { value: 'c1', label: t('languageLevels.english.c1') },
            { value: 'c2', label: t('languageLevels.english.c2') },
        ],
    };

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

    const addLanguage = () => {
        if (languageSkills.length >= 3) {
            toast.error(t('onboarding.maxLanguages'));
            return;
        }

        const usedLanguages = languageSkills.map(s => s.language);
        const availableLanguage = languageOptions.find(l => !usedLanguages.includes(l.value));

        if (!availableLanguage) {
            toast.error(t('onboarding.allLanguagesAdded'));
            return;
        }

        const defaultLevel = levelsByLanguage[availableLanguage.value][0].value;
        setLanguageSkills([...languageSkills, {
            language: availableLanguage.value,
            level: defaultLevel,
            certificateFile: null
        }]);
    };

    const removeLanguage = (index: number) => {
        if (languageSkills.length === 1) {
            toast.error(t('onboarding.minOneLanguage'));
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

            // Upload certificates and create language_skills records
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

                // Insert or upsert language skill
                const { error: skillError } = await supabase
                    .from('language_skills')
                    .upsert({
                        user_id: user.id,
                        language: skill.language,
                        level: skill.level,
                        certificate_url: certificateUrl,
                        verification_status: 'pending',
                    }, { onConflict: 'user_id,language' });

                if (skillError) {
                    console.error('Language skill error:', skillError);
                }
            }

            toast.success(t('languageSkills.success') || 'Đã lưu kỹ năng ngôn ngữ!');
            router.push('/onboarding/worker/video'); // Go to intro video step
        } catch (error: any) {
            console.error('Submit error:', error);
            toast.error(error.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
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
                            <div className="w-8 h-2 bg-slate-200 rounded-full" />
                        </div>
                        <span className="text-sm text-slate-500">{t('onboarding.step')} 2/3</span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Languages className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {t('onboarding.languageStep')}
                            </h1>
                            <p className="text-slate-600">
                                {t('onboarding.languageStepDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {languageSkills.map((skill, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium text-slate-900">
                                        {t('onboarding.languageN')} {index + 1}
                                    </span>
                                </div>
                                {languageSkills.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeLanguage(index)}
                                        className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        {t('onboarding.languageN')} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={skill.language}
                                        onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        {languageOptions.map((lang) => (
                                            <option
                                                key={lang.value}
                                                value={lang.value}
                                                disabled={languageSkills.some((s, i) => i !== index && s.language === lang.value)}
                                            >
                                                {lang.flag} {lang.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        {t('onboarding.levelRequired')} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={skill.level}
                                        onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                                <ImageUpload
                                    label={t('onboarding.certOptional')}
                                    helperText={t('onboarding.certHelper')}
                                    onFileSelect={(file) => updateLanguage(index, 'certificateFile', file)}
                                    onFileRemove={() => updateLanguage(index, 'certificateFile', null)}
                                    accept="image/*,.pdf"
                                    maxSize={10}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Add Language Button */}
                    {languageSkills.length < 3 && (
                        <button
                            type="button"
                            onClick={addLanguage}
                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {t('onboarding.addLanguage')}
                        </button>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800">
                            💡 {t('onboarding.certNote')}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/onboarding/worker/profile')}
                            className="flex-1"
                        >
                            {t('onboarding.goBack')}
                        </Button>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('onboarding.saving')}
                                </>
                            ) : (
                                t('onboarding.continue')
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
