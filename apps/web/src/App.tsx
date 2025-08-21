import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import {
  AppNavigation,
  InsertReviewPage,
  SearchPage,
  StorefrontPage,
} from './components';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppNavigation />,
      children: [
        { index: true, element: <SearchPage /> },
        { path: 'shop/:shopId', element: <StorefrontPage /> },
        { path: 'shop/:shopId/review', element: <InsertReviewPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
