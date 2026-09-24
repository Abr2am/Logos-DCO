import type { ReactNode } from 'react';

import { Emblem } from '@/components/brand/Emblem';

/*
 * L'état vide porte l'EMBLÈME OFFICIEL, 34 px de haut — proportionné et
 * discret. Il a remplacé la pastille de rosace le 24/09/2026 : la rosace ne
 * porte plus l'identité.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-line bg-surface px-[26px] py-34 text-center">
      <Emblem height={34} className="mx-auto" />
      <p className="mt-16 font-display text-[22px] leading-[1.2]">{title}</p>
      {description ? (
        <p className="mt-[8px] text-body text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-16 inline-flex">{action}</div> : null}
    </div>
  );
}
