'use client';

import { useState, useMemo } from 'react';
import { JobCard } from '@/components/job-card';
import { JobCardSkeleton } from '@/components/job-card-skeleton';
import { ProfileCompletionBanner } from '@/components/shared/profile-completion-banner';
import { ViewModeToggle } from '@/components/shared/view-mode-toggle';
import { DatePickerHorizontal } from '@/components/shared/date-picker-horizontal';
import { createUntypedClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Job } from '@/types/database.types';
import { Briefcase, Search, X, SlidersHorizontal, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { isSameDay, format } from 'date-fns';

type ViewMode = 'grid' | 'list';

export default function JobFeedPage() {
    const supabase = createUntypedClient();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [filters, setFilters] = useState({
        language: 'all',
        minRate: 0,
        sortBy: 'newest'
    });

    // Fetch user profile with completion data
    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            return data;
        },
    });

    const { data: jobs, isLoading } = useQuery({
        queryKey: ['jobs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
          *,
          owner:profiles!owner_id (
            restaurant_name,
            restaurant_logo_url,
            restaurant_cover_urls
          )
        `)
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data as any[]).map(job => ({
                ...job,
                restaurant_name: job.owner?.restaurant_name || (t('jobs.restaurant') || 'Nhà hàng')
            })) as (Job & { restaurant_name: string })[];
        },
    });

    // Client-side filtering and sorting
    const filteredJobs = useMemo(() => {
        if (!jobs) return [];

        let result = [...jobs].filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesLanguage = filters.language === 'all' || job.required_language === filters.language;

            const matchesRate = job.hourly_rate_vnd >= filters.minRate;

            // Date filtering
            const matchesDate = !selectedDate || isSameDay(new Date(job.shift_date), selectedDate);

            return matchesSearch && matchesLanguage && matchesRate && matchesDate;
        });

        // Sorting
        if (filters.sortBy === 'rate_high') {
            result.sort((a, b) => b.hourly_rate_vnd - a.hourly_rate_vnd);
        } else if (filters.sortBy === 'date_soon') {
            result.sort((a, b) => new Date(a.shift_date).getTime() - new Date(b.shift_date).getTime());
        }

        return result;
    }, [jobs, searchTerm, filters, selectedDate, t]);

    // Determine if we should show the profile completion banner
    const isProfileComplete = profile?.profile_completion_percentage >= 80 || profile?.onboarding_completed;
    const shouldShowBanner = profile && profile.role && !isProfileComplete;
    const displayCompletion = (profile?.profile_completion_percentage === 0 && profile?.onboarding_completed)
        ? 85
        : (profile?.profile_completion_percentage || 0);

    // Calculate missing items for the banner
    const getMissingItems = () => {
        if (!profile) return [];
        const items: string[] = [];
        if (profile.role === 'worker') {
            if (!profile.date_of_birth) items.push(t('profileBanner.addDob'));
            if (!profile.can_apply) {
                items.push(t('profileBanner.verifyLanguage'));
                items.push(t('profileBanner.verifyIdentity'));
            }
        } else if (profile.role === 'owner') {
            if (!profile.restaurant_name || !profile.restaurant_address) {
                items.push(t('profileBanner.addRestaurantInfo'));
            }
            if (!profile.can_post_jobs) {
                items.push(t('profileBanner.verifyLicense'));
            }
        }
        return items;
    };

    return (
        <main className="min-h-screen bg-background">
            {/* Search and Discovery Header */}
            <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
                <div className="container mx-auto px-4 py-4 max-w-4xl">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-primary" />
                                </div>
                                <h1 className="text-xl font-bold text-foreground tracking-tight">
                                    {t('feed.jobs')}
                                </h1>
                            </div>

                            <div className="flex items-center gap-2">
                                <ViewModeToggle
                                    mode={viewMode}
                                    onChange={setViewMode}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn(showFilters && "bg-muted")}
                                >
                                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                                    {t('feed.filter')}
                                </Button>
                            </div>
                        </div>

                        {/* Date Picker - Taimee style */}
                        <DatePickerHorizontal
                            selectedDate={selectedDate || new Date()}
                            onDateChange={(date) => setSelectedDate(isSameDay(date, new Date()) ? null : date)}
                        />

                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={t('feed.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-card transition-all text-foreground"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>

                        {/* Filter Panel (Expandable) */}
                        {showFilters && (
                            <div className="p-4 bg-muted/50 rounded-xl border border-border animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">{t('feed.language')}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['all', 'japanese', 'korean', 'english'].map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => setFilters({ ...filters, language: lang })}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                                                        filters.language === lang
                                                            ? "bg-primary border-primary text-primary-foreground"
                                                            : "bg-card border-border text-foreground hover:border-primary"
                                                    )}
                                                >
                                                    {t(`feed.${lang}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">{t('feed.sortBy')}</label>
                                        <select
                                            value={filters.sortBy}
                                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                                            className="w-full p-2 bg-card border border-border rounded-lg text-sm transition-all focus:ring-2 focus:ring-primary outline-none text-foreground"
                                        >
                                            <option value="newest">{t('feed.sortNewest')}</option>
                                            <option value="rate_high">{t('feed.sortHighestPay')}</option>
                                            <option value="date_soon">{t('feed.sortSoonest')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">{t('feed.minWage')}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100000"
                                            step="10000"
                                            value={filters.minRate}
                                            onChange={(e) => setFilters({ ...filters, minRate: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1 uppercase font-bold">
                                            <span>0đ</span>
                                            <span className="text-primary">{filters.minRate.toLocaleString()}đ/h</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Profile Completion Banner */}
                {shouldShowBanner && profile && (
                    <ProfileCompletionBanner
                        completionPercentage={displayCompletion}
                        role={profile.role as 'worker' | 'owner'}
                        missingItems={getMissingItems()}
                        canApply={profile.can_apply || profile.onboarding_completed}
                        canPostJobs={profile.can_post_jobs || profile.role === 'owner'}
                        className="mb-8"
                    />
                )}

                {/* Results Info */}
                {!isLoading && (
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-foreground font-bold flex items-center gap-2">
                            {searchTerm || filters.language !== 'all' || filters.minRate > 0 ? (
                                <>
                                    <Filter className="w-4 h-4 text-primary" />
                                    {t('feed.results')}
                                </>
                            ) : (
                                t('feed.suggestions')
                            )}
                            <span className="text-sm font-normal text-muted-foreground">
                                ({filteredJobs.length} {t('feed.jobCount')})
                            </span>
                        </h2>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                            : "space-y-3"
                    )}>
                        {[...Array(4)].map((_, i) => (
                            <JobCardSkeleton key={i} variant={viewMode === 'grid' ? 'card' : 'list'} />
                        ))}
                    </div>
                )}

                {/* Job Cards */}
                {!isLoading && filteredJobs.length > 0 && (
                    <div className={cn(
                        "animate-stagger",
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                            : "space-y-3"
                    )}>
                        {filteredJobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                variant={viewMode === 'grid' ? 'card' : 'list'}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredJobs.length === 0 && (
                    <div className="text-center py-20 bg-card rounded-2xl border border-border">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                            <Search className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            {t('feed.noResults')}
                        </h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            {t('feed.noResultsDesc')}
                        </p>
                        {(searchTerm || filters.language !== 'all' || filters.minRate > 0) && (
                            <Button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilters({ language: 'all', minRate: 0, sortBy: 'newest' });
                                }}
                                variant="outline"
                            >
                                {t('feed.clearFilters')}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
