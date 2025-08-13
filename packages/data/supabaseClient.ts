import { createClient } from '@supabase/supabase-js';

// Works for both Expo (EXPO_PUBLIC_*) and Vite (VITE_*)
const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL || (import.meta as any)?.env?.VITE_SUPABASE_URL;
const anon =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) throw new Error('Supabase env vars missing');

export const supabase = createClient(url, anon);
