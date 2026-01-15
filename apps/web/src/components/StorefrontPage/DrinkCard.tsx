import { ShopDrinkRow } from '@cuptrail/core';
import { renderStars } from '../../utils';

interface DrinkCardProps {
  item: ShopDrinkRow;
}

const DrinkCard = ({ item }: DrinkCardProps) => {
  const drinkName = item?.drinks?.name;
  return (
    <div className='rounded-2xl border border-border-default p-4 bg-surface-2 flex flex-col'>
      <div className='flex flex-col items-center text-center gap-2'>
        <div className='font-semibold text-text-primary'>{drinkName}</div>
        <div className='text-text-secondary'>
          {renderStars(item.avg_rating)}
        </div>
        {item.cover_photo_url ? (
          <img
            src={item.cover_photo_url}
            alt={drinkName}
            className='mt-2 w-48 h-48 rounded-xl object-cover'
          />
        ) : (
          <div className='mt-2 w-48 h-48 rounded-xl bg-surface-1/30' />
        )}
      </div>
    </div>
  );
};

export default DrinkCard;
