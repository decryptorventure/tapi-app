'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/shared/animated-counter';

export interface StatCardProps {
    title: string;
    value: number;
    icon: ReactNode;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
    iconClassName?: string;
    formatValue?: (value: number) => string;
}

export function StatCard({
    title,
    value,
    icon,
    description,
    trend,
    className,
    iconClassName,
    formatValue,
}: StatCardProps) {
    return (
        <div className={cn(
            "bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors",
            className
        )}>
            <div className="flex items-center justify-between mb-3">
                <div className={cn(
                    "p-2.5 rounded-lg",
                    iconClassName || "bg-primary/10"
                )}>
                    {icon}
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                        trend.isPositive
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                    )}>
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                    {formatValue ? (
                        formatValue(value)
                    ) : (
                        <AnimatedCounter value={value} />
                    )}
                </p>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

// Compact version for grid displays
export function StatCardCompact({
    title,
    value,
    icon,
    className,
    iconClassName,
}: Pick<StatCardProps, 'title' | 'value' | 'icon' | 'className' | 'iconClassName'>) {
    return (
        <div className={cn(
            "bg-card rounded-lg border border-border p-3 flex items-center gap-3",
            className
        )}>
            <div className={cn(
                "p-2 rounded-lg shrink-0",
                iconClassName || "bg-muted"
            )}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{title}</p>
                <p className="text-lg font-bold text-foreground">
                    <AnimatedCounter value={value} />
                </p>
            </div>
        </div>
    );
}
