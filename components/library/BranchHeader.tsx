import Image from 'next/image';

import { Breadcrumb, type Crumb } from '@/components/ui/Breadcrumb';
import { SearchBar } from '@/components/ui/SearchBar';

/*
 * En-tête de branche : panneau noyer avec marqueterie à 14-16 %, contenant
 * le fil d'Ariane, le titre et la recherche limitée à cette branche.
 *
 * C'est l'un des six emplois autorisés du noyer. Jamais plus de deux zones
 * noyer par écran : le bandeau du header et ce panneau.
 */
export function BranchHeader({
  crumbs,
  title,
  searchAction,
  searchDefaultValue,
  searchPreserve,
}: {
  crumbs: ReadonlyArray<Crumb>;
  title: string;
  searchAction: string;
  searchDefaultValue?: string;
  searchPreserve?: ReadonlyArray<{ name: string; value: string }>;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-none bg-walnut-900 px-20 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
      <Image
        src="/brand/marqueterie-736.webp"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="object-cover opacity-[.15]"
      />
      {/* Voile noyer — le seul emploi concret de la marqueterie dans le Design
          System (plat de couverture famille 03) la pose sous ce même voile.
          Sans lui, la photographie prend le pas sur le panneau : « le
          patrimoine est dans les détails, pas dans la surcharge ». */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(rgb(46_30_21/0.55),rgb(46_30_21/0.8))]"
      />
      <div className="relative">
        <Breadcrumb items={crumbs} tone="dark" />
        <h1 className="mt-16 font-display text-h1-mobile text-on-dark tablet:text-h1">
          {title}
        </h1>
        <SearchBar
          scope="branch"
          branchLabel={title}
          action={searchAction}
          defaultValue={searchDefaultValue}
          preserve={searchPreserve}
          className="mt-22 max-w-[520px]"
        />
      </div>
    </section>
  );
}
