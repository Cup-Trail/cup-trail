import { supabase } from '@cuptrail/utils';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const navigate = useNavigate();
  const redirect = `${import.meta.env.BASE_URL}#auth/callback`;
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'verifying' | 'error'>(
    'idle'
  );
  const [message, setMessage] = useState<string>('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);

  // countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function sendOtpCode(): Promise<void> {
    setStatus('idle');
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
        },
      });
      if (error) {
        if (error.message === 'Signups not allowed for otp') {
          const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              shouldCreateUser: true,
              emailRedirectTo: redirect,
            },
          });
          if (error) throw error;
          setShowOtpInput(false);
          setStatus('sent');
          setCountdown(60); // 60 sec cooldown
          setIsNewUser(true);
          setMessage(`Verify your email through the link sent to ${email}`);
        } else {
          throw error;
        }
      } else {
        setStatus('sent');
        setShowOtpInput(true);
        setCountdown(60); // 60 sec cooldown
        setMessage('Check your email for the 6-digit verification code.');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Failed to send verification code');
    }
  }

  async function verifyOtpCode(): Promise<void> {
    setStatus('verifying');
    setMessage('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });
      if (error) throw error;
      // successfully signed in
      navigate('/');
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Invalid verification code. Please try again.');
    }
  }

  function resetForm(): void {
    setShowOtpInput(false);
    setOtp('');
    setStatus('idle');
    setMessage('');
    setCountdown(0);
    setIsNewUser(false);
  }

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
        }}
      >
        {/* text & subtitle */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h4"
            gutterBottom
            fontWeight={500}
            color="primary.main"
          >
            Welcome to Cup Trail!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            gutterBottom
            sx={{ mb: 4 }}
          >
            Sign in to review and discover your favorite coffee shops
          </Typography>
        </Box>
        <Stack gap={3}>
          {status !== 'idle' && (
            <Alert
              severity={status === 'error' ? 'error' : 'success'}
              sx={{ mb: 2 }}
            >
              {message}
            </Alert>
          )}
          {/* email */}
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            fullWidth
            disabled={showOtpInput}
            onKeyDown={e => {
              if (e.key === 'Enter' && email && !showOtpInput) {
                sendOtpCode();
              }
            }}
          />
          {/* otp input (shown after email is sent) */}
          {showOtpInput && (
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                mb={2}
              >
                Enter the 6-digit code sent to {email}
              </Typography>
              <Box>
                <TextField
                  label="Verification Code"
                  value={otp}
                  onChange={e => {
                    const cleaned = e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6);
                    setOtp(cleaned);
                  }}
                  placeholder="123456"
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    htmlInput: {
                      maxLength: 6,
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
                  helperText="Enter the 6-digit code from your email"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && otp.length === 6) {
                      verifyOtpCode();
                    }
                  }}
                  autoFocus
                  disabled={status === 'verifying'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          )}
          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            {!showOtpInput ? (
              <Button
                variant="contained"
                onClick={sendOtpCode}
                disabled={!email || status === 'sent' || countdown > 0}
                size="large"
                fullWidth
              >
                Send Verification Code
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={verifyOtpCode}
                  disabled={otp.length !== 6 || status === 'verifying'}
                  size="large"
                >
                  {status === 'verifying' ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button variant="outlined" onClick={resetForm} size="large">
                  Change Email
                </Button>
              </>
            )}
          </Stack>
          {/* Resend Code Button */}
          {showOtpInput && (
            <Box textAlign="center">
              <Button
                variant="text"
                onClick={sendOtpCode}
                disabled={countdown > 0}
                size="small"
              >
                {countdown > 0
                  ? `Resend code in ${countdown}s`
                  : 'Resend verification code'}
              </Button>
            </Box>
          )}
          {/* <Divider sx={{ my: 2 }} /> */}
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
