// Generated types for Supabase - bạn có thể generate từ Supabase CLI
// Tạm thời định nghĩa types dựa trên schema

export type UserRole = 'worker' | 'owner';
export type LanguageType = 'japanese' | 'korean' | 'english';
export type LanguageLevel =
  | 'beginner' | 'n5' | 'n4' | 'n3' | 'n2' | 'n1'
  | 'topik_1' | 'topik_2' | 'topik_3' | 'topik_4' | 'topik_5' | 'topik_6'
  | 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type JobStatus = 'open' | 'filled' | 'completed' | 'cancelled' | 'expired';
export type ApplicationStatus = 'pending' | 'approved' | 'working' | 'rejected' | 'completed' | 'no_show';
export type CheckinType = 'checkin' | 'checkout';
export type NotificationType = 'application_update' | 'chat_message' | 'system' | 'reminder';
export type RelationType = 'block' | 'favorite';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export type Profile = {
  id: string;
  role: UserRole | null;
  phone_number: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  // Worker fields
  university_name: string | null;
  date_of_birth: string | null;
  bio: string | null;
  reliability_score: number;
  is_verified: boolean;
  is_account_frozen: boolean;
  frozen_until: string | null;
  intro_video_url: string | null;
  average_rating: number | null;
  total_completed_jobs: number | null;
  // Owner fields
  restaurant_name: string | null;
  restaurant_logo_url: string | null;
  restaurant_cover_urls: string[] | null;
  restaurant_address: string | null;
  restaurant_lat: number | null;
  restaurant_lng: number | null;
  cuisine_type: string | null;
  business_license_number: string | null;
  // Profile completion tracking (from migrations)
  profile_completion_percentage: number | null;
  can_apply: boolean | null;
  can_post_jobs: boolean | null;
  onboarding_completed: boolean | null;
  last_active_at: string | null;
  // Admin fields
  is_admin: boolean | null;
}

export type LanguageSkill = {
  id: string;
  user_id: string;
  language: LanguageType;
  level: LanguageLevel;
  verification_status: VerificationStatus;
  certificate_url: string | null;
  quiz_score: number | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

export type Job = {
  thumbnail_url: string | null;
  is_instant_book: boolean | null;
  cancel_reason: string | null;
  cancellation_fee: number | null;
  cancelled_at: string | null;
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  hourly_rate_vnd: number;
  required_language: LanguageType;
  required_language_level: LanguageLevel;
  min_reliability_score: number;
  dress_code: string | null;
  max_workers: number;
  current_workers: number;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export type JobApplication = {
  id: string;
  job_id: string;
  worker_id: string;
  status: ApplicationStatus;
  is_instant_book: boolean;
  applied_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  contract_signed_at: string | null;
  checkin_qr_code: string | null;
  checkin_qr_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Checkin = {
  id: string;
  application_id: string;
  worker_id: string;
  job_id: string;
  type: CheckinType;
  checkin_type: string | null;
  is_valid: boolean | null;
  checkin_time: string;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
}

export type IdentityVerification = {
  id: string;
  user_id: string;
  id_front_url: string;
  id_back_url: string;
  id_number: string | null;
  issue_date: string | null;
  status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export type BusinessVerification = {
  id: string;
  owner_id: string;
  license_url: string;
  license_number: string;
  status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export type ReliabilityHistory = {
  id: string;
  user_id: string;
  score_change: number;
  reason: string;
  previous_score: number | null;
  new_score: number;
  created_at: string;
}

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type ChatMessage = {
  id: string;
  application_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export type WithdrawalRequest = {
  id: string;
  user_id: string;
  amount_vnd: number;
  payment_method: string;
  payment_info: any;
  status: WithdrawalStatus;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Badge = {
  id: string;
  code: string;
  name_vi: string;
  name_en: string | null;
  description_vi: string | null;
  description_en: string | null;
  icon: string;
  category: string;
  criteria: any | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type WorkerBadge = {
  id: string;
  worker_id: string;
  badge_id: string;
  earned_at: string;
  related_job_id: string | null;
}

export type Review = {
  id: string;
  application_id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  tags: string[] | null;
  comment: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export type OwnerWorkerRelation = {
  id: string;
  owner_id: string;
  worker_id: string;
  relation_type: RelationType;
  reason: string | null;
  related_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkExperience = {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type FavoriteWorker = {
  id: string;
  owner_id: string;
  worker_id: string;
  notes: string | null;
  created_at: string;
}

export type TimeModificationRequest = {
  id: string;
  application_id: string;
  requested_by: string;
  request_type: string;
  original_checkin_time: string | null;
  original_checkout_time: string | null;
  proposed_checkin_time: string | null;
  proposed_checkout_time: string | null;
  reason: string;
  evidence_urls: string[] | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export type PaymentRequest = {
  id: string;
  owner_id: string;
  amount_vnd: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      payment_requests: {
        Row: PaymentRequest;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      wallet_transactions: {
        // @ts-expect-error - Expected due to missing null checks or db strict types
        Row: WalletTransaction;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      profiles: {
        Row: Profile;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      language_skills: {
        Row: LanguageSkill;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      jobs: {
        Row: Job;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      job_applications: {
        Row: JobApplication;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      checkins: {
        Row: Checkin;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      identity_verifications: {
        Row: IdentityVerification;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      business_verifications: {
        Row: BusinessVerification;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      reliability_history: {
        Row: ReliabilityHistory;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      notifications: {
        Row: Notification;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      withdrawal_requests: {
        Row: WithdrawalRequest;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      badges: {
        Row: Badge;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      worker_badges: {
        Row: WorkerBadge;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      reviews: {
        Row: Review;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      owner_worker_relations: {
        Row: OwnerWorkerRelation;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      work_experiences: {
        Row: WorkExperience;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      favorite_workers: {
        Row: FavoriteWorker;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
      time_modification_requests: {
        Row: TimeModificationRequest;
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
    };

    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
