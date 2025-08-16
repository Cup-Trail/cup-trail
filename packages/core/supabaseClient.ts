import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Platform-aware Supabase client creation
export function createSupabaseClient(): SupabaseClient {
  let url: string;
  let anonKey: string;

  // Try to read from VITE_ (web) first
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    url = (import.meta as any).env.VITE_SUPABASE_URL || '';
    anonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
  }
  // Fall back to EXPO_PUBLIC_ (mobile)
  else if (typeof process !== 'undefined' && (process as any).env) {
    url = (process as any).env.EXPO_PUBLIC_SUPABASE_URL || '';
    anonKey = (process as any).env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  }
  // Fall back to empty strings (will throw error)
  else {
    url = '';
    anonKey = '';
  }

  if (!url) {
    throw new Error(
      'Supabase URL not found. Make sure VITE_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL is set.'
    );
  }
  if (!anonKey) {
    throw new Error(
      'Supabase anon key not found. Make sure VITE_SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY is set.'
    );
  }

  return createClient(url, anonKey);
}

// Create and export the default Supabase client instance
export const supabase = createSupabaseClient();

// Export the type for convenience
export type SupabaseClientType = SupabaseClient;
