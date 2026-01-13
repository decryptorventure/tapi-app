import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { OwnerLandingView } from '@/components/profile/owner-landing-view';
import { notFound } from 'next/navigation';

interface PageProps {
    params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const supabase = await createServerClient();

    const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_name, bio')
        .or(`restaurant_slug.eq.${params.slug},id.eq.${params.slug}`)
        .eq('role', 'owner')
        .single();

    if (!profile) {
        return { title: 'Không tìm thấy nhà hàng' };
    }

    return {
        title: `${profile.restaurant_name} | Tuyển dụng trên Tapy`,
        description: profile.bio || `Xem thông tin và việc làm tại ${profile.restaurant_name}`,
        openGraph: {
            title: `${profile.restaurant_name} | Tapy`,
            description: profile.bio || `Xem thông tin và việc làm tại ${profile.restaurant_name}`,
        },
    };
}

export default async function OwnerLandingPage({ params }: PageProps) {
    const supabase = await createServerClient();

    // Get profile by slug or ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .or(`restaurant_slug.eq.${params.slug},id.eq.${params.slug}`)
        .eq('role', 'owner')
        .single();

    if (!profile) {
        notFound();
    }

    // Get active jobs
    const { data: activeJobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('owner_id', profile.id)
        .eq('status', 'open')
        .order('shift_date', { ascending: true })
        .limit(5);

    // Get restaurant images
    const { data: restaurantImages } = await supabase
        .from('restaurant_images')
        .select('*')
        .eq('owner_id', profile.id)
        .order('display_order', { ascending: true })
        .limit(6);

    // Get stats
    const { count: totalJobsCompleted } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', profile.id)
        .eq('status', 'completed');

    const { count: totalWorkersHired } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .in('job_id',
            (await supabase.from('jobs').select('id').eq('owner_id', profile.id)).data?.map(j => j.id) || []
        );

    const profileData = {
        ...profile,
        active_jobs: activeJobs || [],
        images: restaurantImages || [],
        stats: {
            jobs_completed: totalJobsCompleted || 0,
            workers_hired: totalWorkersHired || 0,
        },
    };

    return <OwnerLandingView profile={profileData} />;
}
