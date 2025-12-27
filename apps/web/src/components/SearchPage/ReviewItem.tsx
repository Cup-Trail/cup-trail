import type { LocationState, ReviewRow } from '@cuptrail/core';
import { Box, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { renderStars } from '../../utils';

interface ReviewItemProps {
  item: ReviewRow;
}

const ReviewItem = ({ item }: ReviewItemProps) => {
  const navigate = useNavigate();
  const shopName = item.shop_drinks.shops?.name;
  const drinkName = item.shop_drinks.drinks?.name;
  const title = drinkName ? `${drinkName} @ ${shopName}` : "Review";
  const reviewDate = new Date(item.created_at).toLocaleDateString();
  const navigateToShop = () => navigate(`/shop/${item.shop_drinks.shops.id}`, {
    state: {
      shopName,
      address: item.shop_drinks.shops.address,
      shopId: item.shop_drinks.shops.id,
    } as LocationState,
  })
  return (
    <Box
      key={item.id}
      p={2}
      bgcolor="#FFF6EB"
      display="flex"
      flexDirection="column"
      gap={2}
    >
      <Typography fontWeight={600}><Link color="textPrimary" underline="hover" onClick={navigateToShop} >{title}</Link></Typography>
      
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
