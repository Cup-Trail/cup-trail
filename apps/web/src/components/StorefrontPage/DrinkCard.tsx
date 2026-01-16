import { renderStars } from '../../utils';

interface DrinkCardProps {
  drinkName: string;
  rating?: number | null;
  photoUrl?: string | null;
}

export default function DrinkCard({
  drinkName,
  rating,
  photoUrl,
}: DrinkCardProps) {
  return (
    <div className='rounded-2xl border border-border-default p-4 bg-surface-2 flex flex-col'>
      <div className='flex flex-col items-center text-center gap-2'>
        <div className='font-semibold text-text-primary'>{drinkName}</div>

        <div className='text-text-secondary'>{renderStars(rating ?? 0)}</div>

        {photoUrl ? (
          <img
            src={photoUrl}
            alt={drinkName}
            className='mt-2 w-48 h-48 rounded-xl object-cover'
          />
        ) : (
          <div className='mt-2 w-48 h-48 rounded-xl bg-surface-1/30' />
        )}
      </div>
    </div>
  );
}
