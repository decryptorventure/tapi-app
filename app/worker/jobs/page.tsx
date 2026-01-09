'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createUntypedClient } from '@/lib/supabase/client';
import { ApplicationCard } from '@/components/worker/application-card';
import { Briefcase, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'upcoming' | 'pending' | 'completed';

export default function MyJobsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const supabase = createUntypedClient();

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
            restaurant_name,
            location,
            hourly_rate,
            shift_start_time,
            shift_end_time,
            shift_date
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
      label: 'Sắp tới',
      icon: Briefcase,
      count: applications?.filter(app => app.status === 'approved').length || 0,
    },
    {
      value: 'pending' as TabType,
      label: 'Chờ duyệt',
      icon: Clock,
      count: applications?.filter(app => app.status === 'pending').length || 0,
    },
    {
      value: 'completed' as TabType,
      label: 'Hoàn thành',
      icon: CheckCircle2,
      count: applications?.filter(app => app.status === 'completed').length || 0,
    },
  ];

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'upcoming':
        return {
          title: 'Chưa có công việc sắp tới',
          description: 'Các công việc đã được chấp nhận sẽ hiển thị ở đây',
        };
      case 'pending':
        return {
          title: 'Chưa có yêu cầu chờ duyệt',
          description: 'Ứng tuyển công việc để bắt đầu',
        };
      case 'completed':
        return {
          title: 'Chưa hoàn thành công việc nào',
          description: 'Lịch sử công việc của bạn sẽ hiển thị ở đây',
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Công việc của tôi
          </h1>
          <p className="text-slate-600">
            Quản lý các công việc đã ứng tuyển
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap',
                  'border-b-2 -mb-px',
                  activeTab === tab.value
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-semibold',
                      activeTab === tab.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
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
              {activeTab === 'upcoming' && (
                <Briefcase className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              )}
              {activeTab === 'pending' && (
                <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              )}
              {activeTab === 'completed' && (
                <CheckCircle2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              )}
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
                  Tìm công việc
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
