import type { User } from '@cuptrail/core';
import {
  calculateAndUpdateAvgRating,
  insertReview,
  RATING_SCALE,
  setShopDrinkCategories,
  updateReview,
  updateShopDrinkCoverFromMedia,
} from '@cuptrail/core';
import { getUser, slugToLabel } from '@cuptrail/utils';
import { uploadReviewMedia } from '@cuptrail/utils/storage'; // ⭐ make sure the path matches your setup
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Paper,
  Snackbar,
  Stack,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useShopIdQuery } from '../queries';
import type { SnackState } from '../types';

const createStarArray = (rating: number) =>
  Array.from({ length: 5 }, (_, i) => rating > i);

export default function InsertReviewPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const shopQueryResult = useShopIdQuery(shopId);
  const { data: shop } = shopQueryResult;

  // Rating-related things
  const [rating, setRating] = useState<number>(1);
  const [previewRating, setPreviewRating] = useState(1);
  const [isPreview, setIsPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stars: boolean[] = createStarArray(isPreview ? previewRating : rating);

  useEffect(() => {
    if (shopQueryResult.isFetched && !shopQueryResult.data) {
      navigate('/');
    }
  }, [shopQueryResult, navigate]);

  useEffect(() => {
    getUser().then(res => setUser(res));
  }, []);

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
    const { drinkName, comments } = getValues();
    setIsSaving(true);

    // ------- VALIDATION -------
    if (!drinkName.trim()) {
      setSnack({
        open: true,
        message: 'Please enter a valid drink.',
        severity: 'error',
      });
      setIsSaving(false);
      return;
    }

    if (rating < RATING_SCALE.MIN || rating > RATING_SCALE.MAX) {
      setSnack({
        open: true,
        message: `Rating must be between ${RATING_SCALE.MIN} and ${RATING_SCALE.MAX}.`,
        severity: 'error',
      });
      setIsSaving(false);
      return;
    }

    if (!comments.trim()) {
      setSnack({
        open: true,
        message: 'Please enter a valid review.',
        severity: 'error',
      });
      setIsSaving(false);
      return;
    }

    if (!shopId) return;

    // ----------------------------
    // 1. INSERT REVIEW (TEXT + RATING ONLY)
    // ----------------------------
    const reviewResult = await insertReview(
      shopId,
      drinkName.trim(),
      rating,
      comments.trim(),
      null,
      user ? user.id : null
    );

    if (!reviewResult.success) {
      setSnack({
        open: true,
        message: 'Failed to add review.',
        severity: 'error',
      });
      setIsSaving(false);
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
        if (!upload.success) {
          setIsSaving(false);
          globalThis.alert(
            'There was an error uploading your media for this review.'
          );
          return;
        }
      } catch (err) {
        console.error('Media upload failed:', err);
        setIsSaving(false);
        globalThis.alert(
          'There was an error uploading your media for this review.'
        );
        return;
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
        setIsSaving(false);
        globalThis.alert('There was a problem uploading your review.');
        return;
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
    navigate(`/shop/${shopId}`);
    setIsSaving(false);
    reset();
    setSuggestedCategories([]);
    setMediaArr([]);
  }

  return (
    <div className='flex flex-col gap-6 max-w-2xl mx-auto'>
      <div>
        <h3 className='text-center font-bold'>
          Add a Review at {shop && shop.name}
        </h3>
        <p className='text-text-secondary text-center'>{shop?.address}</p>
      </div>

      {/* DRINK NAME */}
      <div className='flex flex-col gap-2 items-start'>
        <label htmlFor='drinkName'>Drink Name (required)</label>
        <input
          type='text'
          className='py-2 px-3 bg-surface-2 border-border-default border rounded-lg w-full xs:w-72'
          id='drinkName'
          {...register('drinkName')}
        />
      </div>

      {/* SUGGESTED CATEGORIES */}
      {suggestedCategories.length > 0 && (
        <Stack direction='row' gap={1} flexWrap='wrap'>
          {suggestedCategories.map(cat => (
            <Chip
              key={cat}
              label={slugToLabel(cat)}
              onDelete={() =>
                setSuggestedCategories(prev => prev.filter(c => c !== cat))
              }
              variant='outlined'
              size='small'
            />
          ))}
        </Stack>
      )}

      {/* SHOP NAME (locked and hidden) */}
      <input type='hidden' value={shop?.name ?? ''} readOnly />

      {/* RATING */}
      <input {...register('rating')} type='hidden' readOnly value={rating} />

      <div className='flex flex-col gap-2 items-start'>
        <label>Rating {(isPreview ? previewRating : rating).toFixed(1)}</label>

        <div
          className='relative mx-auto xs:ml-0 text-6xl xs:text-4xl select-none group text-stroke cursor-pointer'
          onMouseEnter={() => setIsPreview(true)}
          onTouchStart={() => setIsPreview(true)}
          onMouseLeave={() => setIsPreview(false)}
          onTouchEnd={() => {
            setIsPreview(false);
            setRating(previewRating);
          }}
          onMouseUp={() => setIsPreview(false)}
          onTouchMove={e => {
            const touch = e.touches[0];
            const element = document.elementFromPoint(
              touch.clientX,
              touch.clientY
            );
            const id = element?.id;
            if (id && id.startsWith('star-handle')) {
              const stars = parseInt(id[id.length - 1]);
              if (previewRating != stars) {
                setPreviewRating(stars);
              }
            }
          }}
        >
          {stars.map((star, i) => (
            <span
              key={i}
              className={
                star
                  ? isPreview
                    ? 'text-amber-200'
                    : 'text-amber-300'
                  : 'text-transparent'
              }
            >
              ★
            </span>
          ))}
          <div className='absolute top-0 w-full flex flex-row'>
            {stars.map((_, i) => (
              <div
                key={i}
                id={`star-handle-${i + 1}`}
                className='h-lh z-10 opacity-0 w-1/5'
                onMouseUp={() => setRating(i + 1)}
                onTouchEnd={() => setRating(i + 1)}
                onMouseOver={() => setPreviewRating(i + 1)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* COMMENTS */}
      <div className='flex flex-col gap-2 items-start'>
        <label htmlFor='comments'>Comments</label>
        <textarea
          className='py-2 px-3 bg-surface-2 border-border-default border rounded-lg max-w-full w-full xs:w-148 min-h-[calc(4lh+1rem+2px)]'
          id='comments'
          {...register('comments')}
        />
      </div>

      {/* MEDIA UPLOAD BUTTON */}
      <button
        className='rounded-full bg-primary-default hover:bg-primary-hover text-text-on-primary py-2 px-4 self-start'
        onClick={() => fileInputRef.current?.click()}
      >
        Upload Media
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          multiple
          hidden
          onChange={e => handleMediaSelect(e.target.files)}
        />
      </button>

      {/* MEDIA PREVIEW STRIP */}
      {mediaArr.length > 0 && (
        <Stack direction='row' spacing={2} sx={{ overflowX: 'auto', py: 1 }}>
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
                alt='preview'
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
              <IconButton
                size='small'
                color='error'
                onClick={() => handleRemoveMedia(idx)}
                sx={{ position: 'absolute', top: 2, right: 2 }}
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      )}

      {/* SUBMIT BUTTON */}
      <Box display='flex' justifyContent='center'>
        <button
          className='rounded-full bg-primary-default hover:bg-primary-hover text-text-on-primary py-2 px-4 self-start font-bold'
          onClick={handleSubmitReview}
          disabled={isSaving}
        >
          Save Review
        </button>
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
          variant='filled'
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
