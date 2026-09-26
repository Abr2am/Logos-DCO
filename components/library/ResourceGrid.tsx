import type { ResourceSummary } from '@/lib/library/types';

import { Bookshelf } from './Bookshelf';

/*
 * Les ressources d'une branche ou d'une recherche, présentées en rayonnage.
 *
 * 2 ouvrages par rangée en mobile · 3 en tablette · 4 en desktop — le
 * responsive du cahier des charges, tenu par le seul CSS (voir `Bookshelf`).
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
  return <Bookshelf resources={resources} />;
}
