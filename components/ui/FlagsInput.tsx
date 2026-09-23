'use client';

import { useState } from 'react';

import { cn } from '@/lib/cn';

import { FieldError, FieldLabel } from './Field';
import { FlagRemovable } from './Flag';

/*
 * Saisie des flags.
 *
 * Texte LIBRE : aucune liste prédéfinie, aucune suggestion, aucune validation
 * préalable. Cinq au minimum — le compteur est un repère, la règle est
 * appliquée par le serveur et par la base.
 */
const MIN_FLAGS = 5;

export function FlagsInput({
  id,
  name,
  label,
  defaultValues = [],
  error,
}: {
  id: string;
  name: string;
  label: string;
  defaultValues?: ReadonlyArray<string>;
  error?: string;
}) {
  const [flags, setFlags] = useState<string[]>([...defaultValues]);
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (!value || flags.includes(value)) {
      setDraft('');
      return;
    }
    setFlags((current) => [...current, value]);
    setDraft('');
  }

  const remaining = Math.max(0, MIN_FLAGS - flags.length);

  return (
    <div>
      <FieldLabel htmlFor={id} required>
        {label}
      </FieldLabel>

      {flags.map((flag) => (
        <input key={flag} type="hidden" name={name} value={flag} />
      ))}

      {flags.length > 0 ? (
        <div className="mt-[7px] flex flex-wrap gap-[7px]">
          {flags.map((flag) => (
            <FlagRemovable
              key={flag}
              label={flag}
              onRemove={() =>
                setFlags((current) => current.filter((item) => item !== flag))
              }
            />
          ))}
        </div>
      ) : null}

      <div className="mt-12 flex gap-[9px]">
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add();
            }
          }}
          placeholder="Ajouter un mot-clé et valider…"
          aria-describedby={`${id}-count`}
          aria-invalid={error ? true : undefined}
          className={cn(
            'min-h-[48px] flex-1 rounded-control bg-surface px-16 py-[14px]',
            'text-[14.5px] text-text placeholder:text-placeholder',
            'border transition-colors duration-[150ms] ease-logos',
            error ? 'border-[1.5px] border-walnut-900' : 'border-line-field',
            'focus-visible:border-walnut-900 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[rgb(46_30_21/0.28)]',
          )}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-control border border-line-secondary px-16 text-[13.5px] font-medium transition-colors duration-[150ms] ease-logos hover:border-line-secondary-hover hover:text-walnut-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900"
        >
          Ajouter
        </button>
      </div>

      <p id={`${id}-count`} className="mt-[6px] text-[11.5px] text-help">
        {remaining > 0
          ? `${flags.length} flag${flags.length > 1 ? 's' : ''} sur ${MIN_FLAGS} requis`
          : `${flags.length} flags`}
      </p>

      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}
