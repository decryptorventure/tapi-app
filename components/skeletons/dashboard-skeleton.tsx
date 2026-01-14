'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard loading skeleton for worker dashboard page
 */
export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Hero Section Skeleton */}
            <div className="bg-primary pt-8 pb-20 px-4 relative overflow-hidden">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="text-white">
                        <Skeleton className="h-4 w-24 bg-white/10 mb-2" />
                        <Skeleton className="h-8 w-48 bg-white/20 mb-3" />
                        <Skeleton className="h-6 w-32 bg-white/10 rounded-full" />
                    </div>
                    <Skeleton className="h-24 w-48 bg-white/10 rounded-2xl" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-5xl mx-auto px-4 -mt-10 space-y-6 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card Skeleton */}
                        <div className="bg-card rounded-2xl border border-border overflow-hidden">
                            <Skeleton className="h-14 w-full" />
                            <div className="p-6">
                                <Skeleton className="h-6 w-3/4 mb-4" />
                                <div className="flex gap-2 mb-6">
                                    <Skeleton className="h-8 w-32 rounded-lg" />
                                    <Skeleton className="h-8 w-28 rounded-lg" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                            </div>
                        </div>

                        {/* Recent History Skeleton */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <div className="flex justify-between items-center mb-6">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-6 w-20 rounded-lg" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex justify-between items-center p-4 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-11 h-11 rounded-lg" />
                                            <div>
                                                <Skeleton className="h-4 w-32 mb-2" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Skeleton className="h-6 w-16 rounded-md mb-1" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Wallet Card Skeleton */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <Skeleton className="h-5 w-24 mb-6" />
                            <Skeleton className="h-3 w-32 mb-2" />
                            <Skeleton className="h-10 w-40 mb-6" />
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </div>
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>

                        {/* Hot Jobs Skeleton */}
                        <div className="bg-muted/50 rounded-2xl p-6 border border-border">
                            <Skeleton className="h-5 w-28 mb-4" />
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-card p-4 rounded-xl border border-border">
                                        <Skeleton className="h-3 w-24 mb-2" />
                                        <Skeleton className="h-4 w-40 mb-3" />
                                        <div className="flex justify-between items-center">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-8 w-16 rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardSkeleton;
