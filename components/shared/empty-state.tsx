'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    /** Icon to display */
    icon: LucideIcon;
    /** Main title */
    title: string;
    /** Description text */
    description?: string;
    /** Primary action button */
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: LucideIcon;
    };
    /** Additional className */
    className?: string;
}

/**
 * Standardized empty state component
 * Use for lists, feeds, and data tables with no data
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('p-12 text-center flex flex-col items-center gap-4', className)}>
            <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center">
                <Icon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
                <p className="text-foreground font-bold text-lg mb-1">{title}</p>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {action && (
                action.href ? (
                    <Link href={action.href} className="mt-4">
                        <Button variant="cta">
                            {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                            {action.label}
                        </Button>
                    </Link>
                ) : (
                    <Button variant="cta" onClick={action.onClick} className="mt-4">
                        {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                        {action.label}
                    </Button>
                )
            )}
        </div>
    );
}
