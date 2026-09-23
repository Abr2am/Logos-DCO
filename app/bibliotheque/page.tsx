import type { Metadata } from 'next';

import { Header } from '@/components/layout/Header';
import { FilterBar } from '@/components/library/FilterBar';
import { LibraryResults } from '@/components/library/LibraryResults';
import { ThemeShelf } from '@/components/library/ThemeShelf';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SearchBar } from '@/components/ui/SearchBar';
import {
  getCategories,
  getFlagFacets,
  searchResources,
} from '@/lib/library/queries';
import { libraryHref, readFlags, readQuery } from '@/lib/library/url';

/*
 * Bibliothèque — page d'EXPLORATION.
 *
 * « Elle n'affiche pas immédiatement toutes les ressources. »
 * Ordre des blocs imposé : recherche → filtres → catégories.
 *
 * Les neuf thèmes laissent place aux résultats dès qu'une recherche ou un
 * filtre est actif : c'est le seul endroit où une recherche globale aboutit.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bibliothèque — Logos',
};

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = readQuery(params.q);
  const flags = readFlags(params.flags);
  const hasCriteria = query.length > 0 || flags.length > 0;

  const [categories, availableFlags] = await Promise.all([
    getCategories(),
    getFlagFacets(),
  ]);

  const resources = hasCriteria ? await searchResources({ query, flags }) : [];

  return (
    <>
      <Header currentPath="/bibliotheque" />

      <main className="mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <Breadcrumb
          items={[{ label: 'Accueil', href: '/' }, { label: 'Bibliothèque' }]}
        />

        <h1 className="mt-16 font-display text-h1-mobile tablet:text-h1">
          Bibliothèque
        </h1>
        <p className="mt-12 max-w-reading text-body text-text-secondary">
          Recherchez une ressource, ou parcourez les neuf thèmes.
        </p>

        <SearchBar
          action="/bibliotheque"
          defaultValue={query}
          preserve={flags.map((flag) => ({ name: 'flags', value: flag }))}
          className="mt-26 max-w-search"
        />

        <div className="mt-22">
          <FilterBar
            categories={categories}
            categorySlug={null}
            subcategorySlug={null}
            query={query}
            availableFlags={availableFlags}
            activeFlags={flags}
          />
        </div>

        <div className="mt-34">
          {hasCriteria ? (
            <LibraryResults resources={resources} resetHref={libraryHref({})} />
          ) : (
            <ThemeShelf
              items={categories.map((category) => ({
                key: category.slug,
                name: category.name,
                href: libraryHref({ categorySlug: category.slug }),
                subthemes: category.subcategories.map((sub) => sub.name),
              }))}
            />
          )}
        </div>
      </main>
    </>
  );
}
