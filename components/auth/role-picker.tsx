'use client';

import React, { useState } from 'react';
import { Search, Briefcase, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RolePickerProps {
  onRoleSelect: (role: 'worker' | 'owner' | 'skip') => void;
  allowSkip?: boolean;
  title?: string;
  subtitle?: string;
}

/**
 * RolePicker Component
 * Two-card role selection UI for signup flow
 * Allows users to choose between Worker and Owner roles
 */
export function RolePicker({
  onRoleSelect,
  allowSkip = true,
  title = 'Bạn muốn tham gia Tapy với vai trò gì?',
  subtitle = 'Chọn vai trò phù hợp với nhu cầu của bạn',
}: RolePickerProps) {
  const [selectedRole, setSelectedRole] = useState<'worker' | 'owner' | null>(null);

  const handleRoleClick = (role: 'worker' | 'owner') => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  const handleSkip = () => {
    onRoleSelect('skip');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-600">{subtitle}</p>
      </div>

      {/* Role Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Worker Card */}
        <button
          onClick={() => handleRoleClick('worker')}
          className={cn(
            'relative p-8 rounded-2xl border-2 transition-all duration-200 text-left',
            'hover:shadow-lg hover:-translate-y-1',
            selectedRole === 'worker'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-blue-300'
          )}
          aria-pressed={selectedRole === 'worker'}
        >
          {/* Selection Indicator */}
          {selectedRole === 'worker' && (
            <div className="absolute top-4 right-4 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {/* Icon */}
          <div
            className={cn(
              'h-16 w-16 rounded-xl flex items-center justify-center mb-4 transition-colors',
              selectedRole === 'worker'
                ? 'bg-blue-500'
                : 'bg-blue-100 group-hover:bg-blue-200'
            )}
          >
            <Search
              className={cn(
                'h-8 w-8',
                selectedRole === 'worker' ? 'text-white' : 'text-blue-600'
              )}
            />
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Tôi đang tìm việc
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            Tìm kiếm các công việc bán thời gian tại nhà hàng Nhật Bản và Hàn Quốc
          </p>

          {/* Features */}
          <ul className="space-y-2">
            <li className="flex items-center text-sm text-slate-700">
              <svg
                className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Ứng tuyển nhanh chóng
            </li>
            <li className="flex items-center text-sm text-slate-700">
              <svg
                className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Xác minh kỹ năng ngôn ngữ
            </li>
            <li className="flex items-center text-sm text-slate-700">
              <svg
                className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              QR check-in tiện lợi
            </li>
          </ul>
        </button>

        {/* Owner Card */}
        <button
          onClick={() => handleRoleClick('owner')}
          className={cn(
            'relative p-8 rounded-2xl border-2 transition-all duration-200 text-left',
            'hover:shadow-lg hover:-translate-y-1',
            selectedRole === 'owner'
              ? 'border-orange-500 bg-orange-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-orange-300'
          )}
          aria-pressed={selectedRole === 'owner'}
        >
          {/* Selection Indicator */}
          {selectedRole === 'owner' && (
            <div className="absolute top-4 right-4 h-6 w-6 bg-orange-500 rounded-full flex items-center justify-center">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {/* Icon */}
          <div
            className={cn(
              'h-16 w-16 rounded-xl flex items-center justify-center mb-4 transition-colors',
              selectedRole === 'owner'
                ? 'bg-orange-500'
                : 'bg-orange-100 group-hover:bg-orange-200'
            )}
          >
            <Briefcase
              className={cn(
                'h-8 w-8',
                selectedRole === 'owner' ? 'text-white' : 'text-orange-600'
              )}
            />
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Tôi cần tuyển nhân viên
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            Đăng tin tuyển dụng và tìm nhân viên phù hợp cho nhà hàng
          </p>

          {/* Features */}
          <ul className="space-y-2">
            <li className="flex items-center text-sm text-slate-700">
              <svg
                className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Đăng tin tuyển dụng nhanh
            </li>
            <li className="flex items-center text-sm text-slate-700">
              <svg
                className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Quản lý ứng viên dễ dàng
            </li>
            <li className="flex items-center text-sm text-slate-700">
              <svg
                className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Xác minh giấy phép kinh doanh
            </li>
          </ul>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-4">
        {/* Confirm Button */}
        {selectedRole && (
          <button
            onClick={handleConfirm}
            className="w-full max-w-md bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Tiếp tục với vai trò{' '}
            {selectedRole === 'worker' ? 'Người tìm việc' : 'Nhà tuyển dụng'}
            <ArrowRight className="h-5 w-5" />
          </button>
        )}

        {/* Skip Button */}
        {allowSkip && (
          <button
            onClick={handleSkip}
            className="text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
          >
            Bỏ qua - Xem danh sách việc làm trước
          </button>
        )}
      </div>
    </div>
  );
}
