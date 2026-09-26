import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/*
 * Panneau d'information — accent gauche de 3 px :
 *   noyer pour une demande de correction,
 *   doré   pour une confirmation,
 *   neutre pour une information sans qualification.
 *
 * Aucun panneau ne porte d'ombre : il a une bordure.
 */

type PanelAccent = 'walnut' | 'gold' | 'neutral';

const ACCENTS: Record<PanelAccent, string> = {
  walnut: 'border-l-[3px] border-l-walnut-900',
  gold: 'border-l-[3px] border-l-gold',
  neutral: 'border-l-[3px] border-l-[rgb(36_24_16/0.2)]',
};

export function Panel({
  accent = 'neutral',
  label,
  children,
  className,
}: {
  accent?: PanelAccent;
  /** Surtitre monospace du bloc, en capitales. */
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-control border border-line bg-surface px-[20px] py-[18px]',
        ACCENTS[accent],
        className,
      )}
    >
      {label ? (
        <div className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-walnut-900">
          {label}
        </div>
      ) : null}
      <div className={cn('text-body', label && 'mt-[7px]')}>{children}</div>
    </div>
  );
}

/** Bloc de métadonnées : grille 2 × 2, en fiche ressource et en modération. */
export function MetadataBlock({
  items,
}: {
  items: ReadonlyArray<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-[32px] gap-y-16 rounded-panel border border-line bg-surface px-[26px] py-[24px]">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-walnut-900">
            {item.label}
          </dt>
          <dd className="mt-[6px] text-[14.5px]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
