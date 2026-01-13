'use client';

import { useState } from 'react';
import { MapPin, Clock, DollarSign, Users, Briefcase, CheckCircle2, Star, ChevronRight, Copy, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Job {
    id: string;
    title: string;
    shift_date: string;
    shift_start_time: string;
    shift_end_time: string;
    hourly_rate_vnd: number;
    required_language: string;
    required_language_level: string;
    max_workers: number;
    current_workers: number;
}

interface ProfileData {
    id: string;
    restaurant_name: string;
    restaurant_address?: string;
    avatar_url?: string;
    bio?: string;
    phone_number?: string;
    email?: string;
    cuisine_type?: string;
    is_verified?: boolean;
    active_jobs: Job[];
    images: { id: string; image_url: string }[];
    stats: {
        jobs_completed: number;
        workers_hired: number;
    };
}

const languageLabels: Record<string, string> = {
    japanese: 'Tiếng Nhật',
    korean: 'Tiếng Hàn',
    english: 'Tiếng Anh',
};

export function OwnerLandingView({ profile }: { profile: ProfileData }) {
    const [copied, setCopied] = useState(false);

    const profileUrl = typeof window !== 'undefined'
        ? window.location.href
        : '';

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
            {/* Hero Section */}
            <div className="relative">
                {/* Cover Image or Gradient */}
                <div className="h-56 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 relative overflow-hidden">
                    {profile.images[0] && (
                        <img
                            src={profile.images[0].image_url}
                            alt={profile.restaurant_name}
                            className="w-full h-full object-cover opacity-60"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* Restaurant Info */}
                <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10">
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            {/* Logo */}
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-4xl shadow-lg ring-4 ring-white">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.restaurant_name} className="w-full h-full rounded-2xl object-cover" />
                                    ) : (
                                        '🍜'
                                    )}
                                </div>
                                {profile.is_verified && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 ring-2 ring-white">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <h1 className="text-2xl font-bold text-gray-900">{profile.restaurant_name}</h1>
                                    {profile.is_verified && (
                                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">Đã xác minh</span>
                                    )}
                                </div>
                                {profile.cuisine_type && (
                                    <p className="text-sm text-gray-500 mt-0.5">{profile.cuisine_type}</p>
                                )}
                                {profile.restaurant_address && (
                                    <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{profile.restaurant_address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Share */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLink}
                                className="gap-2"
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Đã copy!' : 'Chia sẻ'}
                            </Button>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="mt-4 text-gray-600 text-sm leading-relaxed">
                                {profile.bio}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6 py-4 border-t border-gray-100">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{profile.active_jobs.length}</p>
                                <p className="text-xs text-gray-500">Việc đang tuyển</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{profile.stats.jobs_completed}</p>
                                <p className="text-xs text-gray-500">Ca đã hoàn thành</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{profile.stats.workers_hired}</p>
                                <p className="text-xs text-gray-500">Worker đã thuê</p>
                            </div>
                        </div>
                    </div>

                    {/* Image Gallery */}
                    {profile.images.length > 1 && (
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h2>
                            <div className="grid grid-cols-3 gap-2">
                                {profile.images.slice(0, 6).map((img) => (
                                    <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                                        <img src={img.image_url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Jobs */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Việc đang tuyển ({profile.active_jobs.length})
                        </h2>
                        {profile.active_jobs.length > 0 ? (
                            <div className="space-y-3">
                                {profile.active_jobs.map((job) => (
                                    <Link
                                        key={job.id}
                                        href={`/worker/jobs/${job.id}`}
                                        className="block p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                                                    {job.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatDate(job.shift_date)} • {job.shift_start_time} - {job.shift_end_time}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-green-600 font-medium">
                                                        <DollarSign className="w-3.5 h-3.5" />
                                                        {formatCurrency(job.hourly_rate_vnd)}đ/h
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                                        {languageLabels[job.required_language] || job.required_language} {job.required_language_level.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {job.max_workers - job.current_workers}/{job.max_workers} vị trí
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Hiện chưa có việc làm nào</p>
                            </div>
                        )}
                    </div>

                    {/* Contact */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Liên hệ</h2>
                        <div className="space-y-3">
                            {profile.phone_number && (
                                <a
                                    href={`tel:${profile.phone_number}`}
                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <Phone className="w-5 h-5 text-green-600" />
                                    <span className="text-gray-700">{profile.phone_number}</span>
                                </a>
                            )}
                            {profile.email && (
                                <a
                                    href={`mailto:${profile.email}`}
                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <Mail className="w-5 h-5 text-blue-600" />
                                    <span className="text-gray-700">{profile.email}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-center text-white mb-8">
                        <h3 className="text-xl font-bold mb-2">Muốn làm việc tại đây?</h3>
                        <p className="text-orange-100 text-sm mb-4">Đăng ký Tapy để ứng tuyển ngay!</p>
                        <Link href="/auth/login">
                            <Button className="bg-white text-orange-600 hover:bg-orange-50">
                                Đăng ký / Đăng nhập
                            </Button>
                        </Link>
                    </div>

                    {/* Footer */}
                    <div className="text-center py-8">
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <span>Powered by</span>
                            <span className="font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                                Tapy
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
