import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import { Field, controlClassName, describedBy } from './Field';

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  id: string;
  label: string;
  help?: string;
  error?: string;
};

export function Select({
  id,
  label,
  help,
  error,
  required,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <Field id={id} label={label} required={required} help={help} error={error}>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { help, error })}
        className={cn(
          controlClassName(Boolean(error), className),
          'appearance-none bg-[right_16px_center] bg-no-repeat pr-[44px]',
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0h10L5 6z' fill='%23241810'/></svg>\")",
        }}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}
