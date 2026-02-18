import { Outlet } from 'react-router';

import Nav from './Nav';

export default function AppNavigation() {
  return (
    <div className='min-h-screen'>
      <Nav />
      <main className='w-full max-w-7xl mx-auto pt-2 px-8 pb-8'>
        <Outlet />
      </main>
    </div>
  );
}
