'use client';

import { Job } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { useJobQualification, useApplyToJob } from '@/hooks/use-job-matching';
import { useAuth } from '@/hooks/use-auth';
import { Clock, DollarSign, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { memo, useCallback } from 'react';

interface JobCardProps {
  job: Job;
}

export const JobCard = memo(function JobCard({ job }: JobCardProps) {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const { data: qualification } = useJobQualification(
    job.id,
    user?.id || null
  );
  const applyMutation = useApplyToJob();

  const handleApply = useCallback(() => {
    if (!user?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('handleApply aborted: No user ID');
      }
      return;
    }
    applyMutation.mutate({ jobId: job.id, workerId: user.id });
  }, [user?.id, job.id, applyMutation]);

  const isInstantBook = qualification?.qualification.qualifiesForInstantBook;

  // Extremely lenient check for testing
  const canApply = (qualification?.canApply !== false) && !applyMutation.isPending;

  const dateLocale = locale === 'vi' ? vi : enUS;
  const currencyLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const currencySymbol = locale === 'vi' ? 'VNĐ' : 'VND';

  return (
    <div
      className="group bg-card rounded-2xl border border-border p-6 card-hover"
      role="article"
      aria-label={`${t('common.jobs')}: ${job.title}`}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground mb-1.5 line-clamp-2">
            {job.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Language Badges */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
            {t(`feed.${job.required_language}`)}
          </span>
          {job.required_language_level && (
            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-cta/10 text-cta text-xs font-semibold">
              {job.required_language_level.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Job Details Section */}
      <div className="space-y-2.5 mb-4 pb-4 border-b border-border">
        <div className="flex items-center text-sm text-foreground">
          <Clock className="w-4 h-4 mr-2.5 text-muted-foreground" />
          <span className="font-semibold">
            {format(new Date(job.shift_date), 'dd/MM/yyyy', { locale: dateLocale })}
          </span>
          <span className="mx-2 text-border">•</span>
          <span className="font-medium">{job.shift_start_time} - {job.shift_end_time}</span>
        </div>

        <div className="flex items-center text-sm">
          <DollarSign className="w-4 h-4 mr-2.5 text-muted-foreground" />
          <span className="font-bold text-primary">
            {job.hourly_rate_vnd.toLocaleString(currencyLocale)} {currencySymbol}/{t('jobs.hour') || 'giờ'}
          </span>
        </div>

        {job.dress_code && (
          <div className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
            <span className="font-semibold text-foreground">{t('jobs.dressCode')}:</span> {job.dress_code}
          </div>
        )}
      </div>

      {/* Qualification Feedback */}
      {qualification && qualification.feedback && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${isInstantBook
          ? 'bg-success/10 text-success'
          : 'bg-muted text-muted-foreground'
          }`}>
          <div className="leading-relaxed">
            {Array.isArray(qualification.feedback) ? (
              <>
                {qualification.feedback.length === 1 && qualification.feedback[0] === 'matching.instantBookSuccess' ? (
                  t('matching.instantBookSuccess')
                ) : (
                  <div>
                    <span className="font-semibold text-foreground">{t('matching.needImprovement')}</span>
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
        variant={isInstantBook ? "success" : "cta"}
        size="lg"
        className="w-full"
        aria-label={isInstantBook ? t('jobs.instantBook') : t('jobs.sendRequest')}
      >
        {applyMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('jobs.processing')}
          </>
        ) : isInstantBook ? (
          <>
            <Sparkles className="w-4 h-4" />
            {t('jobs.instantBook')}
          </>
        ) : (
          t('jobs.sendRequest')
        )}
      </Button>
    </div>
  );
});


