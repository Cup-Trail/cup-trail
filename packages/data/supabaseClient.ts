import { createClient } from '@supabase/supabase-js';

// Supported public prefixes across apps
const VITE = 'VITE_';
const EXPO = 'EXPO_PUBLIC_';

type Key = 'SUPABASE_URL' | 'SUPABASE_ANON_KEY';

function readFromImportMeta(key: Key): string | undefined {
  try {
    const env =
      typeof import.meta !== 'undefined'
        ? (import.meta as any)?.env
        : undefined;
    if (!env) return undefined;
    return env[`${VITE}${key}`] ?? env[`${EXPO}${key}`];
  } catch {
    return undefined;
  }
}

function readFromProcess(key: Key): string | undefined {
  const env =
    typeof process !== 'undefined' ? (process as any)?.env : undefined;
  if (!env) return undefined;
  return env[`${EXPO}${key}`] ?? env[`${VITE}${key}`];
}

function getEnv(key: Key): string {
  const importMetaVal = readFromImportMeta(key);
  const processVal = readFromProcess(key);
  const val = importMetaVal ?? processVal;
  if (!val) {
    // Silently handle missing environment variable
    throw new Error(
      `Missing environment variable: ${EXPO}${key} or ${VITE}${key}`
    );
  }
  return val;
}

const url = getEnv('SUPABASE_URL');
const anon = getEnv('SUPABASE_ANON_KEY');

export const supabase = createClient(url, anon);
export type SupabaseClientType = typeof supabase;
