import { ReactNode } from 'react';

type HeroProps = {
  children?: ReactNode;
};

export default function Hero({ children }: HeroProps) {
  return (
    <section className='w-full mx-auto py-10'>
      <div className='grid grid-cols-1 md:grid-cols-2 items-center gap-8'>
        <div className='flex justify-center md:justify-start'>
          <img
            src={`${import.meta.env.BASE_URL}favicon-light.svg`}
            alt='Cup Trail'
            className='w-full max-w-sm'
          />
        </div>

        <div>
          <h1 className='font-brand text-center text-4xl tracking-tight text-text-primary'>
            A space to discover and track your favorite drinks.
          </h1>
          <div className='mt-6'>{children}</div>
        </div>
      </div>
    </section>
  );
}
