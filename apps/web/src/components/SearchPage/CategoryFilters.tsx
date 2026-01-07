import type { CategoryRow } from '@cuptrail/core';
import { useMemo } from 'react';

import { useCategoriesQuery } from '../../queries';

type Props = {
  selectedCategoryId: string | null;
  onSelectCategory: (cat: CategoryRow) => void;
  className?: string;
};

const CategoryFilters = ({
  selectedCategoryId,
  onSelectCategory,
  className,
}: Props) => {
  const { data: cats } = useCategoriesQuery();

  const list = useMemo(() => cats ?? [], [cats]);

  if (list.length === 0) return null;
  return (
    <div className={className}>
      <div className='flex justify-center'>
        <div className='flex gap-2 overflow-x-auto pb-2 px-1 [-webkit-overflow-scrolling:touch]'>
          {list.map(c => {
            const active = c.id === selectedCategoryId;

            return (
              <button
                key={c.id}
                type='button'
                onClick={() => onSelectCategory(c)}
                className={[
                  'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-[var(--primary-active)] text-[var(--text-on-primary)] border-[var(--border-on-active)] hover:bg-[var(--primary-hover)] transition-colors duration-150'
                    : 'bg-[var(--primary-default)] text-[var(--text-on-primary)] border-[var(--border-default)] hover:bg-[var(--primary-hover)] transition-colors duration-150',
                ].join(' ')}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilters;
