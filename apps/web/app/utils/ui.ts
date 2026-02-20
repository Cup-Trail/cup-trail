export const renderStars = (rating: number, max = 5) => {
  const r = Math.max(0, Math.min(max, Math.floor(rating)));
  return '★'.repeat(r) + '☆'.repeat(max - r);
};
