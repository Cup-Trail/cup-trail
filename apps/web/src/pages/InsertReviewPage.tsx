import { insertReview } from '@cuptrail/core';
import { RATING_SCALE } from '@cuptrail/core';
import type { LocationState } from '@cuptrail/core';
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import type { SnackState } from '../types';

export default function InsertReviewPage() {
  const { shopId } = useParams();
  const location = useLocation();
  const shopName = (location.state as LocationState)?.shopName ?? '';

  const [drink, setDrink] = useState('');
  const [rating, setRating] = useState('');
  const [review, setReview] = useState('');
  const [snack, setSnack] = useState<SnackState>({
    open: false,
    message: '',
    severity: 'success',
  });

  async function handleSubmit() {
    const parsed = parseFloat(rating);
    if (
      Number.isNaN(parsed) ||
      parsed < RATING_SCALE.MIN ||
      parsed > RATING_SCALE.MAX
    ) {
      setSnack({
        open: true,
        message: `Please enter a rating between ${RATING_SCALE.MIN} and ${RATING_SCALE.MAX}.`,
        severity: 'error',
      });
      return;
    }
    if (!review) {
      setSnack({
        open: true,
        message: 'Please enter a valid review.',
        severity: 'error',
      });
      return;
    }
    if (!drink) {
      setSnack({
        open: true,
        message: 'Please enter a valid drink.',
        severity: 'error',
      });
      return;
    }
    if (!shopId) return;

    const result = await insertReview(shopId, drink, parsed, review);
    if (result.success) {
      setSnack({
        open: true,
        message: 'Review added successfully!',
        severity: 'success',
      });
      setDrink('');
      setRating('');
      setReview('');
    } else {
      setSnack({
        open: true,
        message: 'Failed to add review.',
        severity: 'error',
      });
    }
  }

  return (
    <Stack gap={2}>
      <Typography variant="h5" textAlign="center" fontWeight={700}>
        Add Your Review
      </Typography>
      <Typography variant="body2" textAlign="center" color="text.secondary">
        Track your favorite drinks from each shop!
      </Typography>

      <TextField
        label="Drink"
        value={drink}
        onChange={e => setDrink(e.target.value)}
        fullWidth
      />
      <TextField label="Shop" value={shopName} fullWidth disabled />
      <TextField
        label={`Rating (${RATING_SCALE.MIN} - ${RATING_SCALE.MAX})`}
        value={rating}
        onChange={e => setRating(e.target.value)}
        fullWidth
      />
      <TextField
        label="Your Review"
        value={review}
        onChange={e => setReview(e.target.value)}
        fullWidth
        multiline
        minRows={4}
      />

      <Box>
        <Button variant="contained" onClick={handleSubmit}>
          Add Review
        </Button>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s: typeof snack) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s: typeof snack) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
