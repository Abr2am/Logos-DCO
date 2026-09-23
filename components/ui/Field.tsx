import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/*
 * Règles de champ du Design System :
 *   - le libellé est TOUJOURS au-dessus du champ ; jamais de placeholder en
 *     guise de libellé ;
 *   - astérisque noyer si requis ; les champs optionnels ne portent
 *     aucune mention ;
 *   - l'aide est factuelle et tient sur une ligne ;
 *   - l'erreur est noyer, précédée d'un « ! » monospace — aucune couleur
 *     rouge, aucune icône graphique, jamais la couleur seule pour informer ;
 *   - validation au `blur` et à la soumission, jamais à la frappe.
 */

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-label font-semibold">
      {children}
      {required ? (
        <span className="text-walnut-900" aria-hidden>
          &nbsp;*
        </span>
      ) : null}
    </label>
  );
}

export function FieldHelp({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="mt-[6px] text-[11.5px] leading-[1.5] text-help">
      {children}
    </p>
  );
}

export function FieldError({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <p
      id={id}
      className="mt-[6px] flex gap-[6px] text-[11.5px] leading-[1.5] text-walnut-900"
    >
      <span className="font-mono" aria-hidden>
        !
      </span>
      <span>{children}</span>
    </p>
  );
}

/** Enveloppe libellé / contrôle / aide / erreur, avec l'espacement du DS. */
export function Field({
  id,
  label,
  required,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="mt-[7px]">{children}</div>
      {help && !error ? <FieldHelp id={`${id}-help`}>{help}</FieldHelp> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

/** Classes communes à `input`, `textarea` et `select`. */
export function controlClassName(hasError = false, className?: string): string {
  return cn(
    'block w-full rounded-control bg-surface px-16 py-[14px]',
    'text-[14.5px] leading-[1.4] text-text min-h-[48px]',
    'border transition-colors duration-[150ms] ease-logos',
    'placeholder:text-placeholder',
    hasError ? 'border-[1.5px] border-walnut-900' : 'border-line-field',
    'hover:border-line-field-hover',
    // Focus de champ : bordure noyer + halo 2 px (spécification du DS).
    'focus-visible:border-walnut-900 focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-[rgb(46_30_21/0.28)]',
    'disabled:border-line disabled:bg-disabled-surface disabled:text-disabled-text',
    className,
  );
}

/** Attributs ARIA décrivant aide et erreur pour un contrôle donné. */
export function describedBy(
  id: string,
  { help, error }: { help?: string; error?: string },
): string | undefined {
  const ids = [
    help && !error ? `${id}-help` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(' ');
  return ids || undefined;
}
