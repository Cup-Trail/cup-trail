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

export default function Header({ signedIn, displayName }: HeaderProps) {
  const initials = getInitials(displayName);

  return (
    <header className='w-full py-4'>
      <div className='mx-auto w-[min(1488px,calc(100%-48px))]'>
        <div className='relative h-16 rounded-full bg-[var(--primary-default)] px-8 flex items-center justify-between'>
          {/* left */}
          <nav className='flex items-center gap-6'>
            {/* <Link
              to='/'
              className='text-[var(--text-on-primary)] text-sm font-medium hover:opacity-90 no-underline'
            >
              About us
            </Link> */}
          </nav>

          {/* center */}
          <Link
            to='/'
            className='absolute left-1/2 -translate-x-1/2 text-[var(--surface-1)] font-semibold tracking-wide text-lg no-underline'
          >
            <img
              src={`${import.meta.env.BASE_URL}logos/light.png`}
              className='h-6 w-auto'
            />
          </Link>

          {/* right */}
          <div className='flex items-center gap-2'>
            {signedIn ? (
              <Link
                to='/profile'
                className='h-9 w-9 rounded-full grid place-items-center font-semibold text-[var(--text-on-primary)] bg-white/10 hover:bg-white/15 no-underline'
              >
                {initials}
              </Link>
            ) : (
              <>
                <Link
                  to='/auth'
                  className='rounded-full px-4 py-1.5 text-sm bg-[var(--primary-default)] text-[var(--text-on-primary)] border border-[var(--border-on-active)] hover:bg-[var(--primary-hover)] no-underline transition-colors duration-150'
                >
                  Log in
                </Link>
                <Link
                  to='/'
                  className='rounded-full px-4 py-1.5 text-sm bg-[var(--primary-active)] text-[var(--text-on-primary)] border border-[var(--border-default)] hover:bg-[var(--primary-hover)] no-underline transition-colors duration-150'
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
