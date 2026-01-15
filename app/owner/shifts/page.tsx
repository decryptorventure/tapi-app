'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    Calendar,
    Clock,
    Users,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    QrCode,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Shift {
    id: string;
    title: string;
    shift_date: string;
    shift_start_time: string;
    shift_end_time: string;
    current_workers: number;
    max_workers: number;
    status: string;
}

export default function OwnerShiftsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekDays, setWeekDays] = useState<Date[]>([]);

    useEffect(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        setWeekDays(eachDayOfInterval({ start, end }));
    }, [selectedDate]);

    useEffect(() => {
        fetchShifts();
    }, [selectedDate]);

    const fetchShifts = async () => {
        const supabase = createUntypedClient();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('owner_id', user.id)
                .eq('shift_date', dateStr)
                .order('shift_start_time', { ascending: true });

            if (error) throw error;
            setShifts(data || []);
        } catch (error) {
            console.error('Fetch shifts error:', error);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const goToPreviousWeek = () => {
        setSelectedDate(subDays(selectedDate, 7));
    };

    const goToNextWeek = () => {
        setSelectedDate(addDays(selectedDate, 7));
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
                return <AlertCircle className="w-4 h-4 text-warning" />;
            case 'filled':
                return <CheckCircle2 className="w-4 h-4 text-success" />;
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-primary" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-destructive" />;
            default:
                return null;
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            open: 'Đang mở',
            filled: 'Đủ người',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
        };
        return labels[status] || status;
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/owner/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Calendar className="w-5 h-5 text-primary" />
                                </div>
                                <h1 className="text-xl font-bold text-foreground">Lịch ca làm</h1>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Hôm nay
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
                {/* Week Navigation */}
                <div className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={goToPreviousWeek}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <h2 className="font-bold text-foreground">
                            {format(weekDays[0] || selectedDate, 'MMMM yyyy', { locale: vi })}
                        </h2>
                        <button
                            onClick={goToNextWeek}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Day Pills */}
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${isSelected
                                            ? 'bg-primary text-primary-foreground'
                                            : isToday
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-muted text-foreground'
                                        }`}
                                >
                                    <span className="text-xs font-medium opacity-70">
                                        {format(day, 'EEE', { locale: vi })}
                                    </span>
                                    <span className="text-lg font-bold">
                                        {format(day, 'd')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Shifts for Selected Day */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h3 className="font-bold text-foreground">
                            {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : shifts.length === 0 ? (
                        <div className="p-12 text-center">
                            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">Không có ca làm nào</p>
                            <Link href="/owner/jobs/new">
                                <Button>Tạo tin tuyển dụng</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {shifts.map((shift) => (
                                <div key={shift.id} className="p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[60px]">
                                                <p className="text-xl font-bold text-foreground">
                                                    {shift.shift_start_time?.slice(0, 5)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {shift.shift_end_time?.slice(0, 5)}
                                                </p>
                                            </div>
                                            <div className="border-l border-border pl-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getStatusIcon(shift.status)}
                                                    <p className="font-bold text-foreground">{shift.title}</p>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {shift.current_workers || 0}/{shift.max_workers}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${shift.status === 'open' ? 'bg-warning/10 text-warning' :
                                                            shift.status === 'filled' ? 'bg-success/10 text-success' :
                                                                shift.status === 'completed' ? 'bg-primary/10 text-primary' :
                                                                    'bg-destructive/10 text-destructive'
                                                        }`}>
                                                        {getStatusLabel(shift.status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link href={`/owner/jobs/${shift.id}/qr`}>
                                                <Button variant="outline" size="sm">
                                                    <QrCode className="w-4 h-4 mr-1" />
                                                    QR
                                                </Button>
                                            </Link>
                                            <Link href={`/owner/jobs/${shift.id}/applications`}>
                                                <Button variant="default" size="sm">
                                                    Xem đơn
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
