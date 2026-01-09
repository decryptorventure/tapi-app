'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Loader2,
    CheckCircle2,
    User,
    Languages,
    Video,
    Edit2,
    Eye,
    FileText
} from 'lucide-react';
import Link from 'next/link';

import { useTranslation } from '@/lib/i18n';

export default function WorkerReviewPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [languages, setLanguages] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const supabase = createUntypedClient();
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
        setLoading(true);
        const supabase = createUntypedClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            console.log('Completing worker onboarding for:', user.id);
            const { error } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    full_name: profile?.full_name,
                    email: user.email,
                    can_apply: true, // Allow applying immediately
                    profile_completion_percentage: 100, // Mark as 100%
                    is_verified: true, // Mark as verified for testing
                    reliability_score: 100 // Starting score
                })
                .eq('id', user.id);

            if (error) {
                console.error('Worker onboarding completion error:', error);
                throw error;
            }

            console.log('Onboarding successfully updated, redirecting...');
            toast.success(t('review.success'));

            // Use a small timeout to ensure state/toast is visible if needed, 
            // but router.push is the primary action
            router.push('/worker/dashboard');
        } catch (error: any) {
            console.error('Submit error:', error);
            toast.error(t('review.error'));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
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
                            <div className="w-8 h-2 bg-blue-600 rounded-full" />
                        </div>
                        <span className="text-sm text-slate-500">{t('onboarding.step')} 4/4</span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {t('onboarding.reviewStep')}
                            </h1>
                            <p className="text-slate-600">
                                {t('onboarding.reviewDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Section: Profile */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                                <User className="w-4 h-4 text-blue-600" />
                                {t('onboarding.personalInfo')}
                            </h3>
                            <Link href="/onboarding/worker/profile">
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                    <Edit2 className="w-4 h-4 mr-1" /> {t('onboarding.editBtn')}
                                </Button>
                            </Link>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-4">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-100" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                                        <User className="w-10 h-10 text-slate-300" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-slate-900">{profile?.full_name}</h4>
                                    <p className="text-sm text-slate-600">📅 {profile?.date_of_birth || t('onboarding.notUpdated')}</p>
                                    <p className="text-sm text-slate-600">🎓 {profile?.university_name || t('onboarding.notUpdated')}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    &quot;{profile?.bio || t('review.noIntro')}&quot;
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Languages */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                                <Languages className="w-4 h-4 text-blue-600" />
                                {t('onboarding.languageN')}
                            </h3>
                            <Link href="/onboarding/worker/languages">
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                    <Edit2 className="w-4 h-4 mr-1" /> {t('onboarding.editBtn')}
                                </Button>
                            </Link>
                        </div>
                        <div className="p-6">
                            {languages.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {languages.map((skill, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">
                                                    {skill.language === 'japanese' ? '🇯🇵' : skill.language === 'korean' ? '🇰🇷' : '🇬🇧'}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium capitalize text-slate-800">{skill.language}</p>
                                                    <p className="text-xs text-slate-500 uppercase font-bold">{skill.level}</p>
                                                </div>
                                            </div>
                                            {skill.certificate_url && (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-2">{t('review.noLanguages')}</p>
                            )}
                        </div>
                    </div>

                    {/* Section: Video */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                                <Video className="w-4 h-4 text-blue-600" />
                                {t('onboarding.introVideo')}
                            </h3>
                            <Link href="/onboarding/worker/video">
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                    <Edit2 className="w-4 h-4 mr-1" /> {t('onboarding.editBtn')}
                                </Button>
                            </Link>
                        </div>
                        <div className="p-6">
                            {profile?.intro_video_url ? (
                                <div className="relative rounded-lg overflow-hidden bg-black aspect-video group">
                                    <video src={profile.intro_video_url} className="w-full h-full" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                            <Eye className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                                    <p className="text-sm text-slate-500">{t('onboarding.noVideo')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <label className="flex gap-3 cursor-pointer">
                            <input type="checkbox" required className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                            <span className="text-sm text-slate-600">
                                {t('onboarding.termsAgree')}
                            </span>
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/onboarding/worker/video')}
                            className="flex-1"
                        >
                            {t('onboarding.goBack')}
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-lg py-6"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                t('onboarding.completeStart')
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
