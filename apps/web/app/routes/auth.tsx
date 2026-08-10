import { Alert, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '@components/inputs';

import { useAuth } from '../context/AuthContext';

export default function AuthRoute() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, createAccount, signIn } = useAuth();

  const [busy, setBusy] = useState<'create' | 'signin' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/');
  }, [loading, isAuthenticated, navigate]);

  async function run(kind: 'create' | 'signin') {
    setBusy(kind);
    setError('');
    const result = kind === 'create' ? await createAccount() : await signIn();
    setBusy(null);
    if (result.ok) navigate('/');
    else if (result.message) setError(result.message);
  }

  return (
    <div className='flex flex-col justify-center gap-6 max-w-md mx-auto text-center'>
      <div>
        <h3>Welcome to Cup Trail</h3>
        <p className='text-text-secondary'>
          Your account is secured with a passkey — no password or email needed.
        </p>
      </div>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError('')}
          severity='error'
          variant='filled'
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <div className='flex flex-col gap-3'>
        <Button onClick={() => run('create')} disabled={busy !== null}>
          {busy === 'create' ? 'Setting up…' : 'Create account with passkey'}
        </Button>

        <div className='text-sm text-text-secondary'>
          Already have an account?
        </div>

        <Button onClick={() => run('signin')} disabled={busy !== null}>
          {busy === 'signin' ? 'Signing in…' : 'Sign in with passkey'}
        </Button>
      </div>

      <small className='text-text-secondary'>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </small>
    </div>
  );
}
