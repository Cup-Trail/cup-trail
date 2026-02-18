import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import Nav from './components/Nav';
import { AuthProvider } from './context/AuthContext';
import stylesheet from './style.css?url';

const queryClient = new QueryClient();

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link
          href='https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap'
          rel='stylesheet'
        />
        <link rel='icon' type='image/svg+xml' href='/favicon-light.svg' media='(prefers-color-scheme: light)' />
        <link rel='icon' type='image/svg+xml' href='/favicon-dark.svg' media='(prefers-color-scheme: dark)' />
        <link rel='stylesheet' href={stylesheet} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function AppRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className='min-h-screen'>
          <Nav />
          <main className='w-full max-w-7xl mx-auto pt-2 px-8 pb-8'>
            <Outlet />
          </main>
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
