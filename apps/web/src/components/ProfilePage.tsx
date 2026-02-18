import { supabase } from '@cuptrail/utils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { useAuth } from '../context/AuthContext';
import { useUserReviewsQuery } from '../queries';

import ReviewItem from './ReviewItem';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { signOut, user, loading: authLoading } = useAuth();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name ?? 'User');
    }
  }, [user]);

  const currentDisplayName = user?.user_metadata?.display_name ?? 'User';
  const email = user?.email ?? '';
  const userId = user?.id;

  const { data: reviews = [], isLoading: reviewsLoading } = useUserReviewsQuery(
    {
      userId,
    }
  );

  async function saveDisplayName() {
    const name = displayName.trim();
    if (!name) return;

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: { display_name: name },
    });

    setSaving(false);

    if (error) {
      console.error('Failed to update display name:', error);
      return;
    }
    setEditing(false);
  }

  function cancelEdit() {
    setDisplayName(currentDisplayName);
    setEditing(false);
  }

  if (authLoading) return <h2>Loading…</h2>;
  if (!user) return null;

  return (
    <div className='flex justify-center px-6'>
      <div className='w-full max-w-3xl'>
        <div className='mt-6 grid gap-4'>
          <div className='flex items-start gap-3'>
            <div className='my-auto w-18 h-18 rounded-full border border-border-default flex items-center justify-center text-text-primary text-2xl font-semibold'>
              {(currentDisplayName?.[0] ?? 'U').toUpperCase()}
            </div>

            <div>
              {editing ? (
                <div className='flex gap-2 items-center'>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    autoFocus
                    className='rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none'
                  />
                  <button
                    onClick={saveDisplayName}
                    disabled={saving || !displayName.trim()}
                    className='rounded-full px-3 py-1.5 text-xs bg-primary-default text-text-on-primary hover:bg-primary-hover disabled:opacity-50'
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className='rounded-full px-3 py-1.5 text-xs border border-border-default text-text-primary hover:bg-surface-1 disabled:opacity-50'
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h3 className='text-text-primary'>{currentDisplayName}</h3>

                  <p className='text-text-secondary'>{email}</p>

                  <div className='mt-2 flex items-center gap-2'>
                    <button
                      onClick={() => setEditing(true)}
                      className='rounded-full px-3 py-1.5 text-xs bg-primary-default text-text-on-primary border border-border-on-active hover:bg-primary-hover no-underline transition-colors duration-150'
                    >
                      Edit
                    </button>

                    <button
                      onClick={async () => {
                        await signOut();
                        navigate('/');
                      }}
                      className='rounded-full px-3 py-1.5 text-xs bg-surface-1 text-text-primary border border-border-on-active'
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <h3 className='mt-6 text-text-primary'>Your Reviews</h3>

          {reviewsLoading ? (
            <p className='mt-2 text-sm text-text-secondary'>Loading…</p>
          ) : reviews.length === 0 ? (
            <p className='mt-2 text-sm text-text-secondary'>No reviews yet</p>
          ) : (
            <div className='grid gap-3'>
              {reviews.map(r => (
                <div
                  key={String(r.id)}
                  className='rounded-2xl border border-border-default bg-surface-2 p-4'
                >
                  <ReviewItem item={r} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
