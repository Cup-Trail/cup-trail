import { createClient } from '@supabase/supabase-js';

// Supported public prefixes across apps
const VITE = 'VITE_';
const EXPO = 'EXPO_PUBLIC_';

type Key = 'SUPABASE_URL' | 'SUPABASE_ANON_KEY';

function readFromImportMeta(key: Key): string | undefined {
  try {
    // @ts-expect-error import.meta isn't typed in RN/Node
    const env = typeof import.meta !== 'undefined' ? import.meta?.env : undefined;
    if (!env) return undefined;
    return env[`${VITE}${key}`] ?? env[`${EXPO}${key}`];
  } catch {
    return undefined;
  }
}

function readFromProcess(key: Key): string | undefined {
  const env = typeof process !== 'undefined' ? (process as any)?.env : undefined;
  if (!env) return undefined;
  return env[`${EXPO}${key}`] ?? env[`${VITE}${key}`];
}

function mask(v?: string) {
  if (!v) return v;
  if (v.length <= 6) return '*'.repeat(v.length);
  return v.slice(0, 3) + '…' + v.slice(-3);
}

function getEnv(key: Key): string {
  const importMetaVal = readFromImportMeta(key);
  const processVal = readFromProcess(key);
  const val = importMetaVal ?? processVal;
  if (!val) {
    // Helpful diagnostics for setup
    // @ts-expect-error import.meta typing
    const hasImportMeta = typeof import.meta !== 'undefined' && !!import.meta?.env;
    const details = {
      platform: hasImportMeta ? 'web (vite)' : 'native/node',
      [`${VITE}${key}`]: mask(
        // @ts-expect-error import.meta typing
        hasImportMeta ? import.meta.env?.[`${VITE}${key}`] : (typeof process !== 'undefined' ? (process as any)?.env?.[`${VITE}${key}`] : undefined)
      ),
      [`${EXPO}${key}`]: mask(
        // @ts-expect-error import.meta typing
        hasImportMeta ? import.meta.env?.[`${EXPO}${key}`] : (typeof process !== 'undefined' ? (process as any)?.env?.[`${EXPO}${key}`] : undefined)
      ),
    };
    // eslint-disable-next-line no-console
    console.error('Supabase env not found', details);
    throw new Error(`Missing environment variable: ${EXPO}${key} or ${VITE}${key}`);
  }
  return val;
}

const url = getEnv('SUPABASE_URL');
const anon = getEnv('SUPABASE_ANON_KEY');

export const supabase = createClient(url, anon);
export type SupabaseClientType = typeof supabase;