import type { InputHTMLAttributes } from 'react';

import { Field, controlClassName, describedBy } from './Field';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: string;
  help?: string;
  error?: string;
};

export function Input({
  id,
  label,
  help,
  error,
  required,
  className,
  ...props
}: InputProps) {
  return (
    <Field id={id} label={label} required={required} help={help} error={error}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { help, error })}
        className={controlClassName(Boolean(error), className)}
        {...props}
      />
    </Field>
  );
}
