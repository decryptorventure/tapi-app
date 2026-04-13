import { createClient } from '@supabase/supabase-js';

// Get these from your .env.local manually if needed, or assume they are in environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('Testing query with URL:', supabaseUrl);
  const { data, error } = await supabase
    .from('job_applications')
    .select(`
        id, 
        status, 
        job:jobs!inner(
            id,
            title, 
            owner_id,
            shift_date,
            owner:profiles!owner_id(restaurant_name, restaurant_lat, restaurant_lng)
        )
    `)
    .limit(1);

  if (error) {
    console.error('Query Error:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    if (error.details) console.error('Error Details:', error.details);
    if (error.hint) console.error('Error Hint:', error.hint);
  } else {
    console.log('Query Success:', JSON.stringify(data, null, 2));
  }
}

testQuery();
