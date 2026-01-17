import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { WorkerProfileView } from '@/components/profile/worker-profile-view';
import { notFound } from 'next/navigation';

interface PageProps {
    params: { username: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const supabase = await createServerClient();
    const identifier = params.username;

    // Try to find by username first, then by ID
    let profile = null;

    // Try username first
    const { data: byUsername } = await supabase
        .from('profiles')
        .select('full_name, bio')
        .eq('username', identifier)
        .single();

    if (byUsername) {
        profile = byUsername;
    } else {
        // Try by ID
        const { data: byId } = await supabase
            .from('profiles')
            .select('full_name, bio')
            .eq('id', identifier)
            .single();
        profile = byId;
    }

    if (!profile) {
        return { title: 'Không tìm thấy hồ sơ' };
    }

    return {
        title: `${profile.full_name} | Tapy`,
        description: profile.bio || `Xem hồ sơ của ${profile.full_name} trên Tapy`,
        openGraph: {
            title: `${profile.full_name} | Tapy`,
            description: profile.bio || `Xem hồ sơ của ${profile.full_name} trên Tapy`,
        },
    };
}

export default async function WorkerProfilePage({ params }: PageProps) {
    const supabase = await createServerClient();
    const identifier = params.username;

    // Try to find by username first, then by ID
    let profile = null;

    const { data: byUsername } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', identifier)
        .eq('role', 'worker')
        .single();

    if (byUsername) {
        profile = byUsername;
    } else {
        const { data: byId } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', identifier)
            .eq('role', 'worker')
            .single();
        profile = byId;
    }

    if (!profile) {
        notFound();
    }

    // Get language skills
    const { data: languageSkills } = await supabase
        .from('language_skills')
        .select('*')
        .eq('user_id', profile.id);

    // Get work history (completed applications with ratings) - Tapy job history
    const { data: workHistory } = await supabase
        .from('job_applications')
        .select(`
        id,
        status,
        rating,
        review,
        jobs (
          id,
          title,
          owner_id,
          profiles:owner_id (
            restaurant_name,
            avatar_url
          )
        )
      `)
        .eq('worker_id', profile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

    // Get custom work experiences
    const { data: workExperiences } = await supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false });

    // Get identity verification status
    const { data: identityVerification } = await supabase
        .from('identity_verifications')
        .select('status')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Calculate stats
    const { count: totalShifts } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', profile.id)
        .eq('status', 'completed');

    // Calculate average rating
    const completedWithRating = workHistory?.filter(w => w.rating) || [];
    const avgRating = completedWithRating.length > 0
        ? completedWithRating.reduce((sum, w) => sum + (w.rating || 0), 0) / completedWithRating.length
        : 0;

    const profileData = {
        ...profile,
        language_skills: languageSkills || [],
        work_history: workHistory?.map(w => ({
            id: w.id,
            restaurant_name: (w.jobs as any)?.profiles?.restaurant_name || 'Unknown',
            restaurant_logo: (w.jobs as any)?.profiles?.avatar_url,
            role: (w.jobs as any)?.title || 'Nhân viên',
            rating: w.rating,
            review: w.review,
        })) || [],
        work_experiences: workExperiences?.map(exp => ({
            id: exp.id,
            company_name: exp.company_name,
            job_title: exp.job_title,
            start_date: exp.start_date,
            end_date: exp.end_date,
            is_current: exp.is_current,
            description: exp.description,
        })) || [],
        identity_verification_status: identityVerification?.status || null,
        stats: {
            total_shifts: totalShifts || 0,
            average_rating: avgRating,
            review_count: completedWithRating.length,
        },
    };

    return <WorkerProfileView profile={profileData} />;
}

