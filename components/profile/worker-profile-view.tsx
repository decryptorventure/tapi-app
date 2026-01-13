'use client';

import { useState } from 'react';
import { Share2, MapPin, Star, CheckCircle2, Calendar, Briefcase, Copy, QrCode, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ProfileData {
    id: string;
    username?: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    reliability_score: number;
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
    const [showQR, setShowQR] = useState(false);

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section */}
            <div className="relative">
                {/* Cover Gradient */}
                <div className="h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600" />

                {/* Profile Card */}
                <div className="max-w-2xl mx-auto px-4 -mt-16 relative z-10">
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                        {/* Avatar & Basic Info */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        profile.full_name?.charAt(0)?.toUpperCase() || 'U'
                                    )}
                                </div>
                                {/* Verified Badge */}
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 ring-2 ring-white">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                                {profile.university_name && (
                                    <p className="text-sm text-gray-500 mt-0.5">{profile.university_name}</p>
                                )}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-gray-600">
                                    <span className={`font-semibold ${getScoreColor(profile.reliability_score)}`}>
                                        ⭐ {profile.reliability_score} điểm tin cậy
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {profile.stats.total_shifts} ca hoàn thành
                                    </span>
                                </div>
                            </div>

                            {/* Share Button */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyLink}
                                    className="gap-2"
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Đã copy!' : 'Copy link'}
                                </Button>
                            </div>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="mt-4 text-gray-600 text-sm leading-relaxed">
                                {profile.bio}
                            </p>
                        )}
                    </div>

                    {/* Language Skills */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kỹ năng ngôn ngữ</h2>
                        {profile.language_skills.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {profile.language_skills.map((skill) => (
                                    <div
                                        key={skill.id}
                                        className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100"
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

                    {/* Reliability Score */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Độ tin cậy</h2>
                        <div className="flex items-center gap-4">
                            <div className={`text-4xl font-bold ${getScoreColor(profile.reliability_score)}`}>
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
                            <div className="text-center p-3 bg-slate-50 rounded-xl">
                                <p className="text-2xl font-bold text-gray-900">{profile.stats.total_shifts}</p>
                                <p className="text-xs text-gray-500 mt-1">Ca hoàn thành</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-xl">
                                <p className="text-2xl font-bold text-gray-900">
                                    {profile.stats.average_rating > 0 ? profile.stats.average_rating.toFixed(1) : '-'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Đánh giá TB</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-xl">
                                <p className="text-2xl font-bold text-gray-900">{profile.stats.review_count}</p>
                                <p className="text-xs text-gray-500 mt-1">Lượt đánh giá</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-xl">
                                <p className="text-2xl font-bold text-green-600">0</p>
                                <p className="text-xs text-gray-500 mt-1">Lần vắng mặt</p>
                            </div>
                        </div>
                    </div>

                    {/* Work History */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kinh nghiệm làm việc</h2>
                        {profile.work_history.length > 0 ? (
                            <div className="space-y-4">
                                {profile.work_history.map((work) => (
                                    <div
                                        key={work.id}
                                        className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xl">
                                            🍜
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{work.restaurant_name}</h3>
                                                    <p className="text-sm text-gray-500">{work.role}</p>
                                                </div>
                                                {work.rating && (
                                                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-sm font-semibold text-yellow-700">{work.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {work.review && (
                                                <p className="mt-2 text-sm text-gray-600 italic">"{work.review}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Chưa có kinh nghiệm làm việc</p>
                        )}
                    </div>

                    {/* Powered by Tapy */}
                    <div className="text-center py-8">
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <span>Powered by</span>
                            <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Tapy
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
