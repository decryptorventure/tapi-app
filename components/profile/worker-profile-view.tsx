'use client';

import { useState } from 'react';
import { Share2, MapPin, Star, CheckCircle2, Calendar, Briefcase, Copy, QrCode, ExternalLink, Phone, Mail, Shield, Clock, Play, Building2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface WorkExperience {
    id: string;
    company_name: string;
    job_title: string;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    description: string | null;
}

interface ProfileData {
    id: string;
    username?: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    phone_number?: string;
    email?: string;
    intro_video_url?: string;
    reliability_score: number;
    is_verified?: boolean;
    identity_verification_status?: 'pending' | 'verified' | 'rejected' | null;
    university_name?: string;
    language_skills: {
        id: string;
        language: string;
        level: string;
        verification_status: string;
    }[];
    work_history: {
        id: string;
        restaurant_name: string;
        restaurant_logo?: string;
        role: string;
        rating?: number;
        review?: string;
    }[];
    work_experiences?: WorkExperience[];
    stats: {
        total_shifts: number;
        average_rating: number;
        review_count: number;
    };
}

const languageFlags: Record<string, string> = {
    japanese: '🇯🇵',
    korean: '🇰🇷',
    english: '🇬🇧',
};

const languageNames: Record<string, string> = {
    japanese: 'Tiếng Nhật',
    korean: 'Tiếng Hàn',
    english: 'Tiếng Anh',
};

export function WorkerProfileView({ profile }: { profile: ProfileData }) {
    const [copied, setCopied] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    const profileUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/p/${profile.username || profile.id}`
        : '';

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-500';
    };

    const getVerificationBadge = () => {
        if (profile.is_verified || profile.identity_verification_status === 'verified') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                    <Shield className="w-4 h-4" />
                    Đã xác minh
                </span>
            );
        } else if (profile.identity_verification_status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">
                    <Clock className="w-4 h-4" />
                    Đang xác minh
                </span>
            );
        }
        return null;
    };

    const formatMonthYear = (date: string | null) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
            {/* Hero Section with Gradient Header */}
            <div className="relative">
                {/* Animated Gradient Background */}
                <div className="h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
                </div>

                {/* Profile Card - Overlapping */}
                <div className="max-w-2xl mx-auto px-4 -mt-24 relative z-10">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 border border-slate-100">
                        {/* Avatar & Basic Info */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white shadow-xl">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-2xl object-cover" />
                                    ) : (
                                        profile.full_name?.charAt(0)?.toUpperCase() || 'U'
                                    )}
                                </div>
                                {/* Verified Badge on Avatar */}
                                {(profile.is_verified || profile.identity_verification_status === 'verified') && (
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 ring-3 ring-white shadow-lg">
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                                    {getVerificationBadge()}
                                </div>

                                {profile.university_name && (
                                    <p className="text-sm text-gray-500 mb-2">🎓 {profile.university_name}</p>
                                )}

                                {/* Contact Info */}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
                                    {profile.phone_number && (
                                        <a href={`tel:${profile.phone_number}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                            <Phone className="w-4 h-4" />
                                            {profile.phone_number}
                                        </a>
                                    )}
                                    {profile.email && (
                                        <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                            <Mail className="w-4 h-4" />
                                            {profile.email}
                                        </a>
                                    )}
                                </div>

                                {/* Quick Stats */}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
                                    <span className={`font-semibold ${getScoreColor(profile.reliability_score)}`}>
                                        ⭐ {profile.reliability_score} điểm tin cậy
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="flex items-center gap-1 text-gray-600">
                                        <Briefcase className="w-4 h-4" />
                                        {profile.stats.total_shifts} ca hoàn thành
                                    </span>
                                </div>
                            </div>

                            {/* Share Button */}
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyLink}
                                    className="gap-2 shadow-sm"
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Đã copy!' : 'Copy link'}
                                </Button>
                            </div>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="mt-6 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-6">
                                {profile.bio}
                            </p>
                        )}

                        {/* Intro Video */}
                        {profile.intro_video_url && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Video className="w-4 h-4 text-blue-600" />
                                    Video giới thiệu
                                </h3>
                                {showVideo ? (
                                    <video
                                        src={profile.intro_video_url}
                                        controls
                                        className="w-full rounded-xl shadow-lg"
                                    />
                                ) : (
                                    <button
                                        onClick={() => setShowVideo(true)}
                                        className="w-full h-40 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                                    >
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm">
                                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Language Skills Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            📚 Kỹ năng ngôn ngữ
                        </h2>
                        {profile.language_skills.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {profile.language_skills.map((skill) => (
                                    <div
                                        key={skill.id}
                                        className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-md transition-shadow"
                                    >
                                        <span className="text-3xl">{languageFlags[skill.language] || '🌐'}</span>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {languageNames[skill.language] || skill.language}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-semibold text-blue-600 uppercase">{skill.level}</span>
                                                {skill.verification_status === 'verified' && (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Chưa cập nhật kỹ năng ngôn ngữ</p>
                        )}
                    </div>

                    {/* Work Experience Card (Custom) */}
                    {profile.work_experiences && profile.work_experiences.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                Kinh nghiệm làm việc
                            </h2>
                            <div className="space-y-4">
                                {profile.work_experiences.map((exp) => (
                                    <div
                                        key={exp.id}
                                        className="flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                                            🏢
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{exp.job_title}</h3>
                                            <p className="text-sm text-gray-600">{exp.company_name}</p>
                                            {(exp.start_date || exp.is_current) && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatMonthYear(exp.start_date)} - {exp.is_current ? 'Hiện tại' : formatMonthYear(exp.end_date)}
                                                </p>
                                            )}
                                            {exp.description && (
                                                <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reliability Score Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Độ tin cậy</h2>
                        <div className="flex items-center gap-6">
                            <div className={`text-5xl font-bold ${getScoreColor(profile.reliability_score)}`}>
                                {profile.reliability_score}
                            </div>
                            <div className="flex-1">
                                <Progress
                                    value={profile.reliability_score}
                                    className="h-3"
                                />
                                <div className="flex justify-between mt-2 text-xs text-gray-500">
                                    <span>0</span>
                                    <span>50</span>
                                    <span>100</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                                <p className="text-2xl font-bold text-gray-900">{profile.stats.total_shifts}</p>
                                <p className="text-xs text-gray-500 mt-1">Ca hoàn thành</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                                <p className="text-2xl font-bold text-gray-900">
                                    {profile.stats.average_rating > 0 ? profile.stats.average_rating.toFixed(1) : '-'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Đánh giá TB</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                <p className="text-2xl font-bold text-gray-900">{profile.stats.review_count}</p>
                                <p className="text-xs text-gray-500 mt-1">Lượt đánh giá</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                                <p className="text-2xl font-bold text-green-600">0</p>
                                <p className="text-xs text-gray-500 mt-1">Lần vắng mặt</p>
                            </div>
                        </div>
                    </div>

                    {/* Work History (Tapy Jobs) */}
                    {profile.work_history.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">💼 Lịch sử làm việc trên Tapy</h2>
                            <div className="space-y-4">
                                {profile.work_history.map((work) => (
                                    <div
                                        key={work.id}
                                        className="flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                                            🍜
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{work.restaurant_name}</h3>
                                                    <p className="text-sm text-gray-500">{work.role}</p>
                                                </div>
                                                {work.rating && (
                                                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-lg">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-sm font-semibold text-yellow-700">{work.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {work.review && (
                                                <p className="mt-2 text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">"{work.review}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Powered by Tapy */}
                    <div className="text-center py-10">
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <span>Powered by</span>
                            <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-lg">
                                Tapy
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
