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

// A user is "complete" only once a passkey ceremony has actually succeeded. We
// record that with a user-metadata flag rather than keying on is_anonymous:
// /account/complete links a placeholder email (flipping is_anonymous to false)
// *before* registerPasskey runs, so is_anonymous=false alone does not mean the
// account has a passkey. If the flow is interrupted between those two steps, the
// account is a "ghost" (permanent, no passkey, unrecoverable). Keying on this
// flag fails safe: an interrupted attempt reads as logged out, and the user can
// simply sign in again with the passkey they did register.
const PASSKEY_DONE = 'passkey_completed';

function isComplete(user: User | null | undefined): boolean {
  return Boolean(
    user && !user.is_anonymous && user.user_metadata?.[PASSKEY_DONE] === true
  );
}

// Best-effort stamp of the completion flag after a successful passkey ceremony.
async function markPasskeyCompleted(): Promise<void> {
  await supabase.auth.updateUser({ data: { [PASSKEY_DONE]: true } });
}

interface AuthContextType {
  /** Raw session user; may be an incomplete anonymous shell or a ghost. */
  user: User | null;
  loading: boolean;
  /** True only for a completed, passkey-backed user. */
  isAuthenticated: boolean;
  /** Create a new account: anon shell -> placeholder email -> passkey. */
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

/** Discard any not-yet-complete session (anonymous shell or ghost) so it does
 *  not linger or interfere with signing into a real account. Never touches a
 *  completed account. */
async function discardIncompleteSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const sessionUser = data.session?.user;
  if (sessionUser && !isComplete(sessionUser)) {
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
    // Already a completed account? Nothing to do.
    const { data: current } = await supabase.auth.getSession();
    let sessionUser = current.session?.user ?? null;
    if (isComplete(sessionUser)) return { ok: true };

    // Reuse a not-yet-complete session (anon shell / ghost) or start one.
    if (!sessionUser) {
      // TODO: attach a Turnstile/CAPTCHA token; Supabase flags the anonymous
      // endpoint as a DB-bloat abuse vector.
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) return { ok: false, message: error.message };
      sessionUser = data.user ?? null;
    }

    // Link the placeholder email server-side so the user becomes permanent and
    // is eligible to register a passkey. Idempotent for an existing ghost.
    const prep = await callAccountApi('/account/complete');
    if (prep.error) return { ok: false, message: prep.error };
    await supabase.auth.refreshSession();

    // Register the passkey (interactive WebAuthn ceremony).
    try {
      const passkeyAuth = supabase.auth as unknown as PasskeyAuth;
      const { error } = await passkeyAuth.registerPasskey();
      if (error) throw new Error(error.message);
    } catch (e) {
      // Cancelled/failed -> delete the shell so no ghost remains.
      await callAccountApi('/account/abandon');
      await supabase.auth.signOut();
      return {
        ok: false,
        message:
          e instanceof Error ? e.message : 'Passkey setup was cancelled.',
      };
    }

    // Passkey exists now: mark the account complete.
    await markPasskeyCompleted();
    return { ok: true };
  }, []);

  const signIn = useCallback(async (): Promise<AuthResult> => {
    // Throw away any anon/ghost shell before authenticating a real account.
    await discardIncompleteSession();
    try {
      const passkeyAuth = supabase.auth as unknown as PasskeyAuth;
      const { error } = await passkeyAuth.signInWithPasskey();
      if (error) throw new Error(error.message);
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'Sign in failed.',
      };
    }
    // Signed in with a passkey; ensure the completion flag is set (self-heals
    // any account that registered a passkey but never got flagged).
    await markPasskeyCompleted();
    return { ok: true };
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: isComplete(user),
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
