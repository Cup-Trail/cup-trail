import {
  insertReview,
  LocationState,
  RATING_SCALE,
  setShopDrinkCategories,
} from '@cuptrail/core';
import { slugToLabel, suggestCategoriesByKeyword } from '@cuptrail/utils';
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
import { useForm } from 'react-hook-form';
import { useLocation, useParams } from 'react-router-dom';

import type { SnackState } from '../types';

export default function InsertReviewPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const location = useLocation();
  const shopName = (location.state as LocationState)?.shopName ?? '';

  const { register, getValues, reset } = useForm({
    defaultValues: {
      drinkName: '',
      rating: '',
      comments: '',
    },
  });

  const [snack, setSnack] = useState<SnackState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);

  async function handleSubmitReview() {
    const { rating, drinkName, comments } = getValues();
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
    if (!comments.trim()) {
      setSnack({
        open: true,
        message: 'Please enter a valid review.',
        severity: 'error',
      });
      return;
    }
    if (!drinkName.trim()) {
      setSnack({
        open: true,
        message: 'Please enter a valid drink.',
        severity: 'error',
      });
      return;
    }
    if (!shopId) return;

    // add review

    const result = await insertReview(shopId, drinkName, parsed, comments);
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
      reset();
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
        Add a review
      </Typography>

      <TextField
        {...register('drinkName')}
        label="Drink Name (required)"
        onBlur={() => {
          const inputValue = getValues('drinkName').trim();
          setSuggestedCategories(suggestCategoriesByKeyword(inputValue));
        }}
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
        {...register('rating')}
        type="number"
        label={`Rating (${RATING_SCALE.MIN} - ${RATING_SCALE.MAX})`}
        slotProps={{
          htmlInput: { min: RATING_SCALE.MIN, max: RATING_SCALE.MAX },
        }}
        fullWidth
      />
      <TextField
        {...register('comments')}
        label="Comments"
        fullWidth
        multiline
        minRows={4}
      />

      <Box display="flex" justifyContent="center">
        <Button variant="contained" onClick={handleSubmitReview} fullWidth>
          Save Review
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
