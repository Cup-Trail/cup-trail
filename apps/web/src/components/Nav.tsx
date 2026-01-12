import { Link } from 'react-router-dom';

type HeaderProps = {
  signedIn: boolean;
  displayName?: string | null;
};

function getInitials(name?: string | null) {
  const n = (name ?? 'User').trim();
  return n
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Nav({ signedIn, displayName }: HeaderProps) {
  const initials = getInitials(displayName);

  return (
    <nav className='w-full pt-4 h-24 flex flex-col items-center'>
      <div className='fixed z-40 w-[min(1488px,calc(100%-24px))] md:w-[min(1488px,calc(100%-48px))] -translate-y-2.5 md:-translate-y-5 mx-3 md:mx-6 h-13 bg-surface-1'></div>
      <div className='z-50 fixed w-[min(1488px,calc(100%-24px))] md:w-[min(1488px,calc(100%-48px))] mx-3 md:mx-6 h-16 rounded-full bg-primary-default px-4 flex items-center justify-between'>
        {/* center */}
        <Link
          to='/'
          className='absolute left-5 md:left-1/2 md:-translate-x-1/2 text-surface-1 font-semibold tracking-wide text-lg no-underline'
        >
          <img
            src={`${import.meta.env.BASE_URL}logos/light.png`}
            className='h-6 w-auto'
          />
        </Link>
        <div className='flex items-center gap-6'>
          {/* <Link
              to='/'
              className='text-[var(--text-on-primary)] text-sm font-medium hover:opacity-90 no-underline'
            >
              About us
            </Link> */}
        </div>

        {/* right */}
        <div className='flex items-center gap-2'>
          {signedIn ? (
            <Link
              to='/profile'
              className='h-9 w-9 rounded-full grid place-items-center font-semibold text-text-on-primary bg-white/10 hover:bg-white/15 no-underline'
            >
              {initials}
            </Link>
          ) : (
            <>
              <Link
                to='/auth'
                className='rounded-full px-4 py-1.5 text-sm bg-primary-default text-text-on-primary border border-border-on-active hover:bg-primary-hover no-underline transition-colors duration-150'
              >
                Log in
              </Link>
              <Link
                to='/'
                className='rounded-full px-4 py-1.5 text-sm bg-primary-active text-text-on-primary border border-border-default hover:bg-primary-hover no-underline transition-colors duration-150'
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
