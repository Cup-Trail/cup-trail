import type { LocationState, ReviewRow } from '@cuptrail/core';
import { useNavigate } from 'react-router-dom';

import { renderStars } from '../../utils';

interface ReviewItemProps {
  item: ReviewRow;
}

const ReviewItem = ({ item }: ReviewItemProps) => {
  const navigate = useNavigate();

  const shop = item.shop_drinks.shops;
  const drink = item.shop_drinks.drinks;

  const title = drink ? `${drink.name} @ ${shop?.name}` : 'Review';
  const reviewDate = new Date(item.created_at).toLocaleDateString();

  const navigateToShop = () => {
    if (!shop) return;

    navigate(`/shop/${shop.id}`, {
      state: {
        shopName: shop.name,
        address: shop.address,
        shopId: shop.id,
      } as LocationState,
    });
  };

  return (
    <div className='flex flex-col gap-2'>
      {/* Title */}
      <button
        onClick={navigateToShop}
        className='text-left font-semibold text-text-primary hover:underline'
      >
        {title}
      </button>

      {/* Rating */}
      <div className='text-lg text-yellow-500'>{renderStars(item.rating)}</div>

      {/* Comment */}
      {item.comment && (
        <p className='text-sm text-text-secondary'>{item.comment}</p>
      )}

      <span className='text-xs text-text-secondary'>{reviewDate}</span>
    </div>
  );
};

export default ReviewItem;
