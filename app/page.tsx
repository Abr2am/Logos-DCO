import Link from 'next/link';

import { BrandMark } from '@/components/brand/BrandMark';
import { RosaceHero } from '@/components/brand/Rosace';
import { Header } from '@/components/layout/Header';
import { ResourceGrid } from '@/components/library/ResourceGrid';
import { ThemeCard } from '@/components/library/ThemeCard';
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
 * Zones noyer de cet écran : la bande de contribution et le pied, contigus
 * et séparés d'un filet doré. Le Design System les compose comme un seul
 * bloc ; le plafond de deux zones par écran est donc tenu.
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
        {/* 1 · Hero — l'unique occurrence de la rosace en grand format. */}
        <section className="relative overflow-hidden border-b border-line-hairline">
          <RosaceHero
            variant="desktop"
            className="absolute -right-[420px] -top-[470px] tablet:-right-[340px] tablet:-top-[420px]"
          />

          <div className="relative mx-auto max-w-content px-22 py-56 tablet:px-26 tablet:py-78 desktop:px-44 desktop:py-96">
            <BrandMark size="hero" />

            <p className="mt-34 font-mono text-mono font-medium uppercase tracking-[0.13em] text-burgundy">
              Diocèse Copte Orthodoxe de Paris
            </p>

            <h1 className="mt-12 max-w-reading font-display text-hero-mobile tablet:text-hero">
              Les ressources de catéchisme
            </h1>

            <p className="mt-16 font-display italic text-signature-mobile text-text-secondary tablet:text-signature">
              Une même foi, pour aujourd&apos;hui et pour demain.
            </p>

            <div className="mt-34 flex flex-wrap gap-12">
              <Link href="/bibliotheque" className={buttonClassName('primary')}>
                Explorer la bibliothèque
              </Link>
              <Link href="/partager" className={buttonClassName('secondary')}>
                Partager un cours
              </Link>
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

        {/* 4 · Explorer par thème — les neuf, jamais un compteur. */}
        <section className="mx-auto max-w-content px-22 pb-44 tablet:px-26 tablet:pb-56 desktop:px-44">
          {/* Pas de lien tertiaire à droite du titre : sa cible tactile
              tomberait sous 44 px, et les neuf thèmes mènent déjà à la
              bibliothèque. */}
          <SectionHeading title="Explorer par thème" />
          <ul className="mt-22 grid gap-[9px] tablet:grid-cols-2 tablet:gap-12 desktop:grid-cols-3 desktop:gap-[14px]">
            {categories.map((category) => (
              <li key={category.slug}>
                <ThemeCard
                  name={category.name}
                  href={libraryHref({ categorySlug: category.slug })}
                  subthemes={category.subcategories.map((sub) => sub.name)}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* 5 · À découvrir — quatre ressources publiées récentes.
            Tant qu'il n'y en a aucune, le bloc disparaît : l'accueil n'est pas
            l'endroit d'un état vide, et une tablette sans couvertures au-dessus
            d'elle n'a pas de sens. */}
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
