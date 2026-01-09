'use client';

import { Job } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { useJobQualification, useApplyToJob } from '@/hooks/use-job-matching';
import { useAuth } from '@/hooks/use-auth';
import { Clock, DollarSign, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const { user } = useAuth();
  const { data: qualification } = useJobQualification(
    job.id,
    user?.id || null
  );
  const applyMutation = useApplyToJob();

  const handleApply = () => {
    if (!user?.id) return;
    applyMutation.mutate({ jobId: job.id, workerId: user.id });
  };

  const isInstantBook = qualification?.qualification.qualifiesForInstantBook;
  const canApply = qualification?.canApply && !applyMutation.isPending;

  return (
    <div
      className="group bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
      role="article"
      aria-label={`Công việc: ${job.title}`}
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
            {job.required_language.toUpperCase()}
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
            {format(new Date(job.shift_date), 'dd/MM/yyyy', { locale: vi })}
          </span>
          <span className="mx-2 text-slate-300">•</span>
          <span>{job.shift_start_time} - {job.shift_end_time}</span>
        </div>

        <div className="flex items-center text-sm text-slate-700">
          <DollarSign className="w-4 h-4 mr-2.5 text-slate-400" />
          <span className="font-semibold text-primary">
            {job.hourly_rate_vnd.toLocaleString('vi-VN')} VNĐ/giờ
          </span>
        </div>

        {job.dress_code && (
          <div className="text-sm text-slate-600 bg-slate-50 rounded-md px-3 py-2">
            <span className="font-medium text-slate-700">Trang phục:</span> {job.dress_code}
          </div>
        )}
      </div>

      {/* Qualification Feedback */}
      {qualification && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          isInstantBook
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-slate-50 text-slate-700 border border-slate-200'
        }`}>
          <p className="leading-relaxed">{qualification.feedback}</p>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={handleApply}
        disabled={!canApply || applyMutation.isPending}
        className={`w-full transition-all duration-200 font-medium ${
          isInstantBook
            ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-sm hover:shadow-md'
            : 'bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md'
        }`}
        aria-label={isInstantBook ? 'Đặt chỗ ngay lập tức' : 'Gửi yêu cầu ứng tuyển'}
      >
        {applyMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Đang xử lý...
          </>
        ) : isInstantBook ? (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Đặt chỗ ngay
          </>
        ) : (
          'Gửi yêu cầu'
        )}
      </Button>
    </div>
  );
}

