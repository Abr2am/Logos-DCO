import type { ReactNode } from 'react';

import { RosacePastille } from '@/components/brand/Rosace';

/*
 * « L'état vide est le seul endroit où la rosace apparaît en petit format
 *   hors marque — pastille dorée de 34 px. »
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
      <RosacePastille size={34} tone="gold" className="mx-auto" />
      <p className="mt-16 font-display text-[22px] leading-[1.2]">{title}</p>
      {description ? (
        <p className="mt-[8px] text-body text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-16 inline-flex">{action}</div> : null}
    </div>
  );
}
