import { createClient } from '@supabase/supabase-js';

import { getEnv } from './env';

const { supabaseUrl, supabaseAnonKey } = getEnv();
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
