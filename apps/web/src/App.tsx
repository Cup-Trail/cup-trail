import '@cuptrail/ui/styles/style.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import {
  AppNavigation,
  AuthPage,
  InsertReviewPage,
  ProfilePage,
  SearchPage,
  StorefrontPage,
} from './components';

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppNavigation />,
      children: [
        { index: true, element: <SearchPage /> },
        { path: 'auth', element: <AuthPage /> },
        { path: 'profile', element: <ProfilePage /> },
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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
