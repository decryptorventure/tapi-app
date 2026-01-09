'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database.types';

export function useAuth() {
  const supabase = createClient();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: user } = useQuery({
    queryKey: ['user-profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      return data as Profile | null;
    },
    enabled: !!session?.user?.id,
  });

  return {
    session,
    user,
    isLoading: !session,
  };
}

