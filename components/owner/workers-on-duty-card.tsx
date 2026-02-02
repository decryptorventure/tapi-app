'use client';

import Image from 'next/image';
import { Users } from 'lucide-react';

interface WorkerOnDuty {
    id: string;
    worker_id: string;
    worker_name: string;
    worker_avatar: string | null;
    job_title: string;
    checkin_time: string;
}

interface WorkersOnDutyCardProps {
    workers: WorkerOnDuty[];
    onViewWorker: (workerId: string) => void;
}

export function WorkersOnDutyCard({ workers, onViewWorker }: WorkersOnDutyCardProps) {
    if (workers.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-success/10 to-emerald-500/10 border border-success/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/20 rounded-xl">
                        <Users className="w-5 h-5 text-success" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Workers đang làm</h3>
                        <p className="text-xs text-muted-foreground">{workers.length} người đã check-in hôm nay</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-success font-semibold">Live</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {workers.slice(0, 5).map((worker) => (
                    <div
                        key={worker.id}
                        className="flex items-center gap-2 bg-card/80 px-3 py-2 rounded-lg cursor-pointer hover:bg-card transition-colors"
                        onClick={() => onViewWorker(worker.worker_id)}
                    >
                        {worker.worker_avatar ? (
                            <Image
                                src={worker.worker_avatar}
                                alt={worker.worker_name}
                                width={24}
                                height={24}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-xs font-bold text-success">
                                {worker.worker_name.charAt(0)}
                            </div>
                        )}
                        <span className="text-sm font-medium text-foreground">{worker.worker_name}</span>
                        <span className="text-xs text-muted-foreground">• {worker.job_title}</span>
                    </div>
                ))}
                {workers.length > 5 && (
                    <div className="flex items-center gap-1 px-3 py-2 text-sm text-success">
                        +{workers.length - 5} khác
                    </div>
                )}
            </div>
        </div>
    );
}
