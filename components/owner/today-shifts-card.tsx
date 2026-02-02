'use client';

import Link from 'next/link';
import { Clock, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Shift {
    id: string;
    title: string;
    shift_start_time: string;
    shift_end_time: string;
    current_workers: number;
    max_workers: number;
}

interface TodayShiftsCardProps {
    shifts: Shift[];
}

export function TodayShiftsCard({ shifts }: TodayShiftsCardProps) {
    if (shifts.length === 0) return null;

    return (
        <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Ca làm hôm nay
                </h3>
                <Link href="/owner/shifts" className="text-xs text-primary hover:underline">
                    Xem tất cả
                </Link>
            </div>
            <div className="space-y-2">
                {shifts.map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="text-center min-w-[50px]">
                                <p className="text-base font-bold text-foreground">{shift.shift_start_time?.slice(0, 5)}</p>
                                <p className="text-[10px] text-muted-foreground">{shift.shift_end_time?.slice(0, 5)}</p>
                            </div>
                            <div className="border-l border-border pl-3">
                                <p className="text-sm font-medium text-foreground">{shift.title}</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {shift.current_workers || 0}/{shift.max_workers} nhân viên
                                </p>
                            </div>
                        </div>
                        <Link href={`/owner/jobs/${shift.id}/qr`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <QrCode className="w-4 h-4" />
                                QR
                            </Button>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
