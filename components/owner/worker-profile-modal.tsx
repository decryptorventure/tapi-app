'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    User,
    Languages,
    Star,
    Video,
    Award,
    CheckCircle2,
    Clock,
    Calendar,
    Contact,
    Heart,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { createUntypedClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface WorkerProfileModalProps {
    worker: any;
    isOpen: boolean;
    onClose: () => void;
    languageSkills: any[];
}

export function WorkerProfileModal({ worker, isOpen, onClose, languageSkills }: WorkerProfileModalProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [savingFavorite, setSavingFavorite] = useState(false);

    useEffect(() => {
        if (worker?.id && isOpen) {
            checkFavoriteStatus();
        }
    }, [worker?.id, isOpen]);

    const checkFavoriteStatus = async () => {
        const supabase = createUntypedClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('favorite_workers')
                .select('id')
                .eq('owner_id', user.id)
                .eq('worker_id', worker.id)
                .single();

            setIsFavorite(!!data);
        } catch (error) {
            setIsFavorite(false);
        }
    };

    const toggleFavorite = async () => {
        const supabase = createUntypedClient();
        setSavingFavorite(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (isFavorite) {
                await supabase
                    .from('favorite_workers')
                    .delete()
                    .eq('owner_id', user.id)
                    .eq('worker_id', worker.id);
                setIsFavorite(false);
                toast.success('Đã xóa khỏi yêu thích');
            } else {
                await supabase
                    .from('favorite_workers')
                    .insert({ owner_id: user.id, worker_id: worker.id });
                setIsFavorite(true);
                toast.success('Đã thêm vào yêu thích');
            }
        } catch (error) {
            toast.error('Lỗi cập nhật');
        } finally {
            setSavingFavorite(false);
        }
    };

    if (!worker) return null;

    const getLanguageLabel = (lang: string) => {
        const labels: Record<string, string> = {
            japanese: 'Tiếng Nhật',
            korean: 'Tiếng Hàn',
            english: 'Tiếng Anh',
        };
        return labels[lang] || lang;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Contact className="w-5 h-5 text-blue-600" />
                        Hồ sơ ứng viên
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Header Brief */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 rounded-full bg-slate-200 shrink-0 overflow-hidden border-4 border-white shadow-sm">
                            {worker.avatar_url ? (
                                <img src={worker.avatar_url} alt={worker.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <User className="w-12 h-12" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-900">{worker.full_name}</h2>
                                {worker.is_verified && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3 h-3" /> Đã xác minh
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                <p className="flex items-center gap-1.5 font-medium">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    Tin cậy: <span className="text-slate-900">{worker.reliability_score}/100</span>
                                </p>
                                <p className="flex items-center gap-1.5 font-medium">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {worker.university_name || 'Hồ sơ chưa cập nhật trường'}
                                </p>
                            </div>
                            <p className="text-slate-600 text-sm italic leading-relaxed bg-slate-50 p-3 rounded-lg border-l-4 border-slate-200">
                                &quot;{worker.bio || 'Chưa có giới thiệu bản thân.'}&quot;
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Language Section */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Languages className="w-4 h-4 text-blue-600" /> Kỹ năng ngôn ngữ
                            </h3>
                            <div className="space-y-2">
                                {languageSkills.length > 0 ? (
                                    languageSkills.map((skill, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {getLanguageLabel(skill.language_type)}
                                                </p>
                                                <p className="text-xs text-slate-500 font-bold uppercase">{skill.level}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {skill.is_verified ? (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold">Xác minh</span>
                                                ) : (
                                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md font-bold italic">Chờ duyệt</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Chưa có thông tin ngôn ngữ</p>
                                )}
                            </div>
                        </div>

                        {/* Video Section */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Video className="w-4 h-4 text-blue-600" /> Video giới thiệu
                            </h3>
                            {worker.intro_video_url ? (
                                <div className="rounded-xl overflow-hidden bg-black aspect-video shadow-md border border-slate-200">
                                    <video src={worker.intro_video_url} controls className="w-full h-full" />
                                </div>
                            ) : (
                                <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 flex-col gap-2">
                                    <Video className="w-8 h-8 opacity-20" />
                                    <p className="text-xs italic">Không có video giới thiệu</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-between">
                        <Button
                            variant="outline"
                            onClick={toggleFavorite}
                            disabled={savingFavorite}
                            className={`rounded-xl px-6 ${isFavorite ? 'text-rose-500 border-rose-200 bg-rose-50 hover:bg-rose-100' : ''}`}
                        >
                            {savingFavorite ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-rose-500' : ''}`} />
                            )}
                            {isFavorite ? 'Yêu thích' : 'Thêm yêu thích'}
                        </Button>
                        <Button onClick={onClose} className="rounded-xl px-8">Đóng</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
