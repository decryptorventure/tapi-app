import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Skeleton */}
      <div className="bg-card/80 border-b border-border px-4 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-16 h-6" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="bg-primary pt-8 pb-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <Skeleton className="w-32 h-4 bg-white/20" />
            <Skeleton className="w-48 h-8 bg-white/30" />
            <Skeleton className="w-24 h-6 bg-white/20 rounded-full" />
          </div>
          <Skeleton className="w-64 h-24 bg-white/20 rounded-2xl" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 space-y-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="w-full h-64 rounded-2xl" />
            <Skeleton className="w-full h-96 rounded-2xl" />
          </div>
          {/* Sidebar */}
          <div className="space-y-6">
            <Skeleton className="w-full h-48 rounded-2xl" />
            <Skeleton className="w-full h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
