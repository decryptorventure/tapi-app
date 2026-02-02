'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional className */
    className?: string;
    /** Text to show below the spinner */
    text?: string;
}

/**
 * Standardized full-page loading spinner
 * Use this for async page loads and data fetching states
 */
export function PageLoader({ size = 'md', className, text }: PageLoaderProps) {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div className={cn('min-h-screen flex flex-col items-center justify-center bg-background', className)}>
            <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
            {text && (
                <p className="mt-3 text-sm text-muted-foreground">{text}</p>
            )}
        </div>
    );
}

/**
 * Inline loading spinner for buttons and smaller loading states
 */
export function LoadingSpinner({ size = 'md', className }: Pick<PageLoaderProps, 'size' | 'className'>) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    };

    return <Loader2 className={cn(sizeClasses[size], 'animate-spin', className)} />;
}
