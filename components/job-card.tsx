'use client';

import { Job } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { useJobQualification, useApplyToJob } from '@/hooks/use-job-matching';
import { useAuth } from '@/hooks/use-auth';
import { Clock, DollarSign, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const { data: qualification } = useJobQualification(
    job.id,
    user?.id || null
  );
  const applyMutation = useApplyToJob();

  const handleApply = () => {
    console.log('handleApply clicked', { userId: user?.id, jobId: job.id });
    if (!user?.id) {
      console.warn('handleApply aborted: No user ID');
      return;
    }
    applyMutation.mutate({ jobId: job.id, workerId: user.id });
  };

  const isInstantBook = qualification?.qualification.qualifiesForInstantBook;

  // Extremely lenient check for testing
  const canApply = (qualification?.canApply !== false) && !applyMutation.isPending;

  const dateLocale = locale === 'vi' ? vi : enUS;
  const currencyLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const currencySymbol = locale === 'vi' ? 'VNĐ' : 'VND';

  return (
    <div
      className="group bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
      role="article"
      aria-label={`${t('common.jobs')}: ${job.title}`}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-slate-900 mb-1.5 line-clamp-2">
            {job.title}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Language Badges */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
            {t(`feed.${job.required_language}`)}
          </span>
          {job.required_language_level && (
            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200">
              {job.required_language_level.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Job Details Section */}
      <div className="space-y-2.5 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center text-sm text-slate-700">
          <Clock className="w-4 h-4 mr-2.5 text-slate-400" />
          <span className="font-medium">
            {format(new Date(job.shift_date), 'dd/MM/yyyy', { locale: dateLocale })}
          </span>
          <span className="mx-2 text-slate-300">•</span>
          <span>{job.shift_start_time} - {job.shift_end_time}</span>
        </div>

        <div className="flex items-center text-sm text-slate-700">
          <DollarSign className="w-4 h-4 mr-2.5 text-slate-400" />
          <span className="font-semibold text-primary">
            {job.hourly_rate_vnd.toLocaleString(currencyLocale)} {currencySymbol}/{t('jobs.hour') || 'giờ'}
          </span>
        </div>

        {job.dress_code && (
          <div className="text-sm text-slate-600 bg-slate-50 rounded-md px-3 py-2">
            <span className="font-medium text-slate-700">{t('jobs.dressCode')}:</span> {job.dress_code}
          </div>
        )}
      </div>

      {/* Qualification Feedback */}
      {qualification && qualification.feedback && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${isInstantBook
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-slate-50 text-slate-700 border border-slate-200'
          }`}>
          <div className="leading-relaxed">
            {Array.isArray(qualification.feedback) ? (
              <>
                {qualification.feedback.length === 1 && qualification.feedback[0] === 'matching.instantBookSuccess' ? (
                  t('matching.instantBookSuccess')
                ) : (
                  <div>
                    <span className="font-medium">{t('matching.needImprovement')}</span>
                    <ul className="list-disc list-inside ml-1 mt-1">
                      {qualification.feedback.map((f: string) => (
                        <li key={f}>{t(f)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              t(qualification.feedback)
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleApply();
        }}
        disabled={applyMutation.isPending}
        className={`w-full transition-all duration-200 font-medium ${isInstantBook
          ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-sm hover:shadow-md text-white'
          : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md text-white'
          }`}
        aria-label={isInstantBook ? t('jobs.instantBook') : t('jobs.sendRequest')}
      >
        {applyMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('jobs.processing')}
          </>
        ) : isInstantBook ? (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            {t('jobs.instantBook')}
          </>
        ) : (
          t('jobs.sendRequest')
        )}
      </Button>
    </div>
  );
}


