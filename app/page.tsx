import Link from 'next/link';

import { RosaceHero } from '@/components/brand/Rosace';
import { DiscoveryShelf } from '@/components/home/DiscoveryShelf';
import { HomeHero } from '@/components/home/HomeHero';
import { Header } from '@/components/layout/Header';
import { ThemeBookcase } from '@/components/library/ThemeBookcase';
import { buttonClassName } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getCategories, searchResources } from '@/lib/library/queries';
import { libraryHref } from '@/lib/library/url';

/*
 * Accueil — éditorial, PAS une seconde bibliothèque.
 *
 * Les blocs du §20 du cahier des charges, dans l'ordre : hero, raison d'être,
 * recherche, « Explorer par thème » (les neuf), « À découvrir », bande de
 * contribution, pied. Le pied est global (voir `app/layout.tsx`).
 *
 * ⚠️ La MAQUETTE FINALE VALIDÉE est la source de vérité visuelle de cette
 * page. Elle prime sur l'interprétation et sur les règles de composition
 * antérieures. Ce fichier ne fait que composer — la menuiserie vient des
 * assets d'architecture (`components/home/`), les données des requêtes
 * existantes. Aucune fonctionnalité, route ou requête n'est ajoutée.
 */

export const dynamic = 'force-dynamic';

/** « À découvrir » : cinq ouvrages, comme la maquette desktop. */
const DISCOVER_COUNT = 5;

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
        {/* 1 · Hero — décor validé en asset, contenu en vrai HTML. */}
        <HomeHero />

        {/* 2 · Une bibliothèque commune — bandeau clair, titre à gauche,
            texte à droite, recherche sur toute la largeur utile. */}
        <section className="border-b border-line-hairline bg-surface">
          <div className="mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44 desktop:py-56">
            <div className="desktop:flex desktop:items-start desktop:gap-56">
              <SectionHeading
                title="Une bibliothèque commune"
                className="desktop:w-[34%] desktop:shrink-0"
              />
              <p className="mt-16 text-body-lg-mobile leading-[1.8] text-text-secondary tablet:text-body-lg desktop:mt-[6px]">
                Logos rassemble en un seul endroit les ressources de catéchisme
                du diocèse : les retrouver facilement, en découvrir de
                nouvelles, partager ses propres cours et supports, et poser une
                question à propos de l&apos;une d&apos;elles. Chaque dépôt est
                relu avant d&apos;être publié.
              </p>
            </div>

            <SearchBar action="/bibliotheque" className="mt-26" />
          </div>
        </section>

        {/* 3 · Explorer par thème — LE MEUBLE, en asset validé. Les neuf
            thèmes sont de vrais liens installés dans ses niches. */}
        <section className="mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44 desktop:py-56">
          <SectionHeading
            title="Explorer par thème"
            /* `short: null` : sous 1024 px, la maquette ne montre pas ce lien
               — les neuf thèmes sont juste en dessous. */
            action={{
              label: 'Ouvrir la bibliothèque',
              href: '/bibliotheque',
              short: null,
            }}
          />
          <ThemeBookcase
            className="mt-22 tablet:mt-26"
            themes={categories.map((category) => ({
              slug: category.slug,
              name: category.name,
              href: libraryHref({ categorySlug: category.slug }),
              subthemes: category.subcategories.map((sub) => sub.name),
            }))}
          />
        </section>

        {/* 4 · À découvrir — cinq ouvrages publiés récents, posés sur une
            tablette. Tant qu'il n'y en a aucun, le bloc disparaît : l'accueil
            n'est pas l'endroit d'un état vide. */}
        {discover.length > 0 ? (
          <section className="mx-auto max-w-content px-22 pb-44 tablet:px-26 tablet:pb-56 desktop:px-44">
            <SectionHeading
              title="À découvrir"
              action={{
                label: 'Voir toutes les ressources',
                href: '/bibliotheque',
                short: 'Tout voir',
              }}
            />
            <DiscoveryShelf resources={discover} className="mt-26" />
          </section>
        ) : null}

        {/* 5 · Enrichir la bibliothèque — aplat noyer, titre Bodoni ivoire,
            CTA doré à droite, rosace en filigrane. */}
        <section className="relative overflow-hidden bg-walnut-900 text-on-dark">
          {/* Le disque prend la hauteur du panneau, donc aucune extrémité
              coupée ; il sort par la droite. Fusion `screen` — un motif sombre
              sur un aplat noyer ne se verrait pas. */}
          <RosaceHero
            opacity={0.1}
            blend="screen"
            className="absolute inset-y-0 -right-[120px] h-full w-auto"
          />
          <div className="relative mx-auto max-w-content px-22 py-44 tablet:px-26 tablet:py-56 desktop:px-44">
            <div className="desktop:flex desktop:items-center desktop:justify-between desktop:gap-56">
              <div>
                <p className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-gold-overline">
                  Contribuer
                </p>
                <h2 className="mt-12 font-display text-h2-mobile tablet:text-h2">
                  Enrichir la bibliothèque
                </h2>
                <p className="mt-12 max-w-reading text-body-mobile tablet:text-body">
                  Chaque serviteur peut déposer un cours ou un support. Il est
                  relu par un administrateur avant d&apos;être publié.
                </p>
              </div>

              <div className="mt-26 shrink-0 desktop:mt-0">
                <Link
                  href="/partager"
                  className={buttonClassName('primaryOnWalnut')}
                >
                  Partager un cours
                  <span aria-hidden className="ml-[8px]">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
