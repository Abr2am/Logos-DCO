import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Header } from '@/components/layout/Header';
import { BranchHeader } from '@/components/library/BranchHeader';
import { FilterBar } from '@/components/library/FilterBar';
import { LibraryResults } from '@/components/library/LibraryResults';
import {
  getCategories,
  getFlagFacets,
  searchResources,
} from '@/lib/library/queries';
import { libraryHref, readFlags, readQuery } from '@/lib/library/url';

/*
 * Branche de sous-catégorie — uniquement sous « Vie chrétienne ».
 *
 * Parcours : Bibliothèque → Vie chrétienne → Jeunesse → ressources.
 */

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ categorie: string; 'sous-categorie': string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function resolveBranch(params: PageProps['params']) {
  const resolved = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === resolved.categorie);
  const subcategory = category?.subcategories.find(
    (item) => item.slug === resolved['sous-categorie'],
  );
  return { categories, category, subcategory };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { subcategory } = await resolveBranch(params);
  return { title: subcategory ? `${subcategory.name} — Logos` : 'Logos' };
}

export default async function SousCategoriePage({
  params,
  searchParams,
}: PageProps) {
  const search = await searchParams;
  const query = readQuery(search.q);
  const flags = readFlags(search.flags);

  const { categories, category, subcategory } = await resolveBranch(params);
  if (!category || !subcategory) notFound();

  const branch = {
    categorySlug: category.slug,
    subcategorySlug: subcategory.slug,
  };

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
          {
            label: category.name,
            href: libraryHref({ categorySlug: category.slug }),
          },
          { label: subcategory.name },
        ]}
        title={subcategory.name}
        searchAction={branchHref}
        searchDefaultValue={query}
        searchPreserve={flags.map((flag) => ({ name: 'flags', value: flag }))}
      />

      <main className="mx-auto max-w-content px-20 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <FilterBar
          categories={categories}
          categorySlug={category.slug}
          subcategorySlug={subcategory.slug}
          query={query}
          availableFlags={availableFlags}
          activeFlags={flags}
        />

        <div className="mt-34">
          <LibraryResults resources={resources} resetHref={branchHref} />
        </div>
      </main>
    </>
  );
}
