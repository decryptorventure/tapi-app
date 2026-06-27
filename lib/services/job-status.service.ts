import { createClient } from '@/lib/supabase/client';
import { JobStatus } from '@/types/database.types';

const SLOT_STATUSES = ['approved', 'working', 'completed'] as const;
const ACTIVE_STATUSES = ['approved', 'working'] as const;

/**
 * Derive job status from application counts and sync current_workers.
 * Single source of truth — call after any application status change.
 */
export async function syncJobStatus(
  jobId: string
): Promise<{ success: boolean; status?: JobStatus; error?: string }> {
  const supabase = createClient();

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, status, max_workers')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return { success: false, error: jobError?.message || 'Job not found' };
  }

  if (job.status === 'cancelled') {
    return { success: true, status: 'cancelled' };
  }

  const { data: apps, error: appsError } = await supabase
    .from('job_applications')
    .select('status')
    .eq('job_id', jobId);

  if (appsError) {
    return { success: false, error: appsError.message };
  }

  const filledSlots = (apps || []).filter((a) =>
    SLOT_STATUSES.includes(a.status as (typeof SLOT_STATUSES)[number])
  ).length;
  const activeSlots = (apps || []).filter((a) =>
    ACTIVE_STATUSES.includes(a.status as (typeof ACTIVE_STATUSES)[number])
  ).length;
  const completedSlots = (apps || []).filter((a) => a.status === 'completed').length;

  let newStatus: JobStatus;

  if (filledSlots > 0 && activeSlots === 0 && filledSlots === completedSlots) {
    newStatus = 'completed';
  } else if (filledSlots >= job.max_workers) {
    newStatus = 'filled';
  } else if (job.status === 'expired') {
    newStatus = 'expired';
  } else {
    newStatus = 'open';
  }

  const { error: updateError } = await supabase
    .from('jobs')
    .update({
      current_workers: filledSlots,
      status: newStatus,
    })
    .eq('id', jobId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, status: newStatus };
}

/** Repair stale open/filled/expired jobs for an owner (e.g. on page load). */
export async function syncOwnerJobStatuses(
  ownerId: string,
  options?: { shiftDate?: string }
): Promise<void> {
  const supabase = createClient();

  let query = supabase
    .from('jobs')
    .select('id')
    .eq('owner_id', ownerId)
    .in('status', ['open', 'filled', 'expired']);

  if (options?.shiftDate) {
    query = query.eq('shift_date', options.shiftDate);
  }

  const { data: jobs } = await query;

  await Promise.all((jobs || []).map((j) => syncJobStatus(j.id)));
}
