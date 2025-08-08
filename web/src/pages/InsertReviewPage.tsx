import { Alert, Box, Button, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { insertReview } from '../lib/reviews';

export default function InsertReviewPage() {
  const { shopId } = useParams();
  const location = useLocation() as any;
  const shopName = location.state?.shopName ?? '';
  // no navigation needed here

  const [drink, setDrink] = useState('');
  const [rating, setRating] = useState('');
  const [review, setReview] = useState('');
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  async function handleSubmit() {
    const parsed = parseFloat(rating);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 10) {
      setSnack({
        open: true,
        message: 'Please enter a rating between 0 and 10.',
        severity: 'error',
      });
      return;
    }
    if (!review) {
      setSnack({ open: true, message: 'Please enter a valid review.', severity: 'error' });
      return;
    }
    if (!drink) {
      setSnack({ open: true, message: 'Please enter a valid drink.', severity: 'error' });
      return;
    }
    if (!shopId) return;

    const result = await insertReview(shopId, drink, parsed, review);
    if (result.success) {
      setSnack({ open: true, message: 'Review added successfully!', severity: 'success' });
      setDrink('');
      setRating('');
      setReview('');
    } else {
      setSnack({ open: true, message: 'Failed to add review.', severity: 'error' });
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

      <TextField label="Drink" value={drink} onChange={(e) => setDrink(e.target.value)} fullWidth />
      <TextField label="Shop" value={shopName} fullWidth disabled />
      <TextField
        label="Rating (0 - 10)"
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        fullWidth
      />
      <TextField
        label="Your Review"
        value={review}
        onChange={(e) => setReview(e.target.value)}
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
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
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
