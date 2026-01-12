'use client';

import { useState, useRef, useEffect } from 'react';
import { format, addDays, isSameDay, isToday } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerHorizontalProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    daysToShow?: number;
    className?: string;
}

export function DatePickerHorizontal({
    selectedDate,
    onDateChange,
    daysToShow = 14,
    className
}: DatePickerHorizontalProps) {
    const { locale } = useTranslation();
    const dateLocale = locale === 'vi' ? vi : enUS;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const dates = Array.from({ length: daysToShow }, (_, i) => addDays(new Date(), i));

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            setTimeout(checkScroll, 300);
        }
    };

    return (
        <div className={cn("relative", className)}>
            {/* Scroll buttons */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-card shadow-md rounded-full flex items-center justify-center border border-border hover:bg-muted transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
            )}

            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-card shadow-md rounded-full flex items-center justify-center border border-border hover:bg-muted transition-colors"
                >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
            )}

            {/* Date scroll container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-2 overflow-x-auto scrollbar-hide px-2 py-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {dates.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isTodayDate = isToday(date);

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onDateChange(date)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[56px] h-[68px] rounded-xl border-2 transition-all shrink-0",
                                isSelected
                                    ? "bg-cta border-cta text-white"
                                    : "bg-card border-border hover:border-primary"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-medium uppercase",
                                isSelected ? "text-white/80" : "text-muted-foreground"
                            )}>
                                {isTodayDate
                                    ? (locale === 'vi' ? 'Hôm nay' : 'Today')
                                    : format(date, 'EEE', { locale: dateLocale })
                                }
                            </span>
                            <span className={cn(
                                "text-xl font-bold",
                                isSelected ? "text-white" : "text-foreground"
                            )}>
                                {format(date, 'd')}
                            </span>
                            <span className={cn(
                                "text-[10px]",
                                isSelected ? "text-white/70" : "text-muted-foreground"
                            )}>
                                {format(date, 'MMM', { locale: dateLocale })}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
