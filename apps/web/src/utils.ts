import { ShopRow } from '@cuptrail/core';

export const extractShopId = (data: ShopRow) => {
  const rawId = data?.id;
  return rawId !== null && String(rawId).trim().length > 0
    ? String(rawId).trim()
    : '';
};

export const renderStars = (rating: number, max = 5) => {
  const r = Math.max(0, Math.min(max, Math.floor(rating)));
  return '★'.repeat(r) + '☆'.repeat(max - r);
};
