import { supabase } from '@cuptrail/utils';
import type { User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

// Beta passkey methods may be absent from the installed supabase-js types.
type PasskeyAuth = {
  registerPasskey: () => Promise<{ error: { message: string } | null }>;
  signInWithPasskey: () => Promise<{ error: { message: string } | null }>;
};

type AuthResult = { ok: boolean; message?: string };

interface AuthContextType {
  /** Raw session user - may be an incomplete anonymous shell. */
  user: User | null;
  loading: boolean;
  /**
   * True only for a completed, non-anonymous user. An anonymous session is
   * treated as logged out: it is just a transient step inside sign-up.
   */
  isAuthenticated: boolean;
  /** Create a new account: anon shell → placeholder email → passkey. */
  createAccount: () => Promise<AuthResult>;
  /** Sign in an existing account with a passkey. */
  signIn: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function callAccountApi(path: string): Promise<{ error?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { error: 'No session' };
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: '{}',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body.error ?? `HTTP ${res.status}` };
  }
  return {};
}

/** Discard a stray anonymous shell so it doesn't linger for the sweep. */
async function discardAnonymous(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.is_anonymous) {
    await callAccountApi('/account/abandon');
    await supabase.auth.signOut();
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const createAccount = useCallback(async (): Promise<AuthResult> => {
    // Reuse an existing session, or spin up an anonymous shell.
    const { data: current } = await supabase.auth.getSession();
    let sessionUser = current.session?.user ?? null;
    if (sessionUser && !sessionUser.is_anonymous) return { ok: true };

    if (!sessionUser) {
      // TODO: attach a Turnstile/CAPTCHA token - Supabase flags the anonymous
      // endpoint as a DB-bloat abuse vector.
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) return { ok: false, message: error.message };
      sessionUser = data.user ?? null;
    }

    // Link the placeholder email server-side so the user becomes permanent and
    // is eligible to register a passkey.
    const prep = await callAccountApi('/account/complete');
    if (prep.error) return { ok: false, message: prep.error };
    await supabase.auth.refreshSession();

    // Register the passkey (interactive WebAuthn ceremony).
    try {
      const passkeyAuth = supabase.auth as unknown as PasskeyAuth;
      const { error } = await passkeyAuth.registerPasskey();
      if (error) throw new Error(error.message);
    } catch (e) {
      // Cancelled/failed → delete the shell so no ghost account remains.
      await callAccountApi('/account/abandon');
      await supabase.auth.signOut();
      return {
        ok: false,
        message:
          e instanceof Error ? e.message : 'Passkey setup was cancelled.',
      };
    }

    return { ok: true };
  }, []);

  const signIn = useCallback(async (): Promise<AuthResult> => {
    // If a new-account attempt left an anon shell, throw it away first.
    await discardAnonymous();
    try {
      const passkeyAuth = supabase.auth as unknown as PasskeyAuth;
      const { error } = await passkeyAuth.signInWithPasskey();
      if (error) throw new Error(error.message);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'Sign in failed.',
      };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user && !user.is_anonymous),
        createAccount,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
