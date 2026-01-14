import { supabase } from '@cuptrail/utils';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import Nav from './Nav';

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
      <Nav signedIn={signedIn} displayName={displayName} />
      <main className='w-full max-w-6xl mx-auto pt-2 px-8 pb-8'>
        <Outlet />
      </main>
    </div>
  );
}
