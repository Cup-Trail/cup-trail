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
import { uploadReviewMedia } from '@cuptrail/utils/storage';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { Alert, IconButton, Paper, Snackbar } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import { useCategoriesQuery, useShopIdQuery } from '../queries';
import type { SnackState } from '../types';
import { zip } from '../utils/ui';
import StarRating from '../components/StarRating';

export default function InsertReviewRoute() {
  const { data: cats } = useCategoriesQuery();
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cats || !cats.length) setAllCategories([]);
    else {
      setAllCategories(cats.map(c => slugToLabel(c.slug)) ?? []);
      setSelectedCategories(cats.map(() => false));
    }
  }, [cats]);

  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const shopQueryResult = useShopIdQuery(shopId ?? '');
  const { data: shop } = shopQueryResult;

  const [rating, setRating] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<boolean[]>([]);

  const [mediaArr, setMediaArr] = useState<File[]>([]);

  const handleRemoveMedia = (index: number) => {
    setMediaArr(prev => prev.filter((_, i) => i !== index));
  };

  const handleMediaSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setMediaArr(prev => [...prev, ...newFiles]);
  };

  async function handleSubmitReview() {
    const { drinkName, comments } = getValues();
    setIsSaving(true);

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

    if (shopDrinkId) {
      await calculateAndUpdateAvgRating(shopDrinkId);
    }

    if (shopDrinkId && selectedCategories.filter(c => c).length > 0) {
      const categories = zip(allCategories, selectedCategories)
        .filter(([_, b]) => b)
        .map(([c, _]) => c);
      await setShopDrinkCategories(shopDrinkId, categories);
    }

    setSnack({
      open: true,
      message: 'Review added successfully!',
      severity: 'success',
    });
    navigate(`/shop/${shopId}`);
    setIsSaving(false);
    reset();
    setSelectedCategories(cats?.map(() => false) ?? []);
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

      <StarRating rating={rating} setRating={setRating} />

      <div className='flex flex-col gap-2 items-start'>
        <label htmlFor='drinkName'>Drink Name (required)</label>
        <input
          type='text'
          className='py-2 px-3 bg-surface-2 border-border-default border rounded-lg w-full xs:w-72'
          id='drinkName'
          {...register('drinkName')}
        />
      </div>

      {allCategories.length > 0 && (
        <div className='flex flex-row gap-2'>
          {allCategories.map((cat, i) => (
            <button
              type='button'
              key={cat}
              id={cat}
              className={`${selectedCategories[i] ? 'bg-primary-active border-border-on-active' : 'bg-primary-default border-border-defaul'} border text-text-on-primary hover:bg-primary-hover rounded-full px-3 py-0.5 hover:cursor-pointer transition-colors duration-150`}
              onClick={() =>
                setSelectedCategories(prev => [
                  ...prev.slice(0, i),
                  !prev[i],
                  ...prev.slice(i + 1),
                ])
              }
            >
              {slugToLabel(cat)}
            </button>
          ))}
        </div>
      )}

      <input type='hidden' value={shop?.name ?? ''} readOnly />
      <input {...register('rating')} type='hidden' readOnly value={rating} />

      <div className='flex flex-col gap-2 items-start'>
        <label htmlFor='comments'>Comments</label>
        <textarea
          className='py-2 px-3 bg-surface-2 border-border-default border rounded-lg max-w-full w-full xs:w-148 min-h-[calc(4lh+1rem+2px)]'
          id='comments'
          {...register('comments')}
        />
      </div>

      <button
        className='rounded-full bg-primary-default hover:bg-primary-hover text-text-on-primary py-2 px-4 self-start select-none hover:cursor-pointer transition-colors duration-150'
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

      {mediaArr.length > 0 && (
        <div className='flex flex-row gap-2 py-1 overflow-x-auto'>
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
                <RemoveCircleIcon />
              </IconButton>
            </Paper>
          ))}
        </div>
      )}

      <div className='flex flex-row justify-center'>
        <button
          type='button'
          className='rounded-full bg-primary-default hover:bg-primary-hover hover:cursor-pointer text-text-on-primary py-2 px-4 self-start select-none transition-colors duration-150'
          onClick={handleSubmitReview}
          disabled={isSaving}
        >
          Save Review
        </button>
      </div>

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
