import {
  calculateAndUpdateAvgRating,
  insertReview,
  LocationState,
  RATING_SCALE,
  setShopDrinkCategories,
  updateReview,
  updateShopDrinkCoverFromMedia,
} from '@cuptrail/core';
import { slugToLabel, suggestCategoriesByKeyword } from '@cuptrail/utils';
import { uploadReviewMedia } from '@cuptrail/utils/storage'; // ⭐ make sure the path matches your setup
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
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

  // ⭐ NEW: Media array of Files
  const [mediaArr, setMediaArr] = useState<File[]>([]);

  // Remove one photo
  const handleRemoveMedia = (index: number) => {
    setMediaArr(prev => prev.filter((_, i) => i !== index));
  };

  // Select photos
  const handleMediaSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setMediaArr(prev => [...prev, ...newFiles]);
  };

  async function handleSubmitReview() {
    const { rating, drinkName, comments } = getValues();
    const parsed = parseFloat(rating);

    // ------- VALIDATION -------
    if (!drinkName.trim()) {
      setSnack({
        open: true,
        message: 'Please enter a valid drink.',
        severity: 'error',
      });
      return;
    }

    if (
      Number.isNaN(parsed) ||
      parsed < RATING_SCALE.MIN ||
      parsed > RATING_SCALE.MAX
    ) {
      setSnack({
        open: true,
        message: `Rating must be between ${RATING_SCALE.MIN} and ${RATING_SCALE.MAX}.`,
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

    if (!shopId) return;

    // ----------------------------
    // 1. INSERT REVIEW (TEXT + RATING ONLY)
    // ----------------------------
    const reviewResult = await insertReview(
      shopId,
      drinkName.trim(),
      parsed,
      comments.trim()
    );

    if (!reviewResult.success) {
      setSnack({
        open: true,
        message: 'Failed to add review.',
        severity: 'error',
      });
      return;
    }

    const reviewId = reviewResult.data.id;
    const shopDrinkId = reviewResult.data.shop_drinks?.id ?? null;

    const uploadedUrls: string[] = [];

    // ----------------------------
    // 2. UPLOAD MEDIA
    // ----------------------------
    for (const file of mediaArr) {
      try {
        const buffer = await file.arrayBuffer();
        const ext = file.type.split('/')[1] ?? 'jpg';

        const upload = await uploadReviewMedia(reviewId, {
          content: buffer,
          mime: file.type,
          ext,
          fileName: file.name,
        });

        if (upload.success) {
          uploadedUrls.push(upload.url);
        }
      } catch (err) {
        console.error('Media upload failed:', err);
      }
    }

    // ----------------------------
    // 3. UPDATE REVIEW MEDIA (NON-FATAL)
    // ----------------------------
    if (uploadedUrls.length > 0) {
      const updateResult = await updateReview(reviewId, {
        media_urls: uploadedUrls,
      });

      if (!updateResult.success) {
        console.error('Failed to update review media:', updateResult.message);
      }

      if (shopDrinkId) {
        await updateShopDrinkCoverFromMedia(shopDrinkId, uploadedUrls);
      }
    }

    // ----------------------------
    // 4. UPDATE AVG RATING (ONCE)
    // ----------------------------
    if (shopDrinkId) {
      await calculateAndUpdateAvgRating(shopDrinkId);
    }

    // ----------------------------
    // 5. OPTIONAL: CATEGORIES
    // ----------------------------
    if (shopDrinkId && suggestedCategories.length > 0) {
      await setShopDrinkCategories(shopDrinkId, suggestedCategories);
    }

    // ----------------------------
    // 6. SUCCESS + RESET
    // ----------------------------
    setSnack({
      open: true,
      message: 'Review added successfully!',
      severity: 'success',
    });

    reset();
    setSuggestedCategories([]);
    setMediaArr([]);
  }
  return (
    <Stack gap={2}>
      <Typography variant="h5" textAlign="center" fontWeight={700}>
        Add a Review
      </Typography>

      {/* DRINK NAME */}
      <TextField
        {...register('drinkName')}
        label="Drink Name (required)"
        onBlur={() => {
          const inputValue = getValues('drinkName').trim();
          setSuggestedCategories(suggestCategoriesByKeyword(inputValue));
        }}
        fullWidth
      />

      {/* SUGGESTED CATEGORIES */}
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

      {/* SHOP NAME (locked) */}
      <TextField label="Shop" value={shopName} fullWidth disabled />

      {/* RATING */}
      <TextField
        {...register('rating')}
        type="number"
        label={`Rating (${RATING_SCALE.MIN} - ${RATING_SCALE.MAX})`}
        slotProps={{
          htmlInput: { min: RATING_SCALE.MIN, max: RATING_SCALE.MAX },
        }}
        fullWidth
      />

      {/* COMMENTS */}
      <TextField
        {...register('comments')}
        label="Comments"
        fullWidth
        multiline
        minRows={4}
      />

      {/* MEDIA UPLOAD BUTTON */}
      <Button
        variant="outlined"
        startIcon={<PhotoCameraIcon />}
        component="label"
        sx={{ alignSelf: 'flex-start' }}
      >
        Upload Media
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => handleMediaSelect(e.target.files)}
        />
      </Button>

      {/* MEDIA PREVIEW STRIP */}
      {mediaArr.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', py: 1 }}>
          {mediaArr.map((file, idx) => (
            <Paper
              key={idx}
              sx={{
                p: 1,
                position: 'relative',
                width: 120,
                height: 120,
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
              }}
              elevation={3}
            >
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveMedia(idx)}
                sx={{ position: 'absolute', top: 2, right: 2 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      )}

      {/* SUBMIT BUTTON */}
      <Box display="flex" justifyContent="center">
        <Button variant="contained" onClick={handleSubmitReview} fullWidth>
          Save Review
        </Button>
      </Box>

      {/* SNACKBAR */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s: SnackState) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s: SnackState) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
