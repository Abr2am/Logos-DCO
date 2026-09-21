'use client';

import { useState } from 'react';

import { cn } from '@/lib/cn';

import { FieldError, FieldHelp, FieldLabel } from './Field';

/*
 * Multi-sélection.
 *
 * « Multi-sélection = chips cliquables, pas de liste déroulante à cases. »
 *
 * Les valeurs retenues sont postées via des champs cachés : le formulaire
 * fonctionne sans que le serveur ait à interpréter un état client.
 */
export function ChipGroup({
  id,
  name,
  label,
  options,
  defaultValues = [],
  required,
  help,
  error,
}: {
  id: string;
  name: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  defaultValues?: ReadonlyArray<string>;
  required?: boolean;
  help?: string;
  error?: string;
}) {
  const [selected, setSelected] = useState<string[]>([...defaultValues]);

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="contents">
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
      </legend>

      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      <div id={id} className="mt-[7px] flex flex-wrap gap-[7px]">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(option.value)}
              className={cn(
                'inline-flex items-center rounded-control px-[13px] py-[9px]',
                'text-small transition-colors duration-[150ms] ease-logos',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy',
                isSelected
                  ? 'bg-burgundy font-medium text-on-dark'
                  : 'border border-line bg-surface text-text hover:border-line-secondary hover:bg-cover-plate',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {help && !error ? <FieldHelp id={`${id}-help`}>{help}</FieldHelp> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </fieldset>
  );
}
