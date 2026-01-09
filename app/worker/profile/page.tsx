'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    Loader2,
    User,
    Languages,
    Shield,
    Star,
    Calendar,
    Briefcase,
    Edit,
    CheckCircle2,
    Clock,
    AlertCircle,
    LogOut,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslation } from '@/lib/i18n';

interface LanguageSkill {
    id: string;
    language_type: string;
    level: string;
    is_verified: boolean;
    certificate_url: string | null;
}

interface Profile {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    avatar_url: string | null;
    date_of_birth: string | null;
    university_name: string | null;
    bio: string | null;
    reliability_score: number;
    is_verified: boolean;
    role: string;
}

interface CompletedJob {
    id: string;
    title: string;
    shift_date: string;
    hourly_rate_vnd: number;
}

export default function WorkerProfilePage() {
    const router = useRouter();
    const { t, locale } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>([]);
    const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Fetch language skills
            const { data: skillsData } = await supabase
                .from('language_skills')
                .select('*')
                .eq('worker_id', user.id);

            setLanguageSkills(skillsData || []);

            // Fetch completed jobs
            const { data: jobsData } = await supabase
                .from('job_applications')
                .select(`
          id,
          job:jobs(id, title, shift_date, hourly_rate_vnd)
        `)
                .eq('worker_id', user.id)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(5);

            if (jobsData) {
                setCompletedJobs(jobsData.map((item: any) => ({
                    id: item.job.id,
                    title: item.job.title,
                    shift_date: item.job.shift_date,
                    hourly_rate_vnd: item.job.hourly_rate_vnd,
                })));
            }
        } catch (error: any) {
            console.error('Fetch error:', error);
            toast.error('Lỗi tải thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const supabase = createUntypedClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const getLanguageLabel = (lang: string) => {
        const labels: Record<string, string> = {
            japanese: '🇯🇵 Tiếng Nhật',
            korean: '🇰🇷 Tiếng Hàn',
            english: '🇬🇧 Tiếng Anh',
        };
        return labels[lang] || lang;
    };

    const getLevelLabel = (level: string) => {
        const labels: Record<string, string> = {
            n5: 'JLPT N5',
            n4: 'JLPT N4',
            n3: 'JLPT N3',
            n2: 'JLPT N2',
            n1: 'JLPT N1',
            topik_1: 'TOPIK 1',
            topik_2: 'TOPIK 2',
            topik_3: 'TOPIK 3',
            topik_4: 'TOPIK 4',
            topik_5: 'TOPIK 5',
            topik_6: 'TOPIK 6',
            a1: 'CEFR A1',
            a2: 'CEFR A2',
            b1: 'CEFR B1',
            b2: 'CEFR B2',
            c1: 'CEFR C1',
            c2: 'CEFR C2',
        };
        return labels[level] || level;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        {t('common.error')}
                    </h2>
                    <Link href="/login" className="text-blue-600 hover:underline">
                        {t('auth.login')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900">
                                {t('worker.myProfile')}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher />
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                            {profile.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-900">
                                {profile.full_name}
                            </h2>
                            <p className="text-slate-600 text-sm">{profile.email}</p>
                            <p className="text-slate-500 text-sm">{profile.phone_number}</p>
                        </div>
                        <Link href="/onboarding/worker/profile">
                            <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {profile.bio && (
                        <p className="text-slate-600 text-sm mb-4">{profile.bio}</p>
                    )}

                    {/* Reliability Score */}
                    <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                        <Star className="w-8 h-8 text-yellow-500" />
                        <div>
                            <p className="text-sm text-slate-600">{t('worker.reliabilityScore')}</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {profile.reliability_score || 100}
                                <span className="text-sm text-slate-500 font-normal"> / 100</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Language Skills */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Languages className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-slate-900">
                                {t('worker.languageSkills')}
                            </h3>
                        </div>
                        <Link href="/worker/profile/languages">
                            <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                {t('common.edit')}
                            </Button>
                        </Link>
                    </div>

                    {languageSkills.length > 0 ? (
                        <div className="space-y-3">
                            {languageSkills.map((skill) => (
                                <div
                                    key={skill.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {getLanguageLabel(skill.language_type)}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {getLevelLabel(skill.level)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {skill.is_verified ? (
                                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {t('worker.verified')}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                                                <Clock className="w-3 h-3" />
                                                {t('worker.pending')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Languages className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm mb-3">
                                Chưa có kỹ năng ngôn ngữ nào
                            </p>
                            <Link href="/onboarding/worker/languages">
                                <Button size="sm">
                                    {t('worker.addCertificate')}
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Identity Verification */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-slate-900">
                                Xác minh danh tính
                            </h3>
                        </div>
                        <Link href="/worker/profile/identity">
                            <Button variant="outline" size="sm">
                                {profile.is_verified ? t('common.view') : 'Xác minh'}
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        {profile.is_verified ? (
                            <span className="flex items-center gap-1 text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" />
                                Đã xác minh
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-sm text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                                <Clock className="w-4 h-4" />
                                Chưa xác minh
                            </span>
                        )}
                    </div>
                </div>

                {/* Job History */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-slate-900">
                                {t('worker.jobHistory')}
                            </h3>
                        </div>
                    </div>

                    {completedJobs.length > 0 ? (
                        <div className="space-y-3">
                            {completedJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{job.title}</p>
                                        <p className="text-sm text-slate-600 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(job.shift_date)}
                                        </p>
                                    </div>
                                    <span className="text-green-600 font-medium">
                                        {job.hourly_rate_vnd.toLocaleString('vi-VN')}đ/h
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm">
                                Chưa có công việc nào hoàn thành
                            </p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/" className="block">
                        <Button variant="outline" className="w-full">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Tìm việc
                        </Button>
                    </Link>
                    <Link href="/worker/jobs" className="block">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            <Calendar className="h-4 w-4 mr-2" />
                            Việc của tôi
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
