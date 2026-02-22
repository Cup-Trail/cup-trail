import React from 'react';

import { cn } from '@utils/ui';

type InputTextProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  label?: string;
  containerClassName?: string;
  labelClassName?: string;
  name: string;
};

export function InputText({
  label,
  containerClassName,
  labelClassName,
  className,
  ...props
}: InputTextProps) {
  return (
    <div className={cn('flex flex-col gap-2 items-start', containerClassName)}>
      {!!label && (
        <label htmlFor={props.name} className={labelClassName}>
          {label}
        </label>
      )}
      <input
        type='text'
        className={cn(
          'py-2 px-3 bg-surface-2 border-border-default border rounded-lg',
          className
        )}
        id={props.name}
        {...props}
      />
    </div>
  );
}
