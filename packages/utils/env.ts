/**
 * Environment variables utility for cross-platform compatibility
 * Handles VITE_ (web) and EXPO_PUBLIC_ (mobile) prefixed environment variables
 */

// Environment variable keys
const ENV_KEYS = {
  SUPABASE_URL: {
    web: 'VITE_SUPABASE_URL',
    mobile: 'EXPO_PUBLIC_SUPABASE_URL',
  },
  SUPABASE_PUBLISHABLE_KEY: {
    web: 'VITE_SUPABASE_PUBLISHABLE_KEY',
    mobile: 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  },
} as const;

export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

type EnvValue = string | undefined;
type EnvMap = Record<string, EnvValue>;
type ImportMetaWithEnv = ImportMeta & { env?: EnvMap };

/**
 * Get validated environment configuration with platform-aware fallbacks
 * @returns Validated environment configuration object
 * @throws Error if required variables are missing
 */
export function getEnv(): EnvironmentConfig {
  let supabaseUrl = '';
  let supabaseAnonKey = '';

  // Try to read from VITE_ (web) first
  const importMetaEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMetaWithEnv).env
      : undefined;

  if (importMetaEnv) {
    supabaseUrl = importMetaEnv[ENV_KEYS.SUPABASE_URL.web] || '';
    supabaseAnonKey =
      importMetaEnv[ENV_KEYS.SUPABASE_PUBLISHABLE_KEY.web] || '';
  }
  // Fall back to EXPO_PUBLIC_ (mobile)
  else if (typeof process !== 'undefined' && process.env) {
    supabaseUrl = process.env[ENV_KEYS.SUPABASE_URL.mobile] || '';
    supabaseAnonKey =
      process.env[ENV_KEYS.SUPABASE_PUBLISHABLE_KEY.mobile] || '';
  }

  // Validate required variables
  if (!supabaseUrl) {
    throw new Error(
      `Supabase URL not found. Make sure ${ENV_KEYS.SUPABASE_URL.web} or ${ENV_KEYS.SUPABASE_URL.mobile} is set.`
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      `Supabase anon key not found. Make sure ${ENV_KEYS.SUPABASE_PUBLISHABLE_KEY.web} or ${ENV_KEYS.SUPABASE_PUBLISHABLE_KEY.mobile} is set.`
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}
