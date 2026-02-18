import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import {
  AppNavigation,
  AuthPage,
  InsertReviewPage,
  ProfilePage,
  SearchPage,
  StorefrontPage,
} from './components';
import { AuthProvider } from './context/AuthContext';

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
  {
    basename: import.meta.env.BASE_URL,
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
