import React from 'react';

import { cn } from '@utils/ui';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {};

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'text-text-on-primary disabled:text-text-on-disabled',
        'bg-primary-default disabled:bg-primary-disabled hover:bg-primary-hover',
        'border-2 border-border-on-active disabled:border-primary-disabled disabled:hover:border-primary-disabled',
        'hover:cursor-pointer disabled:cursor-not-allowed',
        'rounded-full py-2 px-4 select-none',
        'transition-colors duration-150',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
