import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/*
 * Flag — rectangle 3 px, JAMAIS de forme « pill », jamais de pastille pleine
 * colorée, jamais de couleur propre à un mot-clé : un flag n'est pas une
 * catégorie et ne porte aucune sémantique visuelle.
 *
 * Les flags sont du texte libre propre à chaque ressource. Il n'existe aucun
 * référentiel central, aucun écran de gestion, aucun workflow de validation.
 */

/* Gabarit commun — sans rembourrage horizontal : chaque variante pose le
   sien, pour éviter deux classes réglant la même propriété. */
const BASE =
  'inline-flex items-center gap-[6px] rounded-control ' +
  'py-[7px] text-[11.5px] leading-none tablet:text-small ' +
  'transition-colors duration-[150ms] ease-logos';

const PAD = 'px-[13px]';
const PAD_FORM = 'px-[12px]';

/** Flag en lecture seule (fiche ressource). */
export function Flag({ children }: { children: ReactNode }) {
  return (
    <span className={cn(BASE, PAD, 'border border-line bg-surface text-text')}>
      {children}
    </span>
  );
}

/** Flag utilisé en filtre : l'état sélectionné passe en bordeaux plein. */
export function FlagFilter({
  label,
  selected = false,
  ...props
}: {
  label: string;
  selected?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        BASE,
        PAD,
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy',
        selected
          ? 'bg-burgundy font-medium text-on-dark'
          : 'border border-line bg-surface text-text hover:border-line-secondary hover:bg-cover-plate',
      )}
      {...props}
    >
      {label}
      {selected ? (
        <span className="opacity-60" aria-hidden>
          ✕
        </span>
      ) : null}
    </button>
  );
}

/** Flag saisi dans un formulaire, retirable. */
export function FlagRemovable({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        BASE,
        PAD_FORM,
        'border border-[rgb(36_24_16/0.14)] bg-cover-plate text-text',
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer le mot-clé ${label}`}
        className="text-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
      >
        ✕
      </button>
    </span>
  );
}

/** Déclencheur d'ajout d'un flag dans un formulaire. */
export function FlagAdd(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        BASE,
        PAD_FORM,
        'border border-dashed border-[rgb(110_27_42/0.4)] text-burgundy',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy',
      )}
      {...props}
    >
      + ajouter
    </button>
  );
}
