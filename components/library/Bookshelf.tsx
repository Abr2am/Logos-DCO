import { coverFamilyFromKey } from '@/lib/cover/families';
import { cn } from '@/lib/cn';
import { resourceMetaLine } from '@/lib/domain/resource';
import type { ResourceSummary } from '@/lib/library/types';

import { ResourceCard } from './ResourceCard';
import { Shelf } from './Shelf';

/*
 * Rayonnage — les ressources posées sur des tablettes, comme de vrais
 * ouvrages.
 *
 * ── Comment la tablette suit les rangées ────────────────────────────────────
 * Le nombre d'ouvrages par rangée change avec le palier (2 · 3 · 4). Une
 * tablette unique posée sous la grille ne fermerait donc qu'une rangée sur
 * trois, et un découpage en JavaScript figerait un nombre de colonnes que le
 * CSS peut contredire.
 *
 * La tablette est donc portée par CHAQUE travée : les travées d'une même
 * rangée sont jointives horizontalement — l'espacement vient de leur padding
 * intérieur, pas d'une gouttière —, si bien que leurs tablettes se rejoignent
 * et ne forment qu'une seule ligne continue. La solution est purement CSS et
 * suit le palier sans un seul calcul.
 *
 * ── Montants ────────────────────────────────────────────────────────────────
 * Deux montants encadrent le rayonnage en desktop uniquement. Ponctuels, d'un
 * pixel : ils donnent la travée, pas un meuble.
 *
 * L'étagère reste DISCRÈTE et ne domine jamais les couvertures.
 */
export function Bookshelf({
  resources,
  className,
}: {
  resources: ReadonlyArray<ResourceSummary>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative',
        /* Montants : un filet noyer de part et d'autre, desktop seulement. */
        'desktop:border-x desktop:border-x-[rgb(46_30_21/0.14)] desktop:px-[18px]',
        className,
      )}
    >
      <div className="grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4">
        {resources.map((resource) => (
          <div
            key={resource.id}
            /* Travée : pas de gouttière horizontale, l'air vient du padding —
               c'est ce qui rend les tablettes jointives. */
            className="flex flex-col px-[7px] pb-34 tablet:px-12 tablet:pb-44"
          >
            <ResourceCard
              href={`/ressource/${resource.id}`}
              title={resource.title}
              category={resource.subcategoryName ?? resource.categoryName}
              family={coverFamilyFromKey(resource.id)}
              meta={resourceMetaLine(resource)}
              className="mb-16"
            />
            {/* `mt-auto` aligne toutes les tablettes d'une rangée sur la même
                ligne de base, quelle que soit la longueur des titres. */}
            <Shelf className="-mx-[7px] mt-auto tablet:-mx-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
