import { createUntypedClient } from '@/lib/supabase/client';

// Admin emails - hardcoded for now
export const ADMIN_EMAILS = ['admin@tapi.vn', 'tommy@example.com'];

export interface UserFilters {
    role?: 'worker' | 'owner';
    search?: string;
    isVerified?: boolean;
    isAccountFrozen?: boolean;
    page?: number;
    limit?: number;
}

export interface UserListItem {
    id: string;
    full_name: string;
    email: string | null;
    phone_number: string;
    role: 'worker' | 'owner';
    avatar_url: string | null;
    is_verified: boolean;
    is_account_frozen: boolean;
    reliability_score: number;
    created_at: string;
    // Owner specific
    restaurant_name?: string | null;
    // Worker specific
    university_name?: string | null;
}

export interface UserDetail extends UserListItem {
    date_of_birth: string | null;
    bio: string | null;
    frozen_until: string | null;
    intro_video_url: string | null;
    restaurant_address?: string | null;
    cuisine_type?: string | null;
    business_license_number?: string | null;
    identity_verified?: boolean;
    language_verified?: boolean;
    license_verified?: boolean;
    onboarding_completed?: boolean;
    profile_completion_percentage?: number;
    deleted_at?: string | null;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AdminStats {
    totalUsers: number;
    totalWorkers: number;
    totalOwners: number;
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalApplications: number;
    approvedApplications: number;
    completedApplications: number;
    totalRevenue: number;
    pendingVerifications: number;
}

export interface GrowthData {
    date: string;
    users: number;
    jobs: number;
    applications: number;
}

export interface TopPerformer {
    id: string;
    name: string;
    avatar_url: string | null;
    count: number;
    extra?: string;
}

// Admin Service
class AdminService {
    private supabase = createUntypedClient();

    // Get paginated users list
    async getUsers(filters: UserFilters = {}): Promise<PaginatedResult<UserListItem>> {
        const { role, search, isVerified, isAccountFrozen, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        let query = this.supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .is('deleted_at', null);

        if (role) {
            query = query.eq('role', role);
        }

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`);
        }

        if (isVerified !== undefined) {
            query = query.eq('is_verified', isVerified);
        }

        if (isAccountFrozen !== undefined) {
            query = query.eq('is_account_frozen', isAccountFrozen);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        };
    }

    // Get single user by ID
    async getUserById(userId: string): Promise<UserDetail | null> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return data;
    }

    // Update user profile
    async updateUser(userId: string, updates: Partial<UserDetail>): Promise<UserDetail> {
        const { data, error } = await this.supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Toggle account lock status
    async toggleAccountLock(userId: string, lock: boolean, frozenDays: number = 0): Promise<void> {
        const updates: Record<string, unknown> = {
            is_account_frozen: lock,
        };

        if (lock && frozenDays > 0) {
            const frozenUntil = new Date();
            frozenUntil.setDate(frozenUntil.getDate() + frozenDays);
            updates.frozen_until = frozenUntil.toISOString();
        } else if (!lock) {
            updates.frozen_until = null;
        }

        const { error } = await this.supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
    }

    // Soft delete user
    async deleteUser(userId: string, adminId: string): Promise<void> {
        const { error } = await this.supabase
            .from('profiles')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: adminId,
            })
            .eq('id', userId);

        if (error) throw error;
    }

    // Restore deleted user
    async restoreUser(userId: string): Promise<void> {
        const { error } = await this.supabase
            .from('profiles')
            .update({
                deleted_at: null,
                deleted_by: null,
            })
            .eq('id', userId);

        if (error) throw error;
    }

    // Get admin dashboard stats
    async getStats(): Promise<AdminStats> {
        const supabase = this.supabase;

        // Users counts
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null);

        const { count: totalWorkers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'worker')
            .is('deleted_at', null);

        const { count: totalOwners } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'owner')
            .is('deleted_at', null);

        // Jobs counts
        const { count: totalJobs } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true });

        const { count: activeJobs } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        const { count: completedJobs } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        // Applications counts
        const { count: totalApplications } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true });

        const { count: approvedApplications } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        const { count: completedApplications } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        // Revenue
        const { data: revenueData } = await supabase
            .from('wallet_transactions')
            .select('amount_vnd')
            .eq('status', 'completed');

        const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount_vnd || 0), 0) || 0;

        // Pending verifications
        const { count: pendingIdentity } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('identity_verified', false)
            .not('identity_front_url', 'is', null);

        const { count: pendingLanguage } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('language_verified', false)
            .not('language_certificate_url', 'is', null);

        const { count: pendingLicense } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('license_verified', false)
            .not('business_license_url', 'is', null);

        return {
            totalUsers: totalUsers || 0,
            totalWorkers: totalWorkers || 0,
            totalOwners: totalOwners || 0,
            totalJobs: totalJobs || 0,
            activeJobs: activeJobs || 0,
            completedJobs: completedJobs || 0,
            totalApplications: totalApplications || 0,
            approvedApplications: approvedApplications || 0,
            completedApplications: completedApplications || 0,
            totalRevenue,
            pendingVerifications: (pendingIdentity || 0) + (pendingLanguage || 0) + (pendingLicense || 0),
        };
    }

    // Get growth data for the last N days
    async getGrowthData(days: number = 30): Promise<GrowthData[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: users } = await this.supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', startDate.toISOString())
            .is('deleted_at', null);

        const { data: jobs } = await this.supabase
            .from('jobs')
            .select('created_at')
            .gte('created_at', startDate.toISOString());

        const { data: applications } = await this.supabase
            .from('job_applications')
            .select('created_at')
            .gte('created_at', startDate.toISOString());

        // Group by date
        const growthMap = new Map<string, GrowthData>();

        for (let i = 0; i <= days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            growthMap.set(dateStr, { date: dateStr, users: 0, jobs: 0, applications: 0 });
        }

        users?.forEach(u => {
            const dateStr = u.created_at.split('T')[0];
            const entry = growthMap.get(dateStr);
            if (entry) entry.users++;
        });

        jobs?.forEach(j => {
            const dateStr = j.created_at.split('T')[0];
            const entry = growthMap.get(dateStr);
            if (entry) entry.jobs++;
        });

        applications?.forEach(a => {
            const dateStr = a.created_at.split('T')[0];
            const entry = growthMap.get(dateStr);
            if (entry) entry.applications++;
        });

        return Array.from(growthMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    // Get top workers by completed jobs
    async getTopWorkers(limit: number = 5): Promise<TopPerformer[]> {
        const { data } = await this.supabase
            .from('job_applications')
            .select(`
                worker_id,
                profiles!job_applications_worker_id_fkey (
                    id,
                    full_name,
                    avatar_url,
                    reliability_score
                )
            `)
            .eq('status', 'completed');

        if (!data) return [];

        // Count completions per worker
        const workerCounts = new Map<string, { profile: any; count: number }>();

        data.forEach(app => {
            // Handle both single object and array responses from Supabase
            const profileData = app.profiles;
            const profile = Array.isArray(profileData) ? profileData[0] : profileData;
            if (!profile) return;

            const existing = workerCounts.get(profile.id);
            if (existing) {
                existing.count++;
            } else {
                workerCounts.set(profile.id, { profile, count: 1 });
            }
        });

        return Array.from(workerCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, limit)
            .map(({ profile, count }) => ({
                id: profile.id,
                name: profile.full_name,
                avatar_url: profile.avatar_url,
                count,
                extra: `Score: ${profile.reliability_score}`,
            }));
    }

    // Get top employers by jobs posted
    async getTopEmployers(limit: number = 5): Promise<TopPerformer[]> {
        const { data } = await this.supabase
            .from('jobs')
            .select(`
                owner_id,
                profiles!jobs_owner_id_fkey (
                    id,
                    full_name,
                    avatar_url,
                    restaurant_name
                )
            `);

        if (!data) return [];

        // Count jobs per owner
        const ownerCounts = new Map<string, { profile: any; count: number }>();

        data.forEach(job => {
            // Handle both single object and array responses from Supabase
            const profileData = job.profiles;
            const profile = Array.isArray(profileData) ? profileData[0] : profileData;
            if (!profile) return;

            const existing = ownerCounts.get(profile.id);
            if (existing) {
                existing.count++;
            } else {
                ownerCounts.set(profile.id, { profile, count: 1 });
            }
        });

        return Array.from(ownerCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, limit)
            .map(({ profile, count }) => ({
                id: profile.id,
                name: profile.full_name,
                avatar_url: profile.avatar_url,
                count,
                extra: profile.restaurant_name,
            }));
    }

    // Get conversion funnel data
    async getConversionFunnel(): Promise<{ stage: string; count: number; percentage: number }[]> {
        const { count: total } = await this.supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true });

        const { count: approved } = await this.supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .in('status', ['approved', 'completed']);

        const { count: completed } = await this.supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        const totalCount = total || 0;

        return [
            { stage: 'Applications', count: totalCount, percentage: 100 },
            { stage: 'Approved', count: approved || 0, percentage: totalCount > 0 ? Math.round(((approved || 0) / totalCount) * 100) : 0 },
            { stage: 'Completed', count: completed || 0, percentage: totalCount > 0 ? Math.round(((completed || 0) / totalCount) * 100) : 0 },
        ];
    }
}

export const adminService = new AdminService();
