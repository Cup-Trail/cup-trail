import type { ReviewRow, ShopDrinkRow } from '@cuptrail/core';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import ReviewItem from '../components/ReviewItem';
import DrinkCard from '../components/StorefrontPage/DrinkCard';
import { useAuth } from '../context/AuthContext';
import {
  usePopularDrinksQuery,
  useShopIdQuery,
  useUserReviewsQuery,
} from '../queries';

const STOREFRONT_TAB_VIEWS = {
  PopularDrinks: 'Popular Drinks',
  MyDrinks: 'My Drinks',
} as const;

const TABS = ['Popular Drinks', 'My Drinks'] as const;
type Tab = (typeof TABS)[number];

export default function StorefrontRoute() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('Popular Drinks');

  useEffect(() => {
    if (!shopId) navigate('/');
  }, [shopId, navigate]);

  const { data: drinks } = usePopularDrinksQuery(shopId ?? '');
  const shopQueryResult = useShopIdQuery(shopId ?? '');
  const { data: shop } = shopQueryResult;

  useEffect(() => {
    if (shopQueryResult.isFetched && !shopQueryResult.data) {
      navigate('/');
    }
  }, [shopQueryResult.isFetched, shopQueryResult.data, navigate]);

  const { data: userReviewsForShop = [] } = useUserReviewsQuery({
    userId: authLoading ? null : (user?.id ?? null),
    shopId: shopId ?? null,
  });

  const { data: reviewsForShop = [] } = useUserReviewsQuery({
    shopId: shopId ?? null,
  });

  return (
    <div className='flex flex-col gap-5'>
      <div className='font-semibold text-3xl text-text-primary'>
        {shop?.name}
      </div>
      <div className='text-text-secondary'>{shop?.address}</div>

      <div className='flex justify-end gap-2'>
        <button
          type='button'
          className='flex justify-center rounded-xl border px-4 py-2 bg-primary-default text-text-on-primary border-border-default hover:bg-primary-hover transition-colors duration-150 disabled:bg-primary-hover disabled:text-primary-active hover:cursor-pointer'
          disabled={authLoading || !user}
          title={
            authLoading || !user
              ? 'You need to be signed in to add a review'
              : ''
          }
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
                  photoUrl={item.cover_photo_url ?? ''}
                />
              ))}
            </div>
          )}
          <div className='mx-auto mt-auto w-full'>
            <h2 className='text-lg font-semibold text-text-primary'>Reviews</h2>
            <div className='mt-3 grid gap-3'>
              {reviewsForShop.map((item: ReviewRow) => (
                <div
                  key={String(item.id)}
                  className='rounded-2xl border border-border-default bg-surface-2 p-4'
                >
                  <ReviewItem item={item} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === STOREFRONT_TAB_VIEWS.MyDrinks && (
        <>
          {authLoading ? (
            <p className='text-sm text-text-secondary'>Loading…</p>
          ) : !user ? (
            <h5>Sign in to see your reviews for this shop.</h5>
          ) : userReviewsForShop.length === 0 ? (
            <p>You haven't reviewed any drinks here yet</p>
          ) : (
            <>
              <div className='grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {userReviewsForShop.map((r: ReviewRow) => (
                  <DrinkCard
                    key={String(r.id)}
                    drinkName={r.shop_drinks?.drinks?.name ?? 'Drink'}
                    rating={r.rating}
                    photoUrl={r.media_urls?.[0] ?? ''}
                  />
                ))}
              </div>

              <div className='mx-auto mt-auto w-full'>
                <h2 className='text-lg font-semibold text-text-primary'>
                  My Reviews
                </h2>

                <div className='mt-3 grid gap-3'>
                  {userReviewsForShop.map((item: ReviewRow) => (
                    <div
                      key={String(item.id)}
                      className='rounded-2xl border border-border-default bg-surface-2 p-4'
                    >
                      <ReviewItem item={item} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
