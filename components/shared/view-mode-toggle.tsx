'use client';

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

interface ViewModeToggleProps {
    mode: ViewMode;
    onChange: (mode: ViewMode) => void;
    className?: string;
}

export function ViewModeToggle({ mode, onChange, className }: ViewModeToggleProps) {
    return (
        <div className={cn("flex items-center bg-muted rounded-lg p-1", className)}>
            <button
                onClick={() => onChange('grid')}
                className={cn(
                    "p-2 rounded-md transition-all",
                    mode === 'grid'
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Grid view"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
            <button
                onClick={() => onChange('list')}
                className={cn(
                    "p-2 rounded-md transition-all",
                    mode === 'list'
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
            >
                <List className="w-4 h-4" />
            </button>
        </div>
    );
}
