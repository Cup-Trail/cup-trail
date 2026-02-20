import { supabase } from '@cuptrail/utils';
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

export default function AuthRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'sent' | 'verifying' | 'error'
  >('idle');
  const [message, setMessage] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [canTryOtp, setCanTryOtp] = useState(false);
  const [canResendConfirm, setCanResendConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const cleanedEmail = email.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail);
  const isBusy = status === 'sending' || status === 'verifying';

  function computeRedirect(): string {
    const { origin, pathname } = globalThis.location;
    const prMatch = pathname.match(/\/cup-trail\/pr-\d+\//);
    const base = prMatch ? prMatch[0] : import.meta.env.BASE_URL || '/';
    return `${origin}${base}`;
  }

  function resetFlowFlags() {
    setShowOtpInput(false);
    setCanTryOtp(false);
    setCanResendConfirm(false);
  }

  useEffect(() => {
    if (location.state?.reset) {
      resetForm();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const resendConfirmationEmail = useCallback(async () => {
    if (!isValidEmail || isBusy) return;

    setStatus('sending');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanedEmail,
      options: { emailRedirectTo: computeRedirect() },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to send verification link.');
      return;
    }

    setStatus('sent');
    setMessage(`Verification link sent to ${cleanedEmail}.`);
    setCountdown(60);
  }, [cleanedEmail, isValidEmail, isBusy]);

  const sendOtpCode = useCallback(async () => {
    if (isBusy || !isValidEmail) return;

    setStatus('sending');
    setMessage('');
    resetFlowFlags();

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanedEmail,
      options: { shouldCreateUser: false },
    });

    if (error) {
      if (error.message === 'Signups not allowed for otp') {
        const { error: signUpErr } = await supabase.auth.signInWithOtp({
          email: cleanedEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: computeRedirect(),
          },
        });
        if (signUpErr) {
          setStatus('error');
          setMessage(signUpErr.message || 'Failed to send email');
          return;
        }
        setCanResendConfirm(true);
        setStatus('sent');
        setCountdown(60);
        setMessage(`Almost there—check ${cleanedEmail} to confirm your email.`);
        return;
      }
      setStatus('error');
      setMessage(error.message || 'Failed to send email');
      return;
    }

    setStatus('sent');
    setCountdown(60);
    setCanTryOtp(true);
    setCanResendConfirm(true);
    setMessage(
      'Check your email for a 6-digit code, or confirm sign-up using the link.'
    );
  }, [isBusy, isValidEmail, cleanedEmail]);

  const verifyOtpCode = useCallback(async () => {
    if (isBusy) return;

    setStatus('verifying');
    setMessage('');

    const { error } = await supabase.auth.verifyOtp({
      email: cleanedEmail,
      token: otp.trim(),
      type: 'email',
    });
    if (error) {
      setStatus('error');
      setMessage(
        error.message || 'Invalid verification code. Please try again.'
      );
      return;
    }

    navigate('/');
  }, [isBusy, cleanedEmail, otp, navigate]);

  function resetForm() {
    setEmail('');
    setOtp('');
    setStatus('idle');
    setMessage('');
    resetFlowFlags();
    setCountdown(0);
  }

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant='h4'
            gutterBottom
            fontWeight={500}
            color='primary.main'
          >
            Welcome to Cup Trail!
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            gutterBottom
            sx={{ mb: 4 }}
          >
            Sign in to review and discover your favorite coffee shops
          </Typography>
        </Box>

        <Stack gap={3}>
          <Snackbar
            open={Boolean(message) && !isBusy}
            autoHideDuration={5000}
            onClose={() => setMessage('')}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setMessage('')}
              severity={status === 'error' ? 'error' : 'success'}
              variant='filled'
              sx={{ width: '100%' }}
            >
              {message}
            </Alert>
          </Snackbar>

          <TextField
            label='Email Address'
            type='email'
            value={email}
            helperText={
              !isValidEmail && email ? 'Enter a valid email address' : ' '
            }
            error={!isValidEmail && !!email}
            onChange={e => {
              setEmail(e.target.value);
              setMessage('');
              resetFlowFlags();
            }}
            placeholder='you@example.com'
            fullWidth
            disabled={showOtpInput || isBusy}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                isValidEmail &&
                !showOtpInput &&
                !isBusy
              ) {
                sendOtpCode();
              }
            }}
          />

          {showOtpInput && (
            <TextField
              label='Verification Code'
              value={otp}
              onChange={e =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder='123456'
              fullWidth
              variant='outlined'
              slotProps={{
                htmlInput: {
                  maxLength: 6,
                  inputMode: 'numeric',
                  style: {
                    textAlign: 'center',
                    fontSize: '2rem',
                    letterSpacing: '0.8rem',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    padding: '1rem',
                  },
                },
              }}
              helperText='Enter the 6-digit code from your email'
              onKeyDown={e => {
                if (e.key === 'Enter' && otp.length === 6) verifyOtpCode();
              }}
              autoFocus
              disabled={status === 'verifying'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  '&.Mui-focused': { backgroundColor: 'white' },
                },
              }}
            />
          )}

          <Stack direction='row' spacing={2}>
            {!showOtpInput ? (
              canTryOtp || canResendConfirm ? (
                <>
                  {canTryOtp && (
                    <Button
                      variant='contained'
                      onClick={() => {
                        setMessage('');
                        setShowOtpInput(true);
                      }}
                      size='large'
                      fullWidth
                    >
                      Enter 6-digit code
                    </Button>
                  )}
                  {canResendConfirm && (
                    <Button
                      variant='outlined'
                      onClick={resendConfirmationEmail}
                      disabled={countdown > 0 || status === 'sending'}
                      size='large'
                      fullWidth
                    >
                      {status === 'sending'
                        ? 'Sending…'
                        : countdown > 0
                          ? `Resend sign-up confirmation in ${countdown}s`
                          : 'Resend sign-up confirmation'}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant='contained'
                  onClick={sendOtpCode}
                  disabled={!isValidEmail || isBusy}
                  size='large'
                  fullWidth
                >
                  {status === 'sending' ? 'Sending…' : 'Continue'}
                </Button>
              )
            ) : (
              <>
                <Button
                  variant='contained'
                  onClick={verifyOtpCode}
                  disabled={otp.length !== 6 || isBusy}
                  size='large'
                  fullWidth
                >
                  {status === 'verifying' ? 'Verifying…' : 'Sign in'}
                </Button>
                <Button
                  variant='outlined'
                  onClick={() => setShowOtpInput(false)}
                  size='large'
                >
                  Back
                </Button>
              </>
            )}
          </Stack>

          {showOtpInput && (
            <Box textAlign='center'>
              <Button
                variant='text'
                onClick={sendOtpCode}
                disabled={countdown > 0}
                size='small'
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
              </Button>
            </Box>
          )}

          <Typography
            variant='caption'
            color='text.secondary'
            textAlign='center'
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
