import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Header } from '@/components/layout/Header';
import { BranchHeader } from '@/components/library/BranchHeader';
import { FilterBar } from '@/components/library/FilterBar';
import { LibraryResults } from '@/components/library/LibraryResults';
import { ThemeCard } from '@/components/library/ThemeCard';
import {
  getCategories,
  getFlagFacets,
  searchResources,
} from '@/lib/library/queries';
import { libraryHref, readFlags, readQuery } from '@/lib/library/url';

/*
 * Branche de catégorie.
 *
 * « Une catégorie sans sous-catégorie mène directement aux ressources. »
 * « Vie chrétienne » présente d'abord ses trois sous-thèmes, puis les
 * ressources de toute la branche.
 *
 * Ce n'est pas une page Catégories indépendante : c'est la vue d'une branche,
 * atteinte depuis la bibliothèque.
 */

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ categorie: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categorie } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === categorie);
  return { title: category ? `${category.name} — Logos` : 'Logos' };
}

export default async function CategoriePage({
  params,
  searchParams,
}: PageProps) {
  const { categorie } = await params;
  const search = await searchParams;

  const query = readQuery(search.q);
  const flags = readFlags(search.flags);

  const categories = await getCategories();
  const category = categories.find((item) => item.slug === categorie);
  if (!category) notFound();

  const branch = { categorySlug: category.slug };

  const [availableFlags, resources] = await Promise.all([
    getFlagFacets(branch),
    searchResources({ ...branch, query, flags }),
  ]);

  const branchHref = libraryHref(branch);

  return (
    <>
      <Header currentPath="/bibliotheque" />

      <BranchHeader
        crumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Bibliothèque', href: '/bibliotheque' },
          { label: category.name },
        ]}
        title={category.name}
        searchAction={branchHref}
        searchDefaultValue={query}
        searchPreserve={flags.map((flag) => ({ name: 'flags', value: flag }))}
      />

      <main className="mx-auto max-w-content px-20 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <FilterBar
          categories={categories}
          categorySlug={category.slug}
          subcategorySlug={null}
          query={query}
          availableFlags={availableFlags}
          activeFlags={flags}
        />

        {category.subcategories.length > 0 ? (
          <ul className="mt-26 grid gap-[9px] tablet:grid-cols-3 tablet:gap-12">
            {category.subcategories.map((subcategory) => (
              <li key={subcategory.slug}>
                <ThemeCard
                  name={subcategory.name}
                  href={libraryHref({
                    ...branch,
                    subcategorySlug: subcategory.slug,
                  })}
                />
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-34">
          <LibraryResults resources={resources} resetHref={branchHref} />
        </div>
      </main>
    </>
  );
}
