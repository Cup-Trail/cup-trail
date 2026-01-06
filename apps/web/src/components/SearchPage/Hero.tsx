export default function Hero() {
  return (
    <section className='max-w-[1488px] mx-auto px-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 items-center gap-12'>
        <div className='flex justify-center md:justify-start'>
          <img
            src='/favicon-light.svg'
            alt='Cup Trail illustration'
            className='w-full max-w-md rounded-3xl'
          />
        </div>
        <div>
          <h1 className='font-brand font-medium text-4xl tracking-tight text-[var(--text-primary)]'>
            A space to discover and track your favorite drinks.
          </h1>
        </div>
      </div>
    </section>
  );
}
