'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUntypedClient } from '@/lib/supabase/client';
import { RolePicker } from '@/components/auth/role-picker';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

export default function RoleSelectionPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createUntypedClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not authenticated - redirect to login
        router.push(`/login?message=${encodeURIComponent(t('roles.loginRequired'))}`);
        return;
      }

      // Check if user already has a role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile?.role && profile.onboarding_completed) {
        // Already has role and completed onboarding - redirect to dashboard
        if (profile.role === 'worker') {
          router.push('/worker/dashboard');
        } else {
          router.push('/owner/dashboard');
        }
        return;
      }

      if (profile?.role && !profile.onboarding_completed) {
        // Has role but not completed onboarding - redirect to onboarding
        if (profile.role === 'worker') {
          router.push('/onboarding/worker/profile');
        } else {
          router.push('/onboarding/owner/profile');
        }
        return;
      }

      // No role yet - show role picker
      setChecking(false);
    };

    checkAuth();
  }, [router, t]);

  const handleRoleSelect = async (role: 'worker' | 'owner' | 'skip') => {
    if (role === 'skip') {
      // Skip to home page to browse jobs
      router.push('/');
      return;
    }

    setLoading(true);
    const supabase = createUntypedClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('roles.loginRequired'));
        router.push('/login');
        return;
      }

      // Update or Create profile with selected role
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role,
          email: user.email,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        console.error('Upsert error:', error);
        toast.error(`${t('roles.dbError')}: ${error.message}`);
        throw error;
      }

      toast.success(
        `${t('roles.selectedToast')} ${role === 'worker' ? t('roles.worker') : t('roles.owner')}`
      );

      // Navigate to appropriate onboarding flow
      if (role === 'worker') {
        router.push('/onboarding/worker/profile');
      } else {
        router.push('/onboarding/owner/profile');
      }
    } catch (error: any) {
      console.error('Role selection error:', error);
      toast.error(t('roles.error'));
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <RolePicker
        onRoleSelect={handleRoleSelect}
        allowSkip={true}
      />
    </div>
  );
}
