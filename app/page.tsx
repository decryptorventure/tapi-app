'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { JobCategories } from '@/components/landing/job-categories';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { StatsSection } from '@/components/landing/stats-section';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // PERFORMANCE FIX: Non-blocking auth check in background
    const checkAuth = async () => {
      const supabase = createUntypedClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user.id)
          .single();

        // Only redirect if user has completed onboarding
        if (profile?.role === 'worker' && profile?.onboarding_completed) {
          router.push('/worker/dashboard');
          return;
        } else if (profile?.role === 'owner' && profile?.onboarding_completed) {
          router.push('/owner/dashboard');
          return;
        }
        // If has role but not completed onboarding, or no role yet - stay on landing page
        // User can click buttons to continue
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <JobCategories />
      <Features />
      <HowItWorks />
      <StatsSection />
      <CTA />
      <Footer />
    </div>
  );
}
