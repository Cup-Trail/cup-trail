import { getReviewsByUser, type User, type ReviewRow } from '@cuptrail/core';
import { supabase } from '@cuptrail/utils';
import {
  Cancel as CancelIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ReviewItem from './SearchPage/ReviewItem';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        navigate('/auth');
        return;
      }
      setUser(data.user as User);
      setDisplayName(data.user.user_metadata?.display_name || 'User');
      setLoading(false);
      getReviewsByUser(data.user.id).then(data => {
        if (data.success) {
          setReviews(data.data);
        }
      });
    });
  }, [navigate]);

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    navigate('/');
  }

  async function saveDisplayName(): Promise<void> {
    if (!displayName.trim()) return;

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });

    if (error) {
      console.error('Failed to update display name:', error);
      setSaving(false);
      return;
    }

    // Update local user state
    setUser(prev =>
      prev
        ? {
            ...prev,
            user_metadata: {
              ...prev.user_metadata,
              display_name: displayName.trim(),
            },
          }
        : null
    );

    setEditing(false);
    setSaving(false);
  }

  function cancelEdit(): void {
    setDisplayName(user?.user_metadata?.display_name || 'User');
    setEditing(false);
  }

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  const currentDisplayName = user?.user_metadata?.display_name || 'User';
  const email = user?.email || 'No email';
  const initials = currentDisplayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 2,
        paddingTop: 4,
      }}
    >
      <Box
        sx={{
          maxWidth: 800,
          width: '100%',
          backgroundColor: 'white',
          borderRadius: 3,
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          padding: 4,
          minHeight: 'calc(100vh - 6rem)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant='h4'
            fontWeight={700}
            color='primary.main'
            gutterBottom
          >
            Profile
          </Typography>
        </Box>
        <Stack gap={3}>
          <Stack direction='row' gap={2} alignItems='center'>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              {editing ? (
                <Stack direction='row' gap={1} alignItems='center'>
                  <TextField
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    size='small'
                    autoFocus
                    sx={{ flex: 1 }}
                  />
                  <Button
                    size='small'
                    onClick={saveDisplayName}
                    disabled={saving || !displayName.trim()}
                    startIcon={<SaveIcon />}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size='small'
                    onClick={cancelEdit}
                    disabled={saving}
                    startIcon={<CancelIcon />}
                  >
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Stack direction='row' gap={1} alignItems='center'>
                  <Typography variant='h6'>{currentDisplayName}</Typography>
                  <Button
                    size='small'
                    onClick={() => setEditing(true)}
                    startIcon={<EditIcon />}
                  >
                    Edit
                  </Button>
                </Stack>
              )}
              <Typography variant='body2' color='text.secondary'>
                {email}
              </Typography>
            </Box>
          </Stack>
          <Button variant='outlined' color='error' onClick={signOut}>
            Sign out
          </Button>
          {reviews && (
            <>
              <Typography variant='h6'>Your Reviews</Typography>
              {reviews.length === 0 && (
                <Typography>No recent reviews</Typography>
              )}
              {reviews.length > 0 && (
                <Stack gap={1}>
                  {reviews.map(item => (
                    <ReviewItem key={item.id} item={item} />
                  ))}
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
