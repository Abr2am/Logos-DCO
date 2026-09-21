import Link from 'next/link';

import { buttonClassName } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ResourceSummary } from '@/lib/library/types';
import { libraryHref } from '@/lib/library/url';

import { ResourceGrid } from './ResourceGrid';

/**
 * Résultats d'une recherche ou d'une branche, ou état vide.
 *
 * Aucune pagination — décision validée (point « A ») : la totalité des
 * résultats est rendue. Les ressources arrivent déjà triées par date de
 * publication décroissante (point « B »).
 */
export function LibraryResults({
  resources,
  resetHref,
}: {
  resources: ReadonlyArray<ResourceSummary>;
  /** Cible du bouton « Retirer les filtres » : la branche, sans recherche. */
  resetHref?: string;
}) {
  if (resources.length === 0) {
    return (
      <EmptyState
        title="Aucune ressource ne correspond"
        description="Essayez un autre mot, ou retirez un filtre."
        action={
          <Link
            href={resetHref ?? libraryHref({})}
            className={buttonClassName('secondary')}
          >
            Retirer les filtres
          </Link>
        }
      />
    );
  }

  return <ResourceGrid resources={resources} />;
}
