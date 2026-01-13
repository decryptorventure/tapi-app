import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Server-side Supabase client for Server Components
export const createServerClient = async () => {
    const cookieStore = await cookies();
    return createServerComponentClient({ cookies: () => cookieStore });
};
