'use client';

import { useRef, useState } from 'react';

import { cn } from '@/lib/cn';

import { FieldError, FieldHelp, FieldLabel } from './Field';

/*
 * Champ de fichier.
 *
 * L'attribut `accept` et l'affichage du nom sont du CONFORT : la validation du
 * type, de l'extension, de la signature et de la taille se fait entièrement
 * côté serveur. Rien de ce qui est affiché ici n'a valeur de contrôle.
 */
export function FileUpload({
  id,
  name,
  label,
  accept,
  required,
  help,
  error,
  currentFilename,
}: {
  id: string;
  name: string;
  label: string;
  accept: string;
  required?: boolean;
  help?: string;
  error?: string;
  /** Fichier déjà déposé, lors d'une correction. */
  currentFilename?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<{
    name: string;
    size: number;
  } | null>(null);

  const shown = selected?.name ?? currentFilename ?? null;

  return (
    <div>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>

      <div
        className={cn(
          'mt-[7px] rounded-control border bg-surface px-16 py-[14px]',
          error ? 'border-[1.5px] border-burgundy' : 'border-line-field',
        )}
      >
        {/* Le bouton natif d'un champ de fichier porte un libellé imposé par
            le navigateur, en anglais. Le champ est donc masqué visuellement —
            sans cesser d'être focalisable ni labellisé — et c'est un bouton du
            système qui l'actionne. */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept={accept}
          required={required && !currentFilename}
          aria-invalid={error ? true : undefined}
          aria-describedby={help && !error ? `${id}-help` : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0];
            setSelected(file ? { name: file.name, size: file.size } : null);
          }}
          className="sr-only"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-control border border-line-secondary px-16 py-[11px] text-[13.5px] font-medium transition-colors duration-[150ms] ease-logos hover:border-line-secondary-hover hover:text-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
        >
          {shown ? 'Remplacer le fichier' : 'Déposer un fichier ou parcourir'}
        </button>

        {shown ? (
          <p className="mt-12 flex flex-wrap items-baseline gap-[10px] border-t border-line-hairline pt-12 text-[13px]">
            <span className="font-medium">{shown}</span>
            {selected ? (
              <span className="text-small text-help">
                {formatSize(selected.size)}
              </span>
            ) : (
              <span className="text-small text-help">Fichier actuel</span>
            )}
          </p>
        ) : null}
      </div>

      {help && !error ? <FieldHelp id={`${id}-help`}>{help}</FieldHelp> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

function formatSize(bytes: number): string {
  const mo = bytes / (1024 * 1024);
  if (mo >= 1) return `${mo.toFixed(1).replace('.', ',')} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}
