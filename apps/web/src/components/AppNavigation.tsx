import { supabase } from '@cuptrail/utils';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import Header from './Header';

export default function AppNavigation() {
  const [signedIn, setSignedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      setSignedIn(Boolean(session));
      setDisplayName(session?.user?.user_metadata?.display_name ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session));
      setDisplayName(session?.user?.user_metadata?.display_name ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className='min-h-screen'>
      <Header signedIn={signedIn} displayName={displayName} />
      <main className='w-full max-w-[768px] mx-auto px-4 py-8'>
        <Outlet />
      </main>
    </div>
  );
}
