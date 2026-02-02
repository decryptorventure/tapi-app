'use client';

import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/animated-counter';

interface OwnerStatCardProps {
    icon: LucideIcon;
    label: string;
    value: number;
    iconColorClass: string; // e.g. 'text-primary', 'text-warning', 'text-success'
}

export function OwnerStatCard({ icon: Icon, label, value, iconColorClass }: OwnerStatCardProps) {
    const bgColorClass = iconColorClass.replace('text-', 'bg-') + '/10';

    return (
        <div className="bg-card rounded-2xl border border-border p-3 md:p-6 card-hover">
            <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className={`p-2 md:p-3 ${bgColorClass} rounded-xl`}>
                    <Icon className={`w-4 h-4 md:w-6 md:h-6 ${iconColorClass}`} />
                </div>
            </div>
            <p className="text-[10px] md:text-sm text-muted-foreground mb-1">{label}</p>
            <AnimatedCounter
                value={value}
                className={`text-xl md:text-4xl font-bold ${iconColorClass === 'text-foreground' ? 'text-foreground' : iconColorClass} block`}
            />
        </div>
    );
}
