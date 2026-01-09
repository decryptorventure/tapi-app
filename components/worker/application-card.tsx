'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Clock, DollarSign, Calendar, QrCode, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JobOwner {
  restaurant_name?: string;
  restaurant_address?: string;
}

interface Job {
  id: string;
  title: string;
  description?: string;
  hourly_rate_vnd: number;
  shift_start_time: string;
  shift_end_time: string;
  shift_date: string;
  owner?: JobOwner;
}

interface Application {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  is_instant_book?: boolean;
  checkin_qr_code?: string;
  jobs: Job;
}

interface ApplicationCardProps {
  application: Application;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const { jobs: job, status, is_instant_book } = application;

  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Đã chấp nhận
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            Chờ duyệt
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Bị từ chối
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Hoàn thành
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Đã hủy
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Extract HH:mm from HH:mm:ss
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {job.title}
          </h3>
          <p className="text-slate-600 font-medium">{job.owner?.restaurant_name || 'Nhà hàng'}</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Job Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-slate-600">
          <MapPin className="h-4 w-4 mr-2 text-slate-400" />
          {job.owner?.restaurant_address || 'Địa chỉ chưa cập nhật'}
        </div>

        <div className="flex items-center text-sm text-slate-600">
          <Calendar className="h-4 w-4 mr-2 text-slate-400" />
          {formatDate(job.shift_date)}
        </div>

        <div className="flex items-center text-sm text-slate-600">
          <Clock className="h-4 w-4 mr-2 text-slate-400" />
          {formatTime(job.shift_start_time)} - {formatTime(job.shift_end_time)}
        </div>

        <div className="flex items-center text-sm font-semibold text-slate-900">
          <DollarSign className="h-4 w-4 mr-2 text-green-600" />
          {job.hourly_rate_vnd.toLocaleString('vi-VN')}đ/giờ
        </div>
      </div>

      {/* Instant Book Badge */}
      {is_instant_book && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <svg
            className="h-4 w-4 text-green-600"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
          <span className="text-sm font-medium text-green-700">
            Instant Book
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
        {status === 'approved' && (
          <>
            <Link href={`/worker/jobs/${application.id}/qr`} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                <QrCode className="h-4 w-4 mr-2" />
                Xem QR Code
              </Button>
            </Link>
          </>
        )}

        {status === 'pending' && (
          <Button
            variant="outline"
            className="flex-1"
            disabled
          >
            Đang chờ owner xác nhận
          </Button>
        )}

        {status === 'completed' && (
          <Link href={`/worker/jobs/${application.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Xem chi tiết
            </Button>
          </Link>
        )}

        {status === 'rejected' && (
          <Link href={`/jobs/${job.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Xem công việc khác
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
