import { ShopDrinkRow } from '@cuptrail/core';
import { Box, Typography } from '@mui/material';
import { renderStars } from '../../utils';

const PLACEHOLDER_IMAGE_URL =
  'https://s3-media0.fl.yelpcdn.com/bphoto/t4tE4oVYwdLbfvgm4wtbdA/348s.jpg';

interface ReviewItemProps {
  item: ShopDrinkRow;
}

const ReviewItem = ({ item }: ReviewItemProps) => {
  const drinkName = item?.drinks?.name;
  const title = drinkName ?? 'Drink';
  return (
    <Box
      key={item.id}
      p={2}
      bgcolor="#FFF6EB"
      display="flex"
      flexDirection="column"
      gap={2}
      width={{ xs: '100%', sm: '50%' }}
    >
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={600}>{title}</Typography>
        <Box color="warning.main" fontSize="20px">
          {renderStars(item.avg_rating)}
        </Box>
      </Box>
      <img
        src={PLACEHOLDER_IMAGE_URL}
        alt={title}
        width={300}
        height={200}
        style={{ objectFit: 'cover' }}
      />
    </Box>
  );
};

export default ReviewItem;
