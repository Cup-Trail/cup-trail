import { supabase } from '@cuptrail/utils';
import { Alert, Snackbar } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { Button, InputText } from '@components/inputs';

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
    <div className='flex flex-col justify-center gap-6 max-w-2xl mx-auto'>
      <div className='text-center'>
        <h3>Welcome to Cup Trail</h3>
        <p className='text-text-secondary'>
          Sign in to review and discover your favorite coffee shops
        </p>
      </div>

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
      <InputText
        id='email'
        name='email'
        label='Email Address'
        autoComplete='email'
        inputMode='email'
        value={email}
        required
        onChange={e => {
          setEmail(e.currentTarget.value);
          setMessage('');
          resetFlowFlags();
        }}
        placeholder='kat@cup-trail.com'
        disabled={showOtpInput || isBusy}
        onKeyDown={e => {
          if (e.key === 'Enter' && isValidEmail && !showOtpInput && !isBusy) {
            sendOtpCode();
          }
        }}
        className='w-96 max-w-full'
      />

      {showOtpInput && (
        <InputText
          label='Verification Code'
          name='otp'
          autoComplete='one-time-code'
          className='tracking-widest font-monospace text-3xl font-bold w-48 text-center'
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder='123456'
          maxLength={6}
          inputMode='numeric'
          onKeyDown={e => {
            if (e.key === 'Enter' && otp.length === 6) verifyOtpCode();
          }}
          autoFocus
          disabled={status === 'verifying'}
        />
      )}

      <div className='flex flex-row gap-2'>
        {!showOtpInput ? (
          canTryOtp || canResendConfirm ? (
            <>
              {canTryOtp && (
                <Button
                  onClick={() => {
                    setMessage('');
                    setShowOtpInput(true);
                  }}
                >
                  Enter 6-digit code
                </Button>
              )}
              {canResendConfirm && (
                <Button
                  onClick={resendConfirmationEmail}
                  disabled={countdown > 0 || status === 'sending'}
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
            <Button onClick={sendOtpCode} disabled={!isValidEmail || isBusy}>
              {status === 'sending' ? 'Sending…' : 'Continue'}
            </Button>
          )
        ) : (
          <>
            <Button
              onClick={verifyOtpCode}
              disabled={otp.length !== 6 || isBusy}
            >
              {status === 'verifying' ? 'Verifying…' : 'Sign in'}
            </Button>
            <Button onClick={() => setShowOtpInput(false)}>Back</Button>
          </>
        )}
      </div>

      {showOtpInput && (
        <div>
          <Button onClick={sendOtpCode} disabled={countdown > 0}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </Button>
        </div>
      )}

      <small className='text-text-secondary'>
        By signing in, you agree to our Terms of Service and Privacy Policy
      </small>
    </div>
  );
}
