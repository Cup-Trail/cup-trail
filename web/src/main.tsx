import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './pages/App';
import SearchPage from './pages/SearchPage';
import StorefrontPage from './pages/StorefrontPage';
import InsertReviewPage from './pages/InsertReviewPage';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <SearchPage /> },
        { path: 'shop/:shopId', element: <StorefrontPage /> },
        { path: 'shop/:shopId/review', element: <InsertReviewPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);


