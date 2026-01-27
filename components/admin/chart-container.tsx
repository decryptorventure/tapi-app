'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ChartContainerProps {
    title: string;
    description?: string;
    children: ReactNode;
    loading?: boolean;
    className?: string;
    headerAction?: ReactNode;
}

export function ChartContainer({
    title,
    description,
    children,
    loading,
    className,
    headerAction,
}: ChartContainerProps) {
    return (
        <div className={cn(
            "bg-card rounded-xl border border-border",
            className
        )}>
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                {headerAction}
            </div>

            <div className="p-4 min-h-[200px]">
                {loading ? (
                    <div className="flex items-center justify-center h-[200px]">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

// Simple funnel visualization
export interface FunnelData {
    stage: string;
    count: number;
    percentage: number;
}

export function ConversionFunnel({ data }: { data: FunnelData[] }) {
    const maxCount = Math.max(...data.map(d => d.count));

    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={item.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{item.stage}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-foreground font-semibold">{item.count.toLocaleString()}</span>
                            <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded-full",
                                index === 0
                                    ? "bg-primary/10 text-primary"
                                    : index === data.length - 1
                                        ? "bg-success/10 text-success"
                                        : "bg-warning/10 text-warning"
                            )}>
                                {item.percentage}%
                            </span>
                        </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                index === 0
                                    ? "bg-primary"
                                    : index === data.length - 1
                                        ? "bg-success"
                                        : "bg-warning"
                            )}
                            style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
