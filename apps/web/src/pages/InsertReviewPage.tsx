import {
  insertReview,
  RATING_SCALE,
  LocationState,
  setShopDrinkCategories,
} from '@cuptrail/core';
import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { suggestCategoriesByKeyword, slugToLabel } from '@cuptrail/utils';
import type { SnackState } from '../types';

export default function InsertReviewPage() {
  const { shopId } = useParams<{ shopId: string }>();
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
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);

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
    if (!review.trim()) {
      setSnack({
        open: true,
        message: 'Please enter a valid review.',
        severity: 'error',
      });
      return;
    }
    if (!drink.trim()) {
      setSnack({
        open: true,
        message: 'Please enter a valid drink.',
        severity: 'error',
      });
      return;
    }
    if (!shopId) return;

    // add review

    const result = await insertReview(shopId, drink, parsed, review);
    if (result.success) {
      const shopDrinkId = result.data.shop_drinks?.id;
      if (shopDrinkId && suggestedCategories.length > 0) {
        // add categories to shop drink
        const catResult = await setShopDrinkCategories(
          result.data.shop_drinks?.id,
          suggestedCategories
        );
        if (catResult.success) {
          setSnack({
            open: true,
            message: 'Categories added successfully!',
            severity: 'success',
          });
        } else {
          console.error('setShopDrinkCategories failed:', catResult.message);
          setSnack({
            open: true,
            message: 'Failed to add categories.',
            severity: 'error',
          });
        }
      }
      setSnack({
        open: true,
        message: 'Review added successfully!',
        severity: 'success',
      });
      setDrink('');
      setRating('');
      setReview('');
      setSuggestedCategories([]);
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
        onBlur={() =>
          setSuggestedCategories(suggestCategoriesByKeyword(drink.trim()))
        }
        fullWidth
      />
      {/* Suggested categories */}
      {suggestedCategories.length > 0 && (
        <Stack direction="row" gap={1} flexWrap="wrap">
          {suggestedCategories.map(cat => (
            <Chip
              key={cat}
              label={slugToLabel(cat)}
              onDelete={() =>
                setSuggestedCategories(prev => prev.filter(c => c !== cat))
              }
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>
      )}
      <TextField label="Shop" value={shopName} fullWidth disabled />
      <TextField
        type="number"
        label={`Rating (${RATING_SCALE.MIN} - ${RATING_SCALE.MAX})`}
        value={rating}
        onChange={e => setRating(e.target.value)}
        inputProps={{ min: RATING_SCALE.MIN, max: RATING_SCALE.MAX }}
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
