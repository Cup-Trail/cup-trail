import { createClient } from '@supabase/supabase-js';

import { getEnv } from './env';

const { supabaseUrl, supabaseAnonKey } = getEnv();

// Passkeys are a beta feature and must be explicitly enabled. `experimental`
// may not exist on the options type in older @supabase/supabase-js versions —
// bump the dependency if passkey methods are missing at runtime.
const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  experimental: { passkey: true },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions as never,
});
