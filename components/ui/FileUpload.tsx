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
 *
 * La barre de progression est l'exception utile : le fichier partant
 * directement vers Storage, un envoi de plusieurs dizaines de méga-octets
 * demande un retour visible. C'est un filet noyer qui se remplit, sans
 * animation ni couleur d'état — la valeur est aussi annoncée en texte, donc
 * jamais portée par la seule couleur.
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
  progress,
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
  /** Fraction envoyée, de 0 à 1. `null` tant qu'aucun envoi n'a commencé. */
  progress?: number | null;
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
          error ? 'border-[1.5px] border-walnut-900' : 'border-line-field',
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
          className="rounded-control border border-line-secondary px-16 py-[11px] text-[13.5px] font-medium transition-colors duration-[150ms] ease-logos hover:border-line-secondary-hover hover:text-walnut-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900"
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

        {typeof progress === 'number' ? (
          <div className="mt-12">
            <div
              role="progressbar"
              aria-label="Téléversement du fichier"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              className="h-[3px] w-full bg-line"
            >
              <div
                className="h-full bg-walnut-900 transition-[width] duration-[150ms] ease-logos"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="mt-[7px] text-small text-help">
              {progress < 1
                ? `Téléversement… ${Math.round(progress * 100)} %`
                : 'Fichier téléversé.'}
            </p>
          </div>
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
