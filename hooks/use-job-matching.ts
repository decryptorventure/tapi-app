import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applyToJob, getWorkerQualificationForJob, approveApplication } from '@/lib/services/job-application.service';
import { toast } from 'sonner';

/**
 * React Hook for Job Matching functionality
 */

export function useJobQualification(jobId: string | null, workerId: string | null) {
  return useQuery({
    queryKey: ['job-qualification', jobId, workerId],
    queryFn: () => {
      if (!jobId || !workerId) throw new Error('Missing jobId or workerId');
      return getWorkerQualificationForJob(jobId, workerId);
    },
    enabled: !!jobId && !!workerId,
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, workerId }: { jobId: string; workerId: string }) =>
      applyToJob(jobId, workerId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['job-applications'] });
        queryClient.invalidateQueries({ queryKey: ['job-qualification'] });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error('Có lỗi xảy ra khi ứng tuyển');
      console.error(error);
    },
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicationId, ownerId }: { applicationId: string; ownerId: string }) =>
      approveApplication(applicationId, ownerId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error('Có lỗi xảy ra khi phê duyệt');
      console.error(error);
    },
  });
}

