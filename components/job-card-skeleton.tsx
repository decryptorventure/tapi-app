export function JobCardSkeleton() {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse"
      role="status"
      aria-label="Đang tải công việc..."
    >
      {/* Header Section */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
          {/* Description */}
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-2/3"></div>
        </div>

        {/* Badges */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="h-6 w-12 bg-blue-100 rounded-md"></div>
          <div className="h-6 w-10 bg-orange-100 rounded-md"></div>
        </div>
      </div>

      {/* Job Details Section */}
      <div className="space-y-2.5 mb-4 pb-4 border-b border-slate-100">
        {/* Date/Time */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded w-48"></div>
        </div>

        {/* Hourly Rate */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded w-32"></div>
        </div>

        {/* Dress Code (optional) */}
        <div className="h-10 bg-slate-100 rounded-md w-full"></div>
      </div>

      {/* Qualification Feedback */}
      <div className="mb-4 h-12 bg-slate-100 rounded-lg"></div>

      {/* Action Button */}
      <div className="h-10 bg-slate-200 rounded-md w-full"></div>

      {/* Screen reader text */}
      <span className="sr-only">Đang tải thông tin công việc...</span>
    </div>
  );
}
