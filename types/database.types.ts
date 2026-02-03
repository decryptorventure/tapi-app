// Generated types for Supabase - bạn có thể generate từ Supabase CLI
// Tạm thời định nghĩa types dựa trên schema

export type UserRole = 'worker' | 'owner';
export type LanguageType = 'japanese' | 'korean' | 'english';
export type LanguageLevel =
  | 'beginner' | 'n5' | 'n4' | 'n3' | 'n2' | 'n1'
  | 'topik_1' | 'topik_2' | 'topik_3' | 'topik_4' | 'topik_5' | 'topik_6'
  | 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type JobStatus = 'open' | 'filled' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'approved' | 'working' | 'rejected' | 'completed' | 'no_show';
export type CheckinType = 'check_in' | 'check_out';

export interface Profile {
  id: string;
  role: UserRole | null;
  phone_number: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  // Worker fields
  university_name?: string;
  date_of_birth?: string;
  bio?: string;
  reliability_score: number;
  is_verified: boolean;
  is_account_frozen: boolean;
  frozen_until?: string;
  intro_video_url?: string;
  // Owner fields
  restaurant_name?: string;
  restaurant_address?: string;
  restaurant_lat?: number;
  restaurant_lng?: number;
  cuisine_type?: string;
  business_license_number?: string;
  // Profile completion tracking (from migrations)
  profile_completion_percentage?: number;
  can_apply?: boolean;
  can_post_jobs?: boolean;
  onboarding_completed?: boolean;
  last_active_at?: string;
}

export interface LanguageSkill {
  id: string;
  user_id: string;
  language: LanguageType;
  level: LanguageLevel;
  verification_status: VerificationStatus;
  certificate_url?: string;
  quiz_score?: number;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
}

export interface Job {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  hourly_rate_vnd: number;
  required_language: LanguageType;
  required_language_level: LanguageLevel;
  min_reliability_score: number;
  dress_code?: string;
  max_workers: number;
  current_workers: number;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  worker_id: string;
  status: ApplicationStatus;
  is_instant_book: boolean;
  applied_at: string;
  approved_at?: string;
  rejected_at?: string;
  contract_signed_at?: string;
  checkin_qr_code?: string;
  checkin_qr_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: string;
  application_id: string;
  worker_id: string;
  job_id: string;
  checkin_type: CheckinType;
  checkin_time: string;
  location_lat?: number;
  location_lng?: number;
  created_at: string;
}

export interface IdentityVerification {
  id: string;
  user_id: string;
  id_front_url: string;
  id_back_url: string;
  id_number?: string;
  issue_date?: string;
  status: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface BusinessVerification {
  id: string;
  owner_id: string;
  license_url: string;
  license_number: string;
  status: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface ReliabilityHistory {
  id: string;
  worker_id: string;
  score_change: number;
  reason: string;
  new_score: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Profile>;
      };
      language_skills: {
        Row: LanguageSkill;
        Insert: Omit<LanguageSkill, 'id' | 'created_at'>;
        Update: Partial<LanguageSkill>;
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Job>;
      };
      job_applications: {
        Row: JobApplication;
        Insert: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<JobApplication>;
      };
      checkins: {
        Row: Checkin;
        Insert: Omit<Checkin, 'id' | 'created_at'>;
        Update: Partial<Checkin>;
      };
      identity_verifications: {
        Row: IdentityVerification;
        Insert: Omit<IdentityVerification, 'id' | 'created_at'>;
        Update: Partial<IdentityVerification>;
      };
      business_verifications: {
        Row: BusinessVerification;
        Insert: Omit<BusinessVerification, 'id' | 'created_at'>;
        Update: Partial<BusinessVerification>;
      };
      reliability_history: {
        Row: ReliabilityHistory;
        Insert: Omit<ReliabilityHistory, 'id' | 'created_at'>;
        Update: Partial<ReliabilityHistory>;
      };
    };
  };
}
