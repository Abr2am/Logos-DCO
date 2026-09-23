import { cn } from '@/lib/cn';
import { coverFamilyFromKey } from '@/lib/cover/families';
import { resourceMetaLine } from '@/lib/domain/resource';
import type { ResourceSummary } from '@/lib/library/types';

import { ResourceCard } from './ResourceCard';

/*
 * Rayonnage — les ouvrages posés dans la travée, comme de vrais livres.
 *
 * ── Comment la tablette suit les rangées ────────────────────────────────────
 * Le nombre d'ouvrages par rangée change avec le palier (2 · 3 · 4). Une
 * tablette unique posée sous la grille ne fermerait qu'une rangée sur trois,
 * et un découpage en JavaScript figerait un nombre de colonnes que le CSS peut
 * contredire.
 *
 * La tablette est donc portée par CHAQUE travée : les travées d'une même
 * rangée sont jointives — l'air vient de leur padding intérieur, pas d'une
 * gouttière —, si bien que leurs tablettes se rejoignent en une seule ligne
 * continue. Purement CSS, exact à tous les paliers.
 *
 * ── Profondeur ──────────────────────────────────────────────────────────────
 * La tablette a un CHANT : un filet doré en arête, un plateau `walnut-700`,
 * puis un tasseau `walnut-900` en dessous. Trois aplats, aucune ombre portée,
 * aucun dégradé de bois — la profondeur vient de la matière et de la
 * géométrie.
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
        'grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4',
        className,
      )}
    >
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
          <ShelfPlank className="-mx-[7px] mt-auto tablet:-mx-12" />
        </div>
      ))}
    </div>
  );
}

/** Tablette à chant : arête dorée, plateau noyer clair, tasseau noyer sombre. */
export function ShelfPlank({
  strong,
  className,
}: {
  /** Tablette d'apparat — « À découvrir » en accueil. */
  strong?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn('shrink-0', className)}>
      <div className="h-px bg-[rgb(195_154_84/0.6)]" />
      <div
        className={cn(
          'bg-walnut-700',
          strong ? 'h-[11px] tablet:h-[13px]' : 'h-[7px] tablet:h-[9px]',
        )}
      />
      <div
        className={cn(
          'bg-walnut-900',
          strong ? 'h-[6px] tablet:h-[8px]' : 'h-[4px] tablet:h-[5px]',
        )}
      />
    </div>
  );
}

/*
 * « À découvrir » — le rayonnage d'apparat de l'accueil.
 *
 * Deux ouvrages par rangée jusqu'en tablette, QUATRE en desktop : le nombre
 * affiché (quatre) remplit donc toujours ses rangées — 2 + 2, puis 4 — et les
 * tablettes se rejoignent en une ligne continue sur toute la largeur. Trois
 * colonnes couperaient à la fois la rangée et les titres de couverture. La tablette y est plus épaisse
 * qu'en bibliothèque — c'est la vitrine de l'accueil, les ouvrages y ont de
 * l'air autour d'eux.
 */
export function DiscoveryShelf({
  resources,
  className,
}: {
  resources: ReadonlyArray<ResourceSummary>;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 desktop:grid-cols-4', className)}>
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="flex flex-col px-[7px] pb-34 tablet:px-16 tablet:pb-44 desktop:px-22"
        >
          <ResourceCard
            href={`/ressource/${resource.id}`}
            title={resource.title}
            category={resource.subcategoryName ?? resource.categoryName}
            family={coverFamilyFromKey(resource.id)}
            meta={resourceMetaLine(resource)}
            className="mb-16"
          />
          <ShelfPlank
            strong
            className="-mx-[7px] mt-auto tablet:-mx-16 desktop:-mx-22"
          />
        </div>
      ))}
    </div>
  );
}
