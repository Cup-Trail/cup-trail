import { ReviewRow } from '@cuptrail/core';
import { Box, Typography } from '@mui/material';

interface ReviewItemProps {
  item: ReviewRow;
}

const renderStars = (rating: number, max = 5) => {
  const r = Math.max(0, Math.min(max, Math.floor(rating)));
  return '★'.repeat(r) + '☆'.repeat(max - r);
};

const ReviewItem = ({ item }: ReviewItemProps) => {
  const shopName = item.shop_drinks?.shops?.name;
  const drinkName = item.shop_drinks?.drinks?.name;
  const title = drinkName ? `${drinkName} @ ${shopName}` : 'Review';
  const reviewDate = new Date(item.created_at).toLocaleDateString();
  return (
    <Box
      key={item.id}
      p={2}
      bgcolor="#FFF6EB"
      display="flex"
      flexDirection="column"
      columnGap={2}
    >
      <Typography fontWeight={600}>{title}</Typography>
      <Box color="warning.main" fontSize="20px">
        {renderStars(item.rating)}
      </Box>

      {item.comment && (
        <Typography fontStyle="italic" color="text.secondary">
          {item.comment}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {reviewDate}
      </Typography>
    </Box>
  );
};

export default ReviewItem;
