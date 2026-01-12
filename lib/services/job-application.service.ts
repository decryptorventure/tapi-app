import { createUntypedClient } from '@/lib/supabase/client';
import { evaluateWorkerQualification, getQualificationFeedback } from '@/lib/job-matching';
import { Job, JobApplication, Profile } from '@/types/database.types';

/**
 * Service for handling job applications with Instant Book logic
 */

interface ApplyToJobResult {
  success: boolean;
  application?: JobApplication;
  isInstantBook: boolean;
  message: string;
  error?: string;
}

/**
 * Apply to a job - returns Instant Book or Request status
 */
export async function applyToJob(
  jobId: string,
  workerId: string
): Promise<ApplyToJobResult> {
  const supabase = createUntypedClient();

  try {
    // 1. Fetch job details
    console.log('applyToJob - Step 1: Fetching job', jobId);
    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .limit(1);

    const job = jobs?.[0];

    if (jobError || !job) {
      console.error('applyToJob - Job not found', jobError);
      return {
        success: false,
        isInstantBook: false,
        message: 'Không tìm thấy công việc',
        error: jobError?.message,
      };
    }

    // 2. Check if job is still open
    if (job.status !== 'open') {
      return {
        success: false,
        isInstantBook: false,
        message: 'Công việc này không còn nhận đơn',
      };
    }

    // 3. Check if already applied
    console.log('applyToJob - Step 3: Checking existing application', { jobId, workerId });
    const { data: apps, error: existingError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('worker_id', workerId)
      .limit(1);

    const existingApp = apps?.[0];

    if (existingError) {
      console.error('Error checking existing application:', existingError);
    }

    if (existingApp) {
      console.log('Applying to job - Already applied', existingApp.id);
      return {
        success: false,
        isInstantBook: existingApp.is_instant_book,
        message: 'Bạn đã ứng tuyển công việc này rồi',
      };
    }

    // 4. Fetch worker profile with language skills
    console.log('applyToJob - Step 4: Fetching profile', workerId);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        language_skills!language_skills_user_id_fkey (
          language,
          level,
          verification_status
        )
      `)
      .eq('id', workerId)
      .limit(1);

    const workerProfile = profiles?.[0];

    if (profileError || !workerProfile) {
      console.error('applyToJob - Profile not found', profileError);
      return {
        success: false,
        isInstantBook: false,
        message: 'Không tìm thấy thông tin của bạn',
        error: profileError?.message,
      };
    }

    // 5. Evaluate qualification
    console.log('Applying to job - Step 5: Profile found', workerProfile.id);
    const workerProfileTyped = {
      reliability_score: workerProfile.reliability_score,
      is_account_frozen: workerProfile.is_account_frozen,
      frozen_until: workerProfile.frozen_until,
      is_verified: workerProfile.is_verified,
      language_skills: (workerProfile as any).language_skills || [],
    } as any;

    const qualification = evaluateWorkerQualification(
      workerProfileTyped as any,
      {
        required_language: job.required_language,
        required_language_level: job.required_language_level,
        min_reliability_score: job.min_reliability_score,
      }
    );

    const isInstantBook = qualification.qualifiesForInstantBook;
    console.log('Applying to job - Step 6: Qualification result', { isInstantBook });

    // 6. Create application
    const applicationData: Partial<JobApplication> = {
      job_id: jobId,
      worker_id: workerId,
      status: isInstantBook ? 'approved' : 'pending',
      is_instant_book: isInstantBook,
      applied_at: new Date().toISOString(),
      ...(isInstantBook && {
        approved_at: new Date().toISOString(),
        contract_signed_at: new Date().toISOString(),
      }),
    };

    console.log('Applying to job - Step 7: Inserting application', applicationData);
    const { data: insertedApps, error: insertError } = await supabase
      .from('job_applications')
      .insert(applicationData)
      .select()
      .limit(1);

    const application = insertedApps?.[0];

    if (insertError || !application) {
      console.error('Applying to job - FAILED at insert:', insertError);
      return {
        success: false,
        isInstantBook: false,
        message: 'Có lỗi xảy ra khi ứng tuyển: ' + (insertError?.message || 'Không thể tạo đơn'),
        error: insertError?.message,
      };
    }

    console.log('Applying to job - Step 8: Successfully inserted', application.id);

    // 7. If instant book, update job workers count and generate QR code
    if (isInstantBook) {
      // Update job workers count
      await supabase
        .from('jobs')
        .update({
          current_workers: job.current_workers + 1,
          ...(job.current_workers + 1 >= job.max_workers && { status: 'filled' }),
        })
        .eq('id', jobId);

      // Generate QR code for check-in
      const qrCode = await generateCheckInQRCode(application.id);

      await supabase
        .from('job_applications')
        .update({
          checkin_qr_code: qrCode,
          checkin_qr_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .eq('id', application.id);
    }

    return {
      success: true,
      application,
      isInstantBook,
      message: isInstantBook
        ? 'Bạn đã nhận job thành công!'
        : 'Đơn ứng tuyển đã được gửi. Chủ nhà hàng sẽ xem xét.',
    };

  } catch (error) {
    console.error('Error applying to job:', error);
    return {
      success: false,
      isInstantBook: false,
      message: 'Có lỗi xảy ra',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate QR code for check-in (mock implementation)
 */
async function generateCheckInQRCode(applicationId: string): Promise<string> {
  // In production, generate actual QR code using qrcode library
  // For now, return a unique token
  return `QR-${applicationId}-${Date.now()}`;
}

/**
 * Get qualification feedback for a worker viewing a job
 */
export async function getWorkerQualificationForJob(
  jobId: string,
  workerId: string
): Promise<{
  qualification: ReturnType<typeof evaluateWorkerQualification>;
  feedback: string | string[];
  canApply: boolean;
  hasApplied: boolean;
  applicationStatus?: string;
}> {
  const supabase = createUntypedClient();

  // Check if already applied
  const { data: existingApps } = await supabase
    .from('job_applications')
    .select('status')
    .eq('job_id', jobId)
    .eq('worker_id', workerId)
    .limit(1);

  const existingApp = existingApps?.[0];

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .limit(1);

  const job = jobs?.[0];

  if (!job) {
    throw new Error('Job not found');
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      *,
      language_skills!language_skills_user_id_fkey (
        language,
        level,
        verification_status
      )
    `)
    .eq('id', workerId)
    .limit(1);

  const workerProfile = profiles?.[0];

  if (!workerProfile) {
    throw new Error('Worker profile not found');
  }

  const workerProfileTyped = {
    reliability_score: workerProfile.reliability_score,
    is_account_frozen: workerProfile.is_account_frozen,
    frozen_until: workerProfile.frozen_until,
    is_verified: workerProfile.is_verified,
    language_skills: (workerProfile as any).language_skills || [],
  } as any;

  const qualification = evaluateWorkerQualification(
    workerProfileTyped as any,
    {
      required_language: job.required_language,
      required_language_level: job.required_language_level,
      min_reliability_score: job.min_reliability_score,
    }
  );

  return {
    qualification,
    feedback: getQualificationFeedback(qualification),
    canApply: job.status === 'open' && !workerProfile.is_account_frozen && !existingApp,
    hasApplied: !!existingApp,
    applicationStatus: existingApp?.status,
  };
}

/**
 * Owner approves a pending application
 */
export async function approveApplication(
  applicationId: string,
  ownerId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createUntypedClient();

  // Verify owner owns the job
  const { data: apps } = await supabase
    .from('job_applications')
    .select('*, jobs!inner(*)')
    .eq('id', applicationId)
    .limit(1);

  const application = apps?.[0];

  if (!application || (application as any).jobs.owner_id !== ownerId) {
    return {
      success: false,
      message: 'Bạn không có quyền phê duyệt đơn này',
    };
  }

  const { error } = await supabase
    .from('job_applications')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      contract_signed_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (error) {
    return {
      success: false,
      message: 'Có lỗi xảy ra khi phê duyệt',
    };
  }

  // Generate QR code
  const qrCode = await generateCheckInQRCode(applicationId);
  await supabase
    .from('job_applications')
    .update({
      checkin_qr_code: qrCode,
      checkin_qr_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', applicationId);

  return {
    success: true,
    message: 'Đã phê duyệt đơn ứng tuyển',
  };
}

