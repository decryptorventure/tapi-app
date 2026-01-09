'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCompletionBannerProps {
  completionPercentage: number;
  role: 'worker' | 'owner';
  missingItems?: string[];
  canApply?: boolean;
  canPostJobs?: boolean;
  className?: string;
}

/**
 * ProfileCompletionBanner Component
 * Displays profile completion progress with soft block messaging
 * Shows on job feed when profile is incomplete
 */
export function ProfileCompletionBanner({
  completionPercentage,
  role,
  missingItems = [],
  canApply = false,
  canPostJobs = false,
  className,
}: ProfileCompletionBannerProps) {
  const requiredPercentage = role === 'worker' ? 80 : 70;
  const isComplete = completionPercentage >= requiredPercentage;

  // Determine banner color based on completion
  const getProgressColor = () => {
    if (completionPercentage >= 80) return 'bg-green-500';
    if (completionPercentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  // Get next steps based on role
  const getNextSteps = () => {
    if (role === 'worker') {
      return {
        title: 'Hoàn thiện hồ sơ để ứng tuyển',
        description:
          'Bạn cần hoàn thiện ít nhất 80% hồ sơ để có thể ứng tuyển công việc',
        actionText: 'Hoàn thiện hồ sơ',
        actionHref: '/onboarding/worker/profile',
        items: missingItems.length
          ? missingItems
          : [
            'Thêm ngày sinh',
            'Xác minh kỹ năng ngôn ngữ',
            'Xác minh danh tính (CCCD/Passport)',
          ],
      };
    } else {
      return {
        title: 'Hoàn thiện hồ sơ để đăng tin tuyển dụng',
        description:
          'Bạn cần hoàn thiện ít nhất 70% hồ sơ để có thể đăng tin tuyển dụng',
        actionText: 'Hoàn thiện hồ sơ',
        actionHref: '/onboarding/owner/profile',
        items: missingItems.length
          ? missingItems
          : ['Thêm thông tin nhà hàng', 'Xác minh giấy phép kinh doanh'],
      };
    }
  };

  const nextSteps = getNextSteps();

  // If profile is complete, show success banner
  if (isComplete) {
    return (
      <div
        className={cn(
          'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6',
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Hồ sơ đã hoàn thiện!
            </h3>
            <p className="text-sm text-slate-700 mb-2">
              {role === 'worker'
                ? 'Bạn có thể ứng tuyển tất cả các công việc trên Tapy'
                : 'Bạn có thể đăng tin tuyển dụng và quản lý ứng viên'}
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <div className="h-2 flex-1 bg-green-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span>{completionPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show incomplete profile banner
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 mb-6',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-orange-600" />
        </div>

        <div className="flex-1">
          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {nextSteps.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-700 mb-3">
            {nextSteps.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Tiến độ hoàn thiện
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {completionPercentage}%
              </span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  getProgressColor()
                )}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Cần {requiredPercentage - completionPercentage}% nữa để{' '}
              {role === 'worker' ? 'ứng tuyển' : 'đăng tin'}
            </p>
          </div>

          {/* Missing Items */}
          {nextSteps.items.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Các bước cần hoàn thành:
              </p>
              <ul className="space-y-1">
                {nextSteps.items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center text-sm text-slate-600"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-400 mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Button */}
          <Link
            href={nextSteps.actionHref}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-600 transition-all shadow-sm hover:shadow-md"
          >
            {nextSteps.actionText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
