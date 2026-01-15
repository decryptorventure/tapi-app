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
    ExternalLink,
    ChevronRight,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

interface LanguageSkill {
    //...
    id: string;
    language: string;
    level: string;
    verification_status: string;
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
                .eq('user_id', user.id);

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
            toast.error(t('common.error') || 'Lỗi tải thông tin');
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
            japanese: `🇯🇵 ${t('onboarding.japanese')}`,
            korean: `🇰🇷 ${t('onboarding.korean')}`,
            english: `🇬🇧 ${t('onboarding.english')}`,
        };
        return labels[lang] || lang;
    };

    const getLevelLabel = (level: string) => {
        return level.toUpperCase();
    };

    const formatDateStr = (date: string) => {
        return format(new Date(date), 'dd MMM yyyy', {
            locale: locale === 'vi' ? vi : enUS
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        {t('common.error')}
                    </h2>
                    <Link href="/login" className="text-primary hover:underline">
                        {t('auth.login')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-lg font-bold text-foreground">
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
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                            {profile.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-foreground">
                                {profile.full_name}
                            </h2>
                            <p className="text-muted-foreground text-sm">{profile.email}</p>
                            <p className="text-muted-foreground text-sm">{profile.phone_number}</p>
                        </div>
                        <Link href="/onboarding/worker/profile">
                            <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {profile.bio && (
                        <p className="text-muted-foreground text-sm mb-4">{profile.bio}</p>
                    )}

                    {/* Reliability Score - Clickable */}
                    <Link href="/worker/reliability" className="block">
                        <div className="flex items-center gap-4 p-3 bg-warning/10 rounded-lg hover:bg-warning/20 transition-colors cursor-pointer group">
                            <Star className="w-8 h-8 text-warning" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">{t('worker.reliabilityScore')}</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {profile.reliability_score || 100}
                                    <span className="text-sm text-muted-foreground font-normal"> / 100</span>
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                    </Link>

                    {/* View Public Profile Button */}
                    <div className="mt-4 pt-4 border-t border-border">
                        <Link href={`/p/${profile.id}`} target="_blank">
                            <Button variant="outline" className="w-full gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Xem hồ sơ công khai
                            </Button>
                        </Link>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            Chia sẻ link này cho nhà tuyển dụng
                        </p>
                    </div>
                </div>

                {/* Language Skills */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Languages className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-foreground">
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
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {getLanguageLabel(skill.language)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {getLevelLabel(skill.level)}
                                        </p>
                                        {skill.certificate_url && (
                                            <a
                                                href={skill.certificate_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline mt-1 inline-block"
                                            >
                                                📄 {t('worker.viewCertificate')}
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {skill.verification_status === 'verified' ? (
                                            <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {t('worker.verified')}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">
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
                            <Languages className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground text-sm mb-3">
                                {t('worker.noLanguages')}
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
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-foreground">
                                {t('worker.identityVerification')}
                            </h3>
                        </div>
                        <Link href="/worker/profile/identity">
                            <Button variant="outline" size="sm">
                                {profile.is_verified ? t('common.view') : t('worker.verify')}
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        {profile.is_verified ? (
                            <span className="flex items-center gap-1 text-sm text-success bg-success/10 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" />
                                {t('worker.verified')}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-sm text-warning bg-warning/10 px-3 py-1 rounded-full">
                                <Clock className="w-4 h-4" />
                                {t('worker.unverified')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Job History */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-foreground">
                                {t('worker.jobHistory')}
                            </h3>
                        </div>
                    </div>

                    {completedJobs.length > 0 ? (
                        <div className="space-y-3">
                            {completedJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-foreground">{job.title}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDateStr(job.shift_date)}
                                        </p>
                                    </div>
                                    <span className="text-success font-medium">
                                        {job.hourly_rate_vnd.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')} {locale === 'vi' ? 'đ/h' : 'VND/h'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground text-sm">
                                {t('worker.noCompletedJobs')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/worker/feed" className="block">
                        <Button variant="outline" className="w-full">
                            <Briefcase className="h-4 w-4 mr-2" />
                            {t('worker.findJobs')}
                        </Button>
                    </Link>
                    <Link href="/worker/jobs" className="block">
                        <Button className="w-full bg-primary hover:bg-primary/90">
                            <Calendar className="h-4 w-4 mr-2" />
                            {t('worker.myJobsBtn')}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
