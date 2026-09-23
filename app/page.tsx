import Link from 'next/link';

import { BrandMark } from '@/components/brand/BrandMark';
import { RosaceHero } from '@/components/brand/Rosace';
import { Header } from '@/components/layout/Header';
import { ResourceGrid } from '@/components/library/ResourceGrid';
import { ThemeShelf } from '@/components/library/ThemeShelf';
import { buttonClassName } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getCategories, searchResources } from '@/lib/library/queries';
import { libraryHref } from '@/lib/library/url';

/*
 * Accueil — éditorial, PAS une seconde bibliothèque.
 *
 * Les sept blocs du §20 du cahier des charges, dans l'ordre : hero, raison
 * d'être, recherche, « Explorer par thème » (les neuf), « À découvrir »,
 * bande de contribution, pied. Le pied est global (voir `app/layout.tsx`).
 *
 * Aucune primitive nouvelle : tout est repris de la bibliothèque et du
 * Design System. Aucun compteur, aucune statistique, aucun statut, aucun
 * auteur — la page ne montre rien que la bibliothèque ne montre déjà.
 *
 * Direction NOYER (23/09/2026) : le hero est COURT — il annonce, il n'occupe
 * pas l'écran. La rosace y est entière, discrète, jamais coupée par un bord.
 * « Explorer par thème » est un rayonnage de niches, « À découvrir » une
 * véritable étagère d'ouvrages.
 */

export const dynamic = 'force-dynamic';

/** « À découvrir » : quatre couvertures, soit exactement une rangée desktop. */
const DISCOVER_COUNT = 4;

export default async function AccueilPage() {
  const [categories, published] = await Promise.all([
    getCategories(),
    /* Les ressources arrivent déjà triées par date de publication
       décroissante (point « B ») : les plus récentes sont en tête. Aucune
       requête nouvelle n'est introduite pour cette seule page. */
    searchResources({}),
  ]);

  const discover = published.slice(0, DISCOVER_COUNT);

  return (
    <>
      <Header currentPath="/" />

      <main>
        {/* 1 · Hero — court. L'unique occurrence de la rosace, ENTIÈRE et
            discrète : elle accompagne le titre, elle ne le domine pas. */}
        <section className="relative border-b border-line-hairline">
          <div className="relative mx-auto flex max-w-content flex-col gap-26 px-22 py-34 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-26 tablet:py-44 desktop:px-44">
            <div className="relative max-w-reading">
              <BrandMark size="hero" />

              <p className="mt-22 font-mono text-mono font-medium uppercase tracking-[0.13em] text-walnut-700">
                Diocèse Copte Orthodoxe de Paris
              </p>

              <h1 className="mt-[6px] font-display text-hero-mobile tablet:text-hero">
                Les ressources de catéchisme
              </h1>

              <p className="mt-12 font-display italic text-signature-mobile text-text-secondary tablet:text-signature">
                Une même foi, pour aujourd&apos;hui et pour demain.
              </p>

              <div className="mt-26 flex flex-wrap gap-12">
                <Link
                  href="/bibliotheque"
                  className={buttonClassName('primary')}
                >
                  Explorer la bibliothèque
                </Link>
                <Link href="/partager" className={buttonClassName('secondary')}>
                  Partager un cours
                </Link>
              </div>
            </div>

            {/* Rosace entière, à droite du titre. Masquée sous 640 px : à cette
                largeur elle ne tiendrait pas sans être rognée. */}
            <div
              aria-hidden
              className="hidden shrink-0 tablet:block desktop:pr-[26px]"
            >
              <RosaceHero size={240} className="desktop:hidden" />
              <RosaceHero size={320} className="hidden desktop:block" />
            </div>
          </div>
        </section>

        {/* 2 · Raison d'être — colonne de lecture, jamais toute la largeur. */}
        <section className="mx-auto max-w-content px-22 py-44 tablet:px-26 tablet:py-56 desktop:px-44">
          <h2 className="font-display text-h2-mobile tablet:text-h2">
            Une bibliothèque commune
          </h2>
          <p className="mt-16 max-w-reading text-body-lg-mobile text-text-secondary tablet:text-body-lg">
            Logos rassemble en un seul endroit les ressources de catéchisme du
            diocèse : les retrouver facilement, en découvrir de nouvelles,
            partager ses propres cours et supports, et poser une question à
            propos de l&apos;une d&apos;elles. Chaque dépôt est relu avant
            d&apos;être publié.
          </p>
        </section>

        {/* 3 · Recherche — la même que la bibliothèque, portée globale. */}
        <section className="mx-auto max-w-content px-22 pb-44 tablet:px-26 desktop:px-44">
          <SearchBar action="/bibliotheque" className="max-w-search" />
        </section>

        {/* 4 · Explorer par thème — les neuf en rayonnage de niches.
            Jamais un compteur. Pas de lien tertiaire à droite du titre : sa
            cible tactile tomberait sous 44 px, et les neuf niches mènent déjà
            à la bibliothèque. */}
        <section className="mx-auto max-w-content px-22 pb-44 tablet:px-26 tablet:pb-56 desktop:px-44">
          <SectionHeading title="Explorer par thème" />
          <ThemeShelf
            className="mt-22"
            items={categories.map((category) => ({
              key: category.slug,
              name: category.name,
              href: libraryHref({ categorySlug: category.slug }),
              subthemes: category.subcategories.map((sub) => sub.name),
            }))}
          />
        </section>

        {/* 5 · À découvrir — quatre ressources publiées récentes.
            Une véritable étagère : les ouvrages sont posés sur la tablette.
            Tant qu'il n'y en a aucun, le bloc disparaît — l'accueil n'est pas
            l'endroit d'un état vide, et une tablette sans couvertures
            au-dessus d'elle n'a pas de sens. */}
        {discover.length > 0 ? (
          <section className="mx-auto max-w-content px-22 pb-44 tablet:px-26 tablet:pb-56 desktop:px-44">
            <SectionHeading title="À découvrir" />
            <div className="mt-22">
              <ResourceGrid resources={discover} />
            </div>
          </section>
        ) : null}

        {/* 6 · Bande de contribution — aplat noyer, titre Bodoni ivoire,
            CTA doré : le seul cas où le doré porte une action. */}
        <section className="bg-walnut-900 text-on-dark">
          <div className="mx-auto max-w-content px-22 py-44 tablet:px-26 tablet:py-56 desktop:px-44">
            <p className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-gold-overline">
              Contribuer
            </p>
            <h2 className="mt-12 font-display text-h2-mobile tablet:text-h2">
              Enrichir la bibliothèque
            </h2>
            <p className="mt-12 max-w-reading text-body-mobile tablet:text-body">
              Chaque serviteur peut déposer un cours ou un support. Il est relu
              par un administrateur avant d&apos;être publié.
            </p>
            <div className="mt-26">
              <Link
                href="/partager"
                className={buttonClassName('primaryOnWalnut')}
              >
                Partager un cours
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
