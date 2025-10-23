import { Box, Button, Dialog, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useIdleTimer } from 'react-idle-timer';

import type { IdleSessionManagerProps } from './types';

/**
 * Deprecated in favor of long-lived sessions
 * @param timeoutMs
 * @param autoLogoutMs
 * @param onLogout callback
 * @returns
 */
export default function IdleSessionManager({
  timeoutMs = 20 * 60 * 1000, // 20 minutes
  autoLogoutMs,
  onLogout,
}: IdleSessionManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [deadlineId, setDeadlineId] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const clearDeadline = () => {
    if (deadlineId !== null) {
      clearTimeout(deadlineId);
      setDeadlineId(null);
    }
  };
  const handleStay = () => {
    clearDeadline();
    setShowModal(false);
    reset(); // resets the idle timer back to full timeout
  };

  // auto logout
  const handleLogout = async () => {
    clearDeadline();
    setShowModal(false);
    await onLogout();
  };
  // when user becomes idle
  const onIdle = useCallback(() => {
    setShowModal(true);
    // optional auto-logout countdown
    if (autoLogoutMs && Number.isFinite(autoLogoutMs)) {
      setSecondsLeft(Math.ceil(autoLogoutMs / 1000));
      const id = window.setTimeout(() => {
        handleLogout();
      }, autoLogoutMs);
      setDeadlineId(id);
    } else {
      setSecondsLeft(null);
    }
  }, [autoLogoutMs]);

  const { reset } = useIdleTimer({
    timeout: timeoutMs,
    onIdle,
    promptBeforeIdle: 0,
    throttle: 500,
    // crossTab: true // enable later for multi-tab
  });

  useEffect(() => {
    if (!showModal || secondsLeft == null) return;
    const intId = window.setTimeout(() => {
      setSecondsLeft(s => (s == null ? s : Math.max(0, s - 1)));
    }, 1000);
    return () => clearTimeout(intId);
  }, [showModal, secondsLeft]);
  if (!showModal) return null;

  return (
    <Dialog
      open={showModal}
      onClose={handleStay}
      fullWidth
      maxWidth="xs"
      aria-labelledby="idle-title"
      aria-describedby="idle-desc"
    >
      <Box sx={{ p: 3 }}>
        <Typography id="idle-title" fontWeight={700} gutterBottom>
          Are you still there?
        </Typography>

        <Typography id="idle-desc" sx={{ color: 'text.secondary', mb: 2 }}>
          You’ve been inactive for a while.{' '}
          {secondsLeft != null ? (
            <>
              You’ll be logged out in <b>{secondsLeft}s</b> unless you stay
              signed in.
            </>
          ) : (
            // only displays when log timeout is omitted
            <>Choose an option below.</>
          )}
        </Typography>
        <Button onClick={handleStay}>Stay</Button>
      </Box>
    </Dialog>
  );
}
