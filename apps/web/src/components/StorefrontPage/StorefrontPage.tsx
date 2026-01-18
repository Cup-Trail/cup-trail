import type { ReviewRow, ShopDrinkRow } from '@cuptrail/core';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  usePopularDrinksQuery,
  useShopIdQuery,
  useUserReviewsQuery,
} from '../../queries';
import ReviewItem from '../ReviewItem';

import DrinkCard from './DrinkCard';

const STOREFRONT_TAB_VIEWS = {
  PopularDrinks: 'Popular Drinks',
  MyDrinks: 'My Drinks',
} as const;

const TABS = ['Popular Drinks', 'My Drinks'] as const;
type Tab = (typeof TABS)[number];

const StorefrontPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('Popular Drinks');
  useEffect(() => {
    if (!shopId) navigate('/');
  }, [shopId, navigate]);

  const { data: drinks } = usePopularDrinksQuery({ shopId: shopId ?? '' });
  const { data: userReviews } = useUserReviewsQuery({ shopId });

  const shopQueryResult = useShopIdQuery(shopId ?? null);
  const { data: shop } = shopQueryResult;

  useEffect(() => {
    if (shopQueryResult.isFetched && !shopQueryResult.data) {
      navigate('/');
    }
  }, [shopQueryResult, navigate]);

  return (
    <div className='flex flex-col gap-5'>
      <div className='font-semibold text-3xl text-text-primary'>
        {shop && shop.name}
      </div>
      <div className='text-text-secondary'>{shop && shop.address}</div>
      <div className='flex justify-end gap-2'>
        <button
          className='flex justify-center rounded-xl border px-4 py-2 bg-primary-default text-text-on-primary border-border-default hover:bg-primary-hover transition-colors duration-150'
          onClick={() => navigate(`/shop/${shopId}/review`)}
        >
          <AddIcon /> Add a Review
        </button>
      </div>

      <div className='flex justify-center gap-2 border-b border-border-default'>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 text-sm font-medium rounded-t-lg',
              activeTab === tab
                ? 'bg-primary-default text-text-on-primary border hover:bg-primary-hover border-b-transparent'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === STOREFRONT_TAB_VIEWS.PopularDrinks && (
        <>
          {drinks && drinks.length === 0 && <p>No popular drinks yet...</p>}
          {drinks && drinks.length > 0 && (
            <div className='grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
              {drinks.map((item: ShopDrinkRow) => (
                <DrinkCard
                  key={String(item.id)}
                  drinkName={item.drinks?.name}
                  rating={item.avg_rating}
                  photoUrl={item.cover_photo_url ? item.cover_photo_url : ''}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === STOREFRONT_TAB_VIEWS.MyDrinks && (
        <>
          {!userReviews ||
            (userReviews.length === 0 && (
              <p>You haven't reviewed any drinks here yet</p>
            ))}

          {userReviews && userReviews.length > 0 && (
            <div className='grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
              {userReviews.map((r: ReviewRow) => (
                <DrinkCard
                  key={String(r.id)}
                  drinkName={r.shop_drinks?.drinks?.name ?? 'Drink'}
                  rating={r.rating}
                  photoUrl={r.media_urls?.[0] ?? null}
                />
              ))}
            </div>
          )}

          {userReviews && (
            <div className='mx-auto mt-8 w-full'>
              <h2 className='text-lg font-semibold text-text-primary'>
                My Reviews
              </h2>

              {userReviews.length === 0 ? (
                <p className='mt-2 text-sm text-text-secondary'>
                  No reviews yet
                </p>
              ) : (
                <div className='mt-3 grid gap-3'>
                  {userReviews.map((item: ReviewRow) => (
                    <div
                      key={String(item.id)}
                      className='rounded-2xl border border-border-default bg-surface-2 p-4'
                    >
                      <ReviewItem item={item} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StorefrontPage;
