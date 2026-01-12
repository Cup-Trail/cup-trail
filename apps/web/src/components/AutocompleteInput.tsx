import { useEffect, useRef, useState } from 'react';

type AutocompleteInputProps<T> = {
  placeholder?: string;

  value: string;
  onFocus?: () => void;

  onChange: (next: string) => void;

  items: T[];
  getKey: (item: T) => string;
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  error?: string | null;
  disabled?: boolean;
  openWhenEmpty?: boolean;
};

export default function AutocompleteInput<T>({
  placeholder,
  value,
  onFocus,
  onChange,
  items,
  getKey,
  onSelect,
  renderItem,
  leftIcon,
  rightIcon,
  error,
  disabled,
  openWhenEmpty = false,
}: AutocompleteInputProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const showMenu = open && (openWhenEmpty || items.length > 0);

  // close on outside click
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const selectItem = (item: T) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className='w-full'>
      <div
        className={[
          'mt-2 relative rounded-2xl border px-4 py-3',
          'flex items-center gap-3',
          'bg-surface-2',
          error ? 'border-red-400' : 'border-transparent',
          disabled ? 'opacity-60 pointer-events-none' : '',
        ].join(' ')}
      >
        {leftIcon && <div className='shrink-0'>{leftIcon}</div>}

        <input
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={e => {
            const next = e.target.value;
            onChange(next);
            if (!next.trim()) {
              setOpen(false);
              return;
            }

            setOpen(true);
          }}
          onFocus={() => {
            // only open on focus if there's something to show
            if (value.trim()) setOpen(true);
            onFocus?.();
          }}
          className={
            'leading-0 w-full bg-transparent outline-none text-sm text-text-primary placeholder:text-text-secondary'
          }
        />

        {value && (
          <button
            type='button'
            aria-label='Clear'
            onMouseDown={e => e.preventDefault()} // prevent blur -> prevents flicker
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className='shrink-0 rounded-full px-2 py-1 text-xs text-text-secondary hover:text-text-primary'
          >
            ✕
          </button>
        )}

        {rightIcon && <div className='shrink-0'>{rightIcon}</div>}

        {showMenu && (
          <div
            className={[
              'absolute left-0 right-0 top-[calc(100%+8px)] z-50',
              'rounded-2xl border border-border-default',
              'bg-surface-2 overflow-hidden',
            ].join(' ')}
          >
            <ul className='max-h-72 overflow-auto py-1'>
              {items.length === 0 ? (
                <li className='px-4 py-3 text-sm text-[var(--text-secondary)]'>
                  No results
                </li>
              ) : (
                items.map(item => (
                  <li key={getKey(item)}>
                    <button
                      type='button'
                      onMouseDown={e => {
                        e.preventDefault();
                        selectItem(item);
                      }}
                      className='w-full text-left px-4 py-3 hover:bg-black/5 transition-colors duration-150'
                    >
                      {renderItem(item)}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {error && <p className='mt-2 text-xs text-red-500'>{error}</p>}
    </div>
  );
}
