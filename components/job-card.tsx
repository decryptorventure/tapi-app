'use client';

import { Job } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { useJobQualification, useApplyToJob } from '@/hooks/use-job-matching';
import { useAuth } from '@/hooks/use-auth';
import { Clock, DollarSign, Sparkles, Loader2, CheckCircle2, AlertCircle, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job & {
    restaurant_name?: string;
    thumbnail_url?: string | null;
    owner?: {
      restaurant_name?: string;
      restaurant_logo_url?: string | null;
      restaurant_cover_urls?: string[];
    };
  };
  variant?: 'card' | 'list';
  onClick?: () => void;
}

export const JobCard = memo(function JobCard({ job, variant = 'card', onClick }: JobCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const { data: qualification } = useJobQualification(
    job.id,
    user?.id || null
  );
  const applyMutation = useApplyToJob();

  const handleApply = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('handleApply aborted: No user ID');
      }
      return;
    }
    applyMutation.mutate({ jobId: job.id, workerId: user.id });
  }, [user?.id, job.id, applyMutation]);

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/worker/job/${job.id}`);
    }
  }, [onClick, router, job.id]);

  const isInstantBook = qualification?.qualification.qualifiesForInstantBook;
  const dateLocale = locale === 'vi' ? vi : enUS;
  const currencyLocale = locale === 'vi' ? 'vi-VN' : 'en-US';

  // List variant - compact horizontal layout
  if (variant === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="group bg-card rounded-xl border border-border p-4 card-hover cursor-pointer flex items-center gap-4"
        role="article"
        aria-label={`${t('common.jobs')}: ${job.title}`}
      >
        {/* Logo Container with Fallback */}
        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border flex items-center justify-center">
          {job.owner?.restaurant_logo_url || job.thumbnail_url ? (
            <img
              src={job.owner?.restaurant_logo_url || job.thumbnail_url || ''}
              alt={job.restaurant_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary/30 font-bold text-xl">
              {job.restaurant_name?.charAt(0)}
            </span>
          )}
        </div>

        {/* Left: Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
            {isInstantBook && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                Instant
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {job.restaurant_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.restaurant_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(job.shift_date), 'dd/MM', { locale: dateLocale })} • {job.shift_start_time.slice(0, 5)}
            </span>
          </div>
        </div>

        {/* Center: Pay */}
        <div className="text-right shrink-0">
          <p className="font-bold text-primary text-lg">
            {(job.hourly_rate_vnd / 1000).toFixed(0)}k<span className="text-xs font-normal text-muted-foreground">/h</span>
          </p>
          <span className={cn(
            "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
            job.required_language === 'japanese' && "bg-blue-50 text-blue-600",
            job.required_language === 'korean' && "bg-rose-50 text-rose-600",
            job.required_language === 'english' && "bg-emerald-50 text-emerald-600"
          )}>
            {t(`feed.${job.required_language}`)}
          </span>
        </div>

        {/* Right: Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
    );
  }

  // Card variant - full layout (default)
  const thumbnailImage = job.thumbnail_url || job.owner?.restaurant_cover_urls?.[0] || job.owner?.restaurant_logo_url;

  return (
    <div
      onClick={handleCardClick}
      className="group bg-card rounded-2xl border border-border overflow-hidden card-hover cursor-pointer"
      role="article"
      aria-label={`${t('common.jobs')}: ${job.title}`}
    >
      {/* Thumbnail Image - Taimee style */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {thumbnailImage ? (
          <img
            src={thumbnailImage}
            alt={job.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-cta/20 flex items-center justify-center">
            <span className="text-4xl font-black text-primary/30">{job.title?.charAt(0)}</span>
          </div>
        )}

        {/* Instant Book Badge */}
        {isInstantBook && (
          <span className="absolute top-2 left-2 inline-flex items-center px-2 py-1 rounded-lg bg-success text-white text-xs font-semibold shadow-lg">
            <Sparkles className="w-3 h-3 mr-1" />
            Instant
          </span>
        )}

        {/* Time Badge */}
        <span className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-lg">
          {job.shift_start_time?.slice(0, 5)}
        </span>

        {/* Restaurant Logo Badge */}
        {job.owner?.restaurant_logo_url && (
          <div className="absolute bottom-2 right-2 w-10 h-10 rounded-xl bg-white shadow-xl overflow-hidden border-2 border-white ring-1 ring-black/5 group-hover:scale-110 transition-transform z-10">
            <img
              src={job.owner.restaurant_logo_url}
              alt={job.restaurant_name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-cta text-white text-sm font-bold rounded-lg shadow-lg">
          {(job.hourly_rate_vnd / 1000).toFixed(0)}k đ/h
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header Section */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground mb-1.5 line-clamp-2">
              {job.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {job.description || '\u00A0'}
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
              {job.hourly_rate_vnd.toLocaleString(currencyLocale)} VNĐ/{t('jobs.hour') || 'giờ'}
            </span>
          </div>

          {job.dress_code && (
            <div className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
              <span className="font-semibold text-foreground">{t('jobs.dressCode')}:</span> {job.dress_code}
            </div>
          )}
        </div>

        {/* Qualification Feedback - Enhanced */}
        {qualification && qualification.feedback && (
          <div className={`mb-4 p-4 rounded-xl border text-sm ${isInstantBook
            ? 'bg-success/10 border-success/20 text-success'
            : 'bg-warning/10 border-warning/20 text-warning-foreground'
            }`}>
            {isInstantBook ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                <span className="font-medium">{t('matching.instantBookSuccess')}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                  <span>{t('matching.requestBookRequired')}</span>
                </div>
                {Array.isArray(qualification.feedback) && qualification.feedback.length > 0 && (
                  <ul className="ml-7 space-y-1 text-muted-foreground">
                    {qualification.feedback.map((f: string) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-warning" />
                        {t(f)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleApply}
          disabled={applyMutation.isPending || qualification?.hasApplied}
          variant={
            qualification?.hasApplied
              ? "outline"
              : isInstantBook ? "success" : "cta"
          }
          size="lg"
          className="w-full"
        >
          {applyMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </>
          ) : qualification?.hasApplied ? (
            qualification.applicationStatus === 'pending' ? (
              <>
                <Clock className="w-4 h-4" />
                Đang chờ duyệt
              </>
            ) : qualification.applicationStatus === 'approved' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Đã nhận
              </>
            ) : (
              'Đã ứng tuyển'
            )
          ) : isInstantBook ? (
            <>
              <Sparkles className="w-4 h-4" />
              Nhận job ngay
            </>
          ) : (
            'Gửi yêu cầu'
          )}
        </Button>
      </div>
    </div>
  );
});
