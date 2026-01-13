import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { WorkerProfileView } from '@/components/profile/worker-profile-view';
import { notFound } from 'next/navigation';

interface PageProps {
    params: { username: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const supabase = await createServerClient();

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, bio')
        .eq('username', params.username)
        .single();

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

    // Get profile by username
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', params.username)
        .eq('role', 'worker')
        .single();

    if (!profile) {
        notFound();
    }

    // Get language skills
    const { data: languageSkills } = await supabase
        .from('language_skills')
        .select('*')
        .eq('profile_id', profile.id);

    // Get work history (completed applications with ratings)
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
        .not('rating', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

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
        stats: {
            total_shifts: totalShifts || 0,
            average_rating: avgRating,
            review_count: completedWithRating.length,
        },
    };

    return <WorkerProfileView profile={profileData} />;
}
