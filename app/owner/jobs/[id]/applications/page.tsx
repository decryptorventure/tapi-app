'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    Users,
    Loader2,
    Check,
    X,
    Clock,
    Star,
    MessageSquare,
    Sparkles
} from 'lucide-react';
import { Job, JobApplication, Profile } from '@/types/database.types';
import { approveApplication } from '@/lib/services/job-application.service';

interface ApplicationWithWorker extends JobApplication {
    worker: Profile;
    language_skills: {
        language: string;
        level: string;
        verification_status: string;
    }[];
}

import { WorkerProfileModal } from '@/components/owner/worker-profile-modal';

export default function JobApplicationsPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<ApplicationWithWorker[]>([]);

    // Modal state
    const [selectedWorker, setSelectedWorker] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [jobId]);

    const viewWorkerProfile = (worker: any, skills: any[]) => {
        setSelectedWorker({ ...worker, skills });
        setIsModalOpen(true);
    };

    const fetchData = async () => {
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch job details
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .eq('owner_id', user.id)
                .single();

            if (jobError) throw jobError;
            if (!jobData) {
                router.push('/owner/jobs');
                return;
            }
            setJob(jobData);

            // Fetch applications with worker profiles
            const { data: apps, error: appsError } = await supabase
                .from('job_applications')
                .select('*')
                .eq('job_id', jobId)
                .order('applied_at', { ascending: false });

            if (appsError) throw appsError;

            if (apps && apps.length > 0) {
                // Fetch worker profiles
                const workerIds = apps.map(a => a.worker_id);
                const { data: workers } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', workerIds);

                // Fetch language skills
                const { data: skills } = await supabase
                    .from('language_skills')
                    .select('*')
                    .in('worker_id', workerIds);

                // Combine data
                const appsWithWorkers = apps.map(app => ({
                    ...app,
                    worker: workers?.find(w => w.id === app.worker_id) || {} as Profile,
                    language_skills: skills?.filter(s => s.worker_id === app.worker_id) || [],
                }));

                setApplications(appsWithWorkers);
            }
        } catch (error: any) {
            console.error('Fetch error:', error);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // ... handleApprove, handleReject remain the same ...

    const handleApprove = async (applicationId: string) => {
        setProcessing(applicationId);
        const supabase = createUntypedClient();

        try {
            // Get current user to pass as ownerId
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Bạn cần đăng nhập lại');
                return;
            }

            // Use the service which generates QR code
            const result = await approveApplication(applicationId, user.id);

            if (!result.success) {
                throw new Error(result.message);
            }

            // Update job current_workers count
            if (job) {
                await supabase
                    .from('jobs')
                    .update({ current_workers: job.current_workers + 1 })
                    .eq('id', jobId);
            }

            toast.success('Đã duyệt đơn ứng tuyển và tạo mã QR check-in');
            fetchData();
        } catch (error: any) {
            console.error('Approve error:', error);
            toast.error(error.message || 'Lỗi duyệt đơn');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (applicationId: string) => {
        setProcessing(applicationId);
        const supabase = createUntypedClient();

        try {
            const { error } = await supabase
                .from('job_applications')
                .update({
                    status: 'rejected',
                    rejected_at: new Date().toISOString()
                })
                .eq('id', applicationId);

            if (error) throw error;

            toast.success('Đã từ chối đơn ứng tuyển');
            fetchData();
        } catch (error: any) {
            console.error('Reject error:', error);
            toast.error('Lỗi từ chối đơn');
        } finally {
            setProcessing(null);
        }
    };

    const getLanguageLabel = (lang: string) => {
        const labels: Record<string, string> = {
            japanese: '🇯🇵 Nhật',
            korean: '🇰🇷 Hàn',
            english: '🇬🇧 Anh',
        };
        return labels[lang] || lang;
    };

    const getStatusBadge = (status: string, isInstantBook: boolean) => {
        if (status === 'pending') {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
        } else if (status === 'approved') {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                    {isInstantBook && <Sparkles className="w-3 h-3" />}
                    {isInstantBook ? 'Instant Book' : 'Đã duyệt'}
                </span>
            );
        } else if (status === 'rejected') {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Từ chối</span>;
        } else if (status === 'completed') {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Hoàn thành</span>;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        );
    }

    const pendingApps = applications.filter(a => a.status === 'pending');
    const approvedApps = applications.filter(a => a.status === 'approved');
    const rejectedApps = applications.filter(a => a.status === 'rejected');

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <WorkerProfileModal
                worker={selectedWorker}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                languageSkills={selectedWorker?.skills || []}
            />
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-4xl">
                    <div className="flex items-center gap-4">
                        <Link href="/owner/jobs" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Users className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">Đơn ứng tuyển</h1>
                                <p className="text-sm text-slate-600">{job?.title}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-700">{pendingApps.length}</p>
                        <p className="text-sm text-yellow-600">Chờ duyệt</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">{approvedApps.length}</p>
                        <p className="text-sm text-green-600">Đã duyệt</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-slate-700">{rejectedApps.length}</p>
                        <p className="text-sm text-slate-600">Từ chối</p>
                    </div>
                </div>

                {/* Applications List */}
                {applications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Chưa có đơn ứng tuyển
                        </h3>
                        <p className="text-slate-500">
                            Đơn ứng tuyển sẽ hiển thị ở đây khi có người apply
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div
                                key={app.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div
                                            className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => viewWorkerProfile(app.worker, app.language_skills)}
                                        >
                                            {app.worker.full_name?.charAt(0) || '?'}
                                        </div>

                                        {/* Worker Info */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3
                                                    className="font-semibold text-slate-900 cursor-pointer hover:underline"
                                                    onClick={() => viewWorkerProfile(app.worker, app.language_skills)}
                                                >
                                                    {app.worker.full_name}
                                                </h3>
                                                {getStatusBadge(app.status, app.is_instant_book)}
                                            </div>

                                            {/* Reliability Score */}
                                            <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
                                                <Star className="w-4 h-4 text-yellow-500" />
                                                <span>Điểm tin cậy: <strong>{app.worker.reliability_score}</strong></span>
                                            </div>

                                            {/* Language Skills */}
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {app.language_skills.map((skill: any, i: number) => (
                                                    <span
                                                        key={i}
                                                        className={`px-2 py-1 text-xs rounded-full ${skill.verification_status === 'verified'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-slate-100 text-slate-600'
                                                            }`}
                                                    >
                                                        {getLanguageLabel(skill.language_type || skill.language)} - {skill.level.toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Applied Time */}
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    Ứng tuyển {new Date(app.applied_at).toLocaleString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-blue-600 text-xs"
                                            onClick={() => viewWorkerProfile(app.worker, app.language_skills)}
                                        >
                                            Xem hồ sơ
                                        </Button>

                                        {app.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReject(app.id)}
                                                    disabled={processing === app.id}
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    {processing === app.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <X className="w-4 h-4 mr-1" />
                                                            Từ chối
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(app.id)}
                                                    disabled={processing === app.id}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {processing === app.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Check className="w-4 h-4 mr-1" />
                                                            Duyệt
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
