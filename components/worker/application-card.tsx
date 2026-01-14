'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Clock, DollarSign, Calendar, QrCode, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

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
  const { t, locale } = useTranslation();

  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {t('applicationCard.approved')}
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-warning/10 text-warning rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            {t('applicationCard.pending')}
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4" />
            {t('applicationCard.rejected')}
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {t('applicationCard.completed')}
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4" />
            {t('applicationCard.cancelled')}
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
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
    <div className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {job.title}
          </h3>
          <p className="text-muted-foreground font-medium">{job.owner?.restaurant_name || t('applicationCard.restaurant')}</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Job Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          {job.owner?.restaurant_address || t('applicationCard.noAddress')}
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          {formatDate(job.shift_date)}
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          {formatTime(job.shift_start_time)} - {formatTime(job.shift_end_time)}
        </div>

        <div className="flex items-center text-sm font-semibold text-foreground">
          <DollarSign className="h-4 w-4 mr-2 text-success" />
          {job.hourly_rate_vnd.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}{locale === 'vi' ? 'đ/giờ' : 'VND/hour'}
        </div>
      </div>

      {/* Instant Book Badge */}
      {is_instant_book && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg">
          <svg
            className="h-4 w-4 text-success"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
          <span className="text-sm font-medium text-success">
            {t('applicationCard.instantBook')}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-border">
        {status === 'approved' && (
          <>
            <Link href={`/worker/jobs/${application.id}/qr`} className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <QrCode className="h-4 w-4 mr-2" />
                {t('applicationCard.viewQr')}
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
            {t('applicationCard.waitingOwner')}
          </Button>
        )}

        {status === 'completed' && (
          <Link href={`/worker/jobs/${application.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              {t('applicationCard.viewDetails')}
            </Button>
          </Link>
        )}

        {status === 'rejected' && (
          <Link href={`/jobs/${job.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              {t('applicationCard.viewOtherJobs')}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
