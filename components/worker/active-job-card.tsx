'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, MapPin, QrCode, Timer, PlayCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Job {
    id: string;
    title: string;
    shift_start_time: string;
    shift_end_time: string;
    shift_date: string;
    hourly_rate_vnd: number;
    owner?: {
        restaurant_name?: string;
        restaurant_address?: string;
    };
}

interface ActiveJobCardProps {
    application: {
        id: string;
        status: string;
        jobs: Job;
        checkin_time?: string; // Time when checked in
    };
    onCheckout?: () => void;
}

export function ActiveJobCard({ application, onCheckout }: ActiveJobCardProps) {
    const { jobs: job, status, checkin_time } = application;
    const [timeElapsed, setTimeElapsed] = useState('00:00:00');
    const [timeRemaining, setTimeRemaining] = useState('');
    const [isOvertime, setIsOvertime] = useState(false);

    useEffect(() => {
        if (status !== 'working' || !checkin_time) return;

        const updateTimer = () => {
            const now = new Date();
            const checkinDate = new Date(checkin_time);

            // Calculate time elapsed since check-in
            const elapsed = Math.floor((now.getTime() - checkinDate.getTime()) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            setTimeElapsed(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );

            // Calculate time remaining until shift end
            const shiftEnd = new Date(`${job.shift_date}T${job.shift_end_time}`);
            const remaining = Math.floor((shiftEnd.getTime() - now.getTime()) / 1000);

            if (remaining <= 0) {
                setIsOvertime(true);
                const overtime = Math.abs(remaining);
                const otHours = Math.floor(overtime / 3600);
                const otMinutes = Math.floor((overtime % 3600) / 60);
                setTimeRemaining(`+${otHours}h ${otMinutes}m overtime`);
            } else {
                setIsOvertime(false);
                const remHours = Math.floor(remaining / 3600);
                const remMinutes = Math.floor((remaining % 3600) / 60);
                setTimeRemaining(`${remHours}h ${remMinutes}m còn lại`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [status, checkin_time, job.shift_date, job.shift_end_time]);

    const formatTime = (time: string) => time.substring(0, 5);

    if (status !== 'working') return null;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-5 shadow-lg">
            {/* Header with Live Badge */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ĐANG LÀM VIỆC
                    </span>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    isOvertime
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}>
                    {timeRemaining}
                </div>
            </div>

            {/* Job Title */}
            <h3 className="text-lg font-bold text-foreground mb-2">{job.title}</h3>

            {/* Restaurant Info */}
            {job.owner?.restaurant_name && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{job.owner.restaurant_name}</span>
                </div>
            )}

            {/* Timer Display */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Thời gian làm việc
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <Timer className="w-6 h-6 text-blue-600" />
                        <span className="text-3xl font-mono font-bold text-foreground">
                            {timeElapsed}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Ca: {formatTime(job.shift_start_time)} - {formatTime(job.shift_end_time)}
                    </p>
                </div>
            </div>

            {/* Check-out Button */}
            <Link href="/worker/scan-qr" className="block">
                <Button
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
                >
                    <QrCode className="w-5 h-5 mr-2" />
                    Scan QR Check-out
                </Button>
            </Link>

            <p className="text-xs text-center text-muted-foreground mt-3">
                Quét mã QR tại nhà hàng để kết thúc ca làm
            </p>
        </div>
    );
}
