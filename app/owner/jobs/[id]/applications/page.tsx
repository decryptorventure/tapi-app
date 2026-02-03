'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft,
    Users,
    Loader2,
    Check,
    X,
    Clock,
    Star,
    MessageSquare,
    Sparkles,
    Languages,
    Eye,
    UserCircle2,
    TrendingUp,
    CheckCircle2,
    UserX
} from 'lucide-react';
import { Job, JobApplication, Profile } from '@/types/database.types';
import { approveApplication } from '@/lib/services/job-application.service';
import { CheckinService } from '@/lib/services/checkin.service';

interface ApplicationWithWorker extends JobApplication {
    worker: Profile;
    language_skills: {
        language: string;
        level: string;
        verification_status: string;
    }[];
    last_checkin?: {
        type: 'checkin' | 'checkout';
        checkin_time: string;
    };
}

import { WorkerProfileModal } from '@/components/owner/worker-profile-modal';
import { ChatWindow } from '@/components/chat/chat-window';

export default function JobApplicationsPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<ApplicationWithWorker[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Chat state
    const [chatApplicationId, setChatApplicationId] = useState<string | null>(null);
    const [chatRecipientName, setChatRecipientName] = useState('');
    const [chatRecipientAvatar, setChatRecipientAvatar] = useState<string | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

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

    const openChat = (applicationId: string, workerName: string, workerAvatar: string | null) => {
        setChatApplicationId(applicationId);
        setChatRecipientName(workerName);
        setChatRecipientAvatar(workerAvatar);
        setIsChatOpen(true);
    };

    const fetchData = async () => {
        const supabase = createUntypedClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUserId(user.id);

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

                // Fetch checkins for check-in time display
                const appIds = apps.map(a => a.id);
                const { data: checkins } = await supabase
                    .from('checkins')
                    .select('application_id, type, checkin_time')
                    .in('application_id', appIds)
                    .order('checkin_time', { ascending: false });

                // Combine data with checkin info
                const appsWithWorkers = apps.map(app => {
                    // Find the most recent checkin for this application
                    const lastCheckin = checkins?.find(c => c.application_id === app.id);
                    return {
                        ...app,
                        worker: workers?.find(w => w.id === app.worker_id) || {} as Profile,
                        language_skills: skills?.filter(s => s.worker_id === app.worker_id) || [],
                        last_checkin: lastCheckin,
                    };
                });

                setApplications(appsWithWorkers);
            }
        } catch (error: any) {
            console.error('Fetch error:', error);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

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

    const handleMarkComplete = async (applicationId: string, workerId: string) => {
        setProcessing(applicationId);
        const supabase = createUntypedClient();

        try {
            // Update application status
            const { error } = await supabase
                .from('job_applications')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', applicationId);

            if (error) throw error;

            // Update worker reliability score (+1 for completion)
            const { data: profile } = await supabase
                .from('profiles')
                .select('reliability_score')
                .eq('id', workerId)
                .single();

            if (profile) {
                const newScore = Math.min(100, profile.reliability_score + 1);
                await supabase
                    .from('profiles')
                    .update({ reliability_score: newScore })
                    .eq('id', workerId);

                // Log to reliability_history with correct column names
                await supabase
                    .from('reliability_history')
                    .insert({
                        user_id: workerId,
                        score_change: 1,
                        previous_score: profile.reliability_score,
                        new_score: newScore,
                        reason: 'job_completed',
                    });
            }

            toast.success('Đã đánh dấu hoàn thành!');
            fetchData();
        } catch (error: any) {
            console.error('Complete error:', error);
            toast.error('Lỗi đánh dấu hoàn thành');
        } finally {
            setProcessing(null);
        }
    };

    const handleNoShow = async (applicationId: string) => {
        setProcessing(applicationId);

        try {
            const result = await CheckinService.processNoShow(applicationId);

            if (!result.success) {
                throw new Error(result.message);
            }

            toast.success('Đã ghi nhận vắng mặt');
            fetchData();
        } catch (error: any) {
            console.error('No-show error:', error);
            toast.error(error.message || 'Lỗi ghi nhận vắng mặt');
        } finally {
            setProcessing(null);
        }
    };

    const getLanguageConfig = (lang: string) => {
        const configs: Record<string, { label: string; color: string; bgColor: string }> = {
            japanese: { label: 'Tiếng Nhật', color: 'text-blue-700', bgColor: 'bg-blue-50' },
            korean: { label: 'Tiếng Hàn', color: 'text-rose-700', bgColor: 'bg-rose-50' },
            english: { label: 'Tiếng Anh', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
        };
        return configs[lang] || { label: lang, color: 'text-muted-foreground', bgColor: 'bg-muted' };
    };

    const getStatusBadge = (status: string, isInstantBook: boolean) => {
        if (status === 'pending') {
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-warning/10 text-warning inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Chờ duyệt
            </span>;
        } else if (status === 'approved') {
            return (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-success/10 text-success inline-flex items-center gap-1">
                    {isInstantBook && <Sparkles className="w-3 h-3" />}
                    {isInstantBook ? 'Instant Book' : 'Đã duyệt'}
                </span>
            );
        } else if (status === 'rejected') {
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-destructive inline-flex items-center gap-1">
                <X className="w-3 h-3" />
                Từ chối
            </span>;
        } else if (status === 'completed') {
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary inline-flex items-center gap-1">
                <Check className="w-3 h-3" />
                Hoàn thành
            </span>;
        } else if (status === 'working') {
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Đang làm
            </span>;
        } else if (status === 'no_show') {
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-destructive inline-flex items-center gap-1">
                <UserX className="w-3 h-3" />
                Vắng mặt
            </span>;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-cta" />
            </div>
        );
    }

    const pendingApps = applications.filter(a => a.status === 'pending');
    const approvedApps = applications.filter(a => a.status === 'approved' || a.status === 'working');
    const rejectedApps = applications.filter(a => a.status === 'rejected');

    return (
        <div className="min-h-screen bg-background">
            <WorkerProfileModal
                worker={selectedWorker}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                languageSkills={selectedWorker?.skills || []}
            />
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/80">
                <div className="container mx-auto px-4 py-4 max-w-4xl">
                    <div className="flex items-center gap-4">
                        <Link href="/owner/jobs" className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Link>
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-cta/10 rounded-lg">
                                <Users className="w-5 h-5 text-cta" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-foreground">Đơn ứng tuyển</h1>
                                <p className="text-sm text-muted-foreground">{job?.title}</p>
                            </div>
                        </div>
                        {/* Total count */}
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">{applications.length} đơn</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-card rounded-2xl border border-border p-6 card-hover">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-warning/10 rounded-xl">
                                <Clock className="w-5 h-5 text-warning" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-warning">{pendingApps.length}</p>
                        <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-6 card-hover">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-success/10 rounded-xl">
                                <Check className="w-5 h-5 text-success" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-success">{approvedApps.length}</p>
                        <p className="text-sm text-muted-foreground">Đã duyệt</p>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-6 card-hover">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-muted rounded-xl">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-muted-foreground">{rejectedApps.length}</p>
                        <p className="text-sm text-muted-foreground">Từ chối</p>
                    </div>
                </div>

                {/* Applications List */}
                {applications.length === 0 ? (
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted/30 rounded-2xl flex items-center justify-center">
                            <Users className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            Chưa có đơn ứng tuyển
                        </h3>
                        <p className="text-muted-foreground">
                            Đơn ứng tuyển sẽ hiển thị ở đây khi có người apply
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div
                                key={app.id}
                                className="bg-card rounded-2xl shadow-sm border border-border p-6 card-hover"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Avatar */}
                                        <button
                                            onClick={() => viewWorkerProfile(app.worker, app.language_skills)}
                                            className="flex-shrink-0 group"
                                        >
                                            {app.worker.avatar_url ? (
                                                <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
                                                    <Image
                                                        src={app.worker.avatar_url}
                                                        alt={app.worker.full_name || 'Worker'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-border group-hover:ring-primary transition-all">
                                                    {app.worker.full_name?.charAt(0) || <UserCircle2 className="w-7 h-7" />}
                                                </div>
                                            )}
                                        </button>

                                        {/* Worker Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <button
                                                    onClick={() => viewWorkerProfile(app.worker, app.language_skills)}
                                                    className="font-bold text-foreground hover:text-primary transition-colors"
                                                >
                                                    {app.worker.full_name}
                                                </button>
                                                {getStatusBadge(app.status, app.is_instant_book)}
                                            </div>

                                            {/* Reliability Score */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex items-center gap-1 px-2.5 py-1 bg-warning/10 rounded-lg">
                                                    <Star className="w-4 h-4 text-warning fill-warning" />
                                                    <span className="text-sm font-semibold text-warning">{app.worker.reliability_score}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">điểm tin cậy</span>
                                            </div>

                                            {/* Language Skills */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {app.language_skills.map((skill: any, i: number) => {
                                                    const langConfig = getLanguageConfig(skill.language_type || skill.language);
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${langConfig.bgColor} ${skill.verification_status === 'verified' ? 'ring-2 ring-success/20' : ''}`}
                                                        >
                                                            <Languages className={`w-3.5 h-3.5 ${langConfig.color}`} />
                                                            <span className={`text-xs font-medium ${langConfig.color}`}>
                                                                {langConfig.label} - {skill.level.toUpperCase()}
                                                            </span>
                                                            {skill.verification_status === 'verified' && (
                                                                <Check className="w-3 h-3 text-success" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Applied Time */}
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>
                                                    Ứng tuyển {new Date(app.applied_at).toLocaleString('vi-VN')}
                                                </span>
                                            </div>

                                            {/* Check-in Time (if available) */}
                                            {app.last_checkin && (
                                                <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>
                                                        {app.last_checkin.type === 'checkin' ? 'Check-in' : 'Check-out'}: {new Date(app.last_checkin.checkin_time).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => viewWorkerProfile(app.worker, app.language_skills)}
                                            className="min-w-[100px]"
                                        >
                                            <Eye className="w-4 h-4 mr-1.5" />
                                            Xem hồ sơ
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openChat(app.id, app.worker.full_name, app.worker.avatar_url || null)}
                                            className="min-w-[100px]"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-1.5" />
                                            Nhắn tin
                                        </Button>

                                        {app.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReject(app.id)}
                                                    disabled={processing === app.id}
                                                    className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
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
                                                    variant="default"
                                                    onClick={() => handleApprove(app.id)}
                                                    disabled={processing === app.id}
                                                    className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
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

                                        {app.status === 'approved' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleNoShow(app.id)}
                                                    disabled={processing === app.id}
                                                    className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
                                                >
                                                    {processing === app.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <UserX className="w-4 h-4 mr-1" />
                                                            Vắng mặt
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleMarkComplete(app.id, app.worker_id)}
                                                    disabled={processing === app.id}
                                                    className="flex-1 bg-primary hover:bg-primary/90"
                                                >
                                                    {processing === app.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                                            Hoàn thành
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

            {/* Chat Window */}
            {chatApplicationId && currentUserId && (
                <ChatWindow
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    applicationId={chatApplicationId}
                    currentUserId={currentUserId}
                    recipientName={chatRecipientName}
                    recipientAvatar={chatRecipientAvatar}
                />
            )}
        </div>
    );
}
