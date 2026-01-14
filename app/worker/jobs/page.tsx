'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createUntypedClient } from '@/lib/supabase/client';
import { ApplicationCard } from '@/components/worker/application-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type TabType = 'upcoming' | 'pending' | 'completed';

export default function MyJobsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const supabase = createUntypedClient();
  const { t } = useTranslation();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-applications', activeTab],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let statusFilter: string[];
      if (activeTab === 'upcoming') {
        statusFilter = ['approved'];
      } else if (activeTab === 'pending') {
        statusFilter = ['pending'];
      } else {
        statusFilter = ['completed'];
      }

      const { data } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            title,
            description,
            hourly_rate_vnd,
            shift_start_time,
            shift_end_time,
            shift_date,
            owner_id,
            owner:profiles!jobs_owner_id_fkey (
              restaurant_name,
              restaurant_address
            )
          )
        `)
        .eq('worker_id', user.id)
        .in('status', statusFilter)
        .order('created_at', { ascending: false });

      return data || [];
    },
  });

  const tabs = [
    {
      value: 'upcoming' as TabType,
      label: t('myJobs.upcoming'),
      icon: Briefcase,
      count: applications?.filter(app => app.status === 'approved').length || 0,
    },
    {
      value: 'pending' as TabType,
      label: t('myJobs.pending'),
      icon: Clock,
      count: applications?.filter(app => app.status === 'pending').length || 0,
    },
    {
      value: 'completed' as TabType,
      label: t('myJobs.completed'),
      icon: CheckCircle2,
      count: applications?.filter(app => app.status === 'completed').length || 0,
    },
  ];

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'upcoming':
        return {
          title: t('myJobs.noUpcoming'),
          description: t('myJobs.noUpcomingDesc'),
        };
      case 'pending':
        return {
          title: t('myJobs.noPending'),
          description: t('myJobs.noPendingDesc'),
        };
      case 'completed':
        return {
          title: t('myJobs.noCompleted'),
          description: t('myJobs.noCompletedDesc'),
        };
      default:
        return { title: '', description: '' };
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('myJobs.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('myJobs.desc')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px]",
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-7 w-24 rounded-full" />
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-border">
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : applications && applications.length > 0 ? (
          <div className="space-y-4 animate-stagger">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'upcoming' && <Briefcase className="w-8 h-8 text-muted-foreground" />}
                {activeTab === 'pending' && <Clock className="w-8 h-8 text-muted-foreground" />}
                {activeTab === 'completed' && <CheckCircle2 className="w-8 h-8 text-muted-foreground" />}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getEmptyMessage().title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {getEmptyMessage().description}
              </p>
              {activeTab !== 'completed' && (
                <Link
                  href="/worker/feed"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                >
                  {t('worker.findJobs')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
