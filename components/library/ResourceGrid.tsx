import { coverFamilyFromKey } from '@/lib/cover/families';
import { resourceMetaLine } from '@/lib/domain/resource';
import type { ResourceSummary } from '@/lib/library/types';

import { ResourceCard } from './ResourceCard';
import { Shelf } from './Shelf';

/*
 * Grille de couvertures, close par une tablette.
 *
 * 2 par rangée en mobile · 3 en tablette · 4 en desktop.
 *
 * La famille de couverture est dérivée de l'identifiant de la ressource
 * (déterminisme stable). Le point ouvert « N » — arbitrage entre ce
 * déterminisme et les contraintes de rythme par rangée — reste entier.
 */
export function ResourceGrid({
  resources,
}: {
  resources: ReadonlyArray<ResourceSummary>;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-16 tablet:grid-cols-3 tablet:gap-26 desktop:grid-cols-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            href={`/ressource/${resource.id}`}
            title={resource.title}
            category={resource.subcategoryName ?? resource.categoryName}
            family={coverFamilyFromKey(resource.id)}
            meta={resourceMetaLine(resource)}
          />
        ))}
      </div>
      <Shelf className="mt-[18px]" />
    </div>
  );
}
