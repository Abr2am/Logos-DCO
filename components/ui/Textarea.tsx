import type { TextareaHTMLAttributes } from 'react';

import { Field, controlClassName, describedBy } from './Field';

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  id: string;
  label: string;
  help?: string;
  error?: string;
};

export function Textarea({
  id,
  label,
  help,
  error,
  required,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <Field id={id} label={label} required={required} help={help} error={error}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { help, error })}
        className={controlClassName(Boolean(error), className)}
        {...props}
      />
    </Field>
  );
}
