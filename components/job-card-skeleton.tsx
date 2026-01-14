interface JobCardSkeletonProps {
  variant?: 'card' | 'list';
}

/**
 * Skeleton loader for JobCard component
 * Supports both card and list variants
 */
export function JobCardSkeleton({ variant = 'card' }: JobCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <div
        className="bg-card rounded-xl border border-border p-4 animate-pulse flex items-center gap-4"
        role="status"
        aria-label="Đang tải công việc..."
      >
        {/* Logo */}
        <div className="w-12 h-12 bg-muted rounded-lg shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>

        {/* Price */}
        <div className="text-right shrink-0 space-y-1">
          <div className="h-6 bg-muted rounded w-16" />
          <div className="h-5 bg-muted rounded w-12" />
        </div>

        {/* Arrow */}
        <div className="w-5 h-5 bg-muted rounded shrink-0" />

        <span className="sr-only">Đang tải thông tin công việc...</span>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div
      className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse"
      role="status"
      aria-label="Đang tải công việc..."
    >
      {/* Thumbnail */}
      <div className="aspect-[16/10] bg-muted w-full" />

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <div className="h-6 w-16 bg-primary/10 rounded-lg" />
            <div className="h-6 w-12 bg-cta/10 rounded-lg" />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2.5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-40" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        </div>

        {/* Button */}
        <div className="h-11 bg-muted rounded-lg w-full" />
      </div>

      <span className="sr-only">Đang tải thông tin công việc...</span>
    </div>
  );
}
