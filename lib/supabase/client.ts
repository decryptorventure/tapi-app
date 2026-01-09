import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';

// Typed Supabase client - use for tables defined in Database type
export const createClient = () => {
  return createClientComponentClient<Database>();
};

// Untyped Supabase client - use for new tables not yet in Database type
// This bypasses TypeScript strict checking for Supabase queries
export const createUntypedClient = () => {
  return createClientComponentClient<any>();
};
