import { useRef, useState, type Dispatch, type SetStateAction } from 'react';

interface Props {
  rating: number;
  setRating: Dispatch<SetStateAction<number>>;
}

const MAX_RATING = 5;
const RATING_INCREMENTS = 0.5;

export function InputRating({ rating, setRating }: Props) {
  const [previewRating, setPreviewRating] = useState<number>(0);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const ratingRef = useRef<HTMLDivElement>(null);

  const focusRating = () => {
    ratingRef.current?.focus();
  };

  const incrementRating = () => {
    setRating(rating => Math.min(rating + RATING_INCREMENTS, MAX_RATING));
  };
  const decrementRating = () => {
    setRating(rating => Math.max(rating - RATING_INCREMENTS, 0));
  }

  return (
    <div className='flex flex-col gap-2 items-start'>
      <label
        id='rating-label'
        onClick={focusRating}
        >Rating {(isPreview ? previewRating : rating).toFixed(1)}</label>
      <div
        id='rating'
        ref={ratingRef}
        className='text-4xl relative w-fit justify-start group select-none text-stroke touch-none'
        tabIndex={0}
        aria-labelledby='rating-label'
        aria-label={`Rating: ${rating} out of ${MAX_RATING}. Use arrow keys to adjust. Or type a whole number between 0 and ${MAX_RATING}.`}
        aria-required='true'
        onMouseEnter={() => setIsPreview(true)}
        onTouchStart={() => setIsPreview(true)}
        onMouseLeave={() => setIsPreview(false)}
        onTouchEnd={() => {
          setIsPreview(false);
          setRating(previewRating);
        }}
        onMouseUp={() => setIsPreview(false)}
        onTouchMove={e => {
          e.preventDefault();
          const touch = e.touches[0];
          const element = document.elementFromPoint(
            touch.clientX,
            touch.clientY
          );
          const id = element?.id;
          if (id && id.startsWith('star-handle')) {
            const newRating = parseFloat(
              (element as HTMLDivElement).dataset.rating ?? '2'
            );
            setPreviewRating(newRating);
          }
        }}
        onKeyDown={(e) => {
        switch (e.code) {
          case 'ArrowUp':
          case 'ArrowRight':
            e.preventDefault();
            incrementRating();
            break;
          case 'ArrowDown':
          case 'ArrowLeft':
            e.preventDefault();
            decrementRating();
            break;
        }
        const value = parseInt(e.key);
        if (!isNaN(value)) {
          e.preventDefault();
          setRating(Math.min(value, MAX_RATING));
        }
      }}
      >
        <div className='text-transparent pointer-events-none'>★★★★★</div>
        <div
          className={`${isPreview ? 'text-amber-200' : 'text-amber-300'} absolute top-0 left-0 overflow-clip pointer-events-none transition-all duration-150`}
          style={{
            width: `${((isPreview ? previewRating : rating) / 5) * 100}%`,
          }}
        >
          ★★★★★
        </div>
        <div
          className={`absolute top-0 w-full flex flex-row ${isPreview && 'cursor-pointer'}`}
        >
          <div
            className={`absolute h-lh z-10 w-4 -left-4 ${!isPreview && 'opacity-0'} flex flex-row items-center`}
            data-rating='0'
            id='star-handle-0'
            onMouseUp={() => setRating(0)}
            onMouseOver={() => setPreviewRating(0)}
          >
            <p className='text-black font-serif text-lg text-center mx-auto'></p>
          </div>
          {Array.from({
            length: Math.floor(MAX_RATING / RATING_INCREMENTS),
          }).map((_, i, arr) => {
            const stars = (MAX_RATING * (i + 1)) / arr.length;
            return (
              <div
                key={i}
                id={`star-handle-${i + 1}`}
                data-rating={stars}
                className='h-lh z-10'
                style={{ width: `${100 / arr.length}%` }}
                onMouseUp={() => setRating(stars)}
                onMouseOver={() => setPreviewRating(stars)}
              />
            );
          })}
        </div>
        <div className='relative mx-auto xs:ml-0 text-5xl xs:text-4xl select-none group text-stroke cursor-pointer'></div>
      </div>
    </div>
  );
}
