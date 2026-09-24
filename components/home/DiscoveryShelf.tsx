import { ShelfPlank } from '@/components/library/Bookshelf';
import { ResourceCard } from '@/components/library/ResourceCard';
import { cn } from '@/lib/cn';
import { coverFamilyFromKey } from '@/lib/cover/families';
import { resourceMetaLine } from '@/lib/domain/resource';
import type { ResourceSummary } from '@/lib/library/types';

/*
 * « À découvrir » — les ouvrages posés sur UNE tablette.
 *
 * Fond ivoire, vraies couvertures, une seule tablette horizontale : ni panneau
 * sombre derrière les livres, ni meuble complet. Les ressources viennent des
 * données publiées réelles et restent cliquables.
 *
 * ── Comment la rangée se remplit ────────────────────────────────────────────
 * Cinq ouvrages sont rendus. En desktop, les cinq tiennent. En tablette, le
 * cinquième se retire — quatre respirent mieux. En mobile, la rangée défile
 * horizontalement : la tablette, elle, reste pleine largeur sous les ouvrages,
 * exactement comme dans la maquette.
 */
export function DiscoveryShelf({
  resources,
  className,
}: {
  resources: ReadonlyArray<ResourceSummary>;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <ul
        className={cn(
          'flex items-end gap-16 overflow-x-auto',
          'tablet:gap-22 tablet:overflow-x-visible desktop:gap-26',
        )}
      >
        {resources.map((resource, index) => (
          <li
            key={resource.id}
            className={cn(
              /* `min-w-0` : sans lui, le plancher `min-width: auto` d'un
                 élément flex laisserait la couverture au titre le plus long
                 pousser sa colonne — les ouvrages n'auraient plus la même
                 largeur. */
              'w-[44%] min-w-0 shrink-0 tablet:w-auto tablet:flex-1',
              /* Le cinquième n'apparaît qu'en mobile (au défilement) et en
                 desktop : en tablette, quatre ouvrages tiennent mieux. */
              index >= 4 && 'block tablet:hidden desktop:block',
            )}
          >
            <ResourceCard
              href={`/ressource/${resource.id}`}
              title={resource.title}
              category={resource.subcategoryName ?? resource.categoryName}
              family={coverFamilyFromKey(resource.id)}
              meta={resourceMetaLine(resource)}
              caption={false}
            />
          </li>
        ))}
      </ul>

      {/* La tablette : une seule, sous toute la rangée. */}
      <ShelfPlank strong />
    </div>
  );
}
