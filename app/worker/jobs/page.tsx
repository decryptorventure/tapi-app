'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createUntypedClient } from '@/lib/supabase/client';
import { ApplicationCard } from '@/components/worker/application-card';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t('myJobs.title')}
          </h1>
          <p className="text-slate-600">
            {t('myJobs.desc')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all",
                  isActive
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px]",
                    isActive ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'upcoming' && <Briefcase className="w-8 h-8 text-slate-300" />}
                {activeTab === 'pending' && <Clock className="w-8 h-8 text-slate-300" />}
                {activeTab === 'completed' && <CheckCircle2 className="w-8 h-8 text-slate-300" />}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {getEmptyMessage().title}
              </h3>
              <p className="text-slate-600 mb-6">
                {getEmptyMessage().description}
              </p>
              {activeTab !== 'completed' && (
                <Link
                  href="/worker/feed"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm hover:shadow-md"
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
