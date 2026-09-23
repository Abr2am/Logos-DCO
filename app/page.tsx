import Link from 'next/link';

import { BrandMark } from '@/components/brand/BrandMark';
import { RosaceHero } from '@/components/brand/Rosace';
import { Header } from '@/components/layout/Header';
import { Bookcase } from '@/components/library/Bookcase';
import { DiscoveryShelf } from '@/components/library/Bookshelf';
import { HeroShelf } from '@/components/library/HeroShelf';
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
 * Direction BIBLIOTHÈQUE ARCHITECTURALE (23/09/2026) : on doit entrer dans
 * une bibliothèque, pas consulter une interface qui en représente une. Le
 * hero est un angle de salle — texte à gauche, rosace en pierre, meuble en
 * bord d'écran à droite ; « Explorer par thème » est LE MEUBLE, neuf niches
 * voûtées dans une même carcasse de noyer ; « À découvrir » est la tablette
 * d'apparat où les ouvrages sont présentés de face.
 */

export const dynamic = 'force-dynamic';

/** « À découvrir » : quatre couvertures, soit exactement une rangée. */
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

  /* Les ouvrages posés dans chaque niche sont les ressources réellement
     publiées dans le thème — jamais un décor inventé. Le regroupement se fait
     sur la liste déjà chargée : aucune requête supplémentaire. */
  const booksByCategory = new Map<string, { id: string }[]>();
  for (const resource of published) {
    const shelf = booksByCategory.get(resource.categorySlug) ?? [];
    shelf.push({ id: resource.id });
    booksByCategory.set(resource.categorySlug, shelf);
  }

  return (
    <>
      <Header currentPath="/" />

      <main>
        {/* 1 · Hero — un angle de salle de bibliothèque.

            À gauche le texte ; au fond la rosace, très agrandie et décalée à
            droite, comme une pierre sculptée dans le mur ; à droite le meuble,
            pris en bord d'écran.

            La rosace est dimensionnée par la HAUTEUR de la section : le motif
            étant un disque tangent à son cadre, ses extrémités haute et basse
            effleurent exactement les bords — aucune n'est coupée. Elle passe
            DERRIÈRE le meuble, ce qui est la façon juste de lire la
            profondeur. Le débordement latéral est absorbé par
            `overflow-hidden`, jamais par le document.

            En mobile le meuble se retire — il prendrait la moitié de l'écran —
            et la rosace reste, derrière le texte. */}
        <section className="relative min-h-[430px] overflow-hidden border-b border-line-hairline tablet:min-h-[470px] desktop:min-h-[520px]">
          {/* ⚠️ L'opacité est portée par la PROP, pas par une classe : le
              composant l'écrit en style inline, qui primerait sur
              `tablet:opacity-*`. Une seule valeur, donc, à tous les paliers. */}
          <RosaceHero
            opacity={0.055}
            className="absolute inset-y-0 -right-[130px] h-full w-auto tablet:right-[20%] desktop:right-[21%]"
          />

          <div
            aria-hidden
            className="absolute inset-y-0 right-0 hidden w-[30%] tablet:block desktop:w-[32%]"
          >
            <HeroShelf books={published.slice(0, 8)} id="hero-claustra" />
          </div>

          <div className="relative mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44 desktop:py-56">
            <div className="max-w-reading tablet:max-w-[64%] desktop:max-w-[58%]">
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
          </div>
        </section>

        {/* 2 · Raison d'être et recherche — une seule respiration.

            Le texte garde la colonne de lecture (au-delà, la ligne devient
            illisible) ; la recherche, elle, prend toute la largeur utile. */}
        <section className="mx-auto max-w-content px-22 py-44 tablet:px-26 tablet:py-56 desktop:px-44">
          <SectionHeading title="Une bibliothèque commune" />
          <p className="mt-16 max-w-reading text-body-lg-mobile text-text-secondary tablet:text-body-lg">
            Logos rassemble en un seul endroit les ressources de catéchisme du
            diocèse : les retrouver facilement, en découvrir de nouvelles,
            partager ses propres cours et supports, et poser une question à
            propos de l&apos;une d&apos;elles. Chaque dépôt est relu avant
            d&apos;être publié.
          </p>
          <SearchBar action="/bibliotheque" className="mt-26 max-w-[1040px]" />
        </section>

        {/* 3 · Explorer par thème — LE MEUBLE.

            Neuf niches dans une même carcasse : 5 puis 4 en desktop, 3 en
            tablette, 2 en mobile. Jamais un compteur. Pas de lien tertiaire à
            droite du titre : sa cible tactile tomberait sous 44 px, et les
            neuf niches mènent déjà à la bibliothèque. */}
        <section className="mx-auto max-w-content px-22 pb-44 tablet:px-26 tablet:pb-56 desktop:px-44">
          <SectionHeading title="Explorer par thème" />
          <Bookcase
            friezeId="accueil"
            className="mt-22"
            items={categories.map((category) => ({
              key: category.slug,
              name: category.name,
              href: libraryHref({ categorySlug: category.slug }),
              subthemes: category.subcategories.map((sub) => sub.name),
              books: booksByCategory.get(category.slug),
            }))}
          />
        </section>

        {/* 4 · À découvrir — la tablette d'apparat.

            Quatre ressources publiées récentes, présentées de face. Tant
            qu'il n'y en a aucune, le bloc disparaît : l'accueil n'est pas
            l'endroit d'un état vide, et une tablette sans ouvrages au-dessus
            d'elle n'a pas de sens. */}
        {discover.length > 0 ? (
          <section className="mx-auto max-w-content px-22 pb-44 tablet:px-26 tablet:pb-56 desktop:px-44">
            <SectionHeading title="À découvrir" />
            <DiscoveryShelf resources={discover} className="mt-26" />
          </section>
        ) : null}

        {/* 5 · Panneau de contribution — aplat noyer, titre Bodoni ivoire,
            CTA doré. La rosace y revient en filigrane architectural, très
            discrète et absorbée par `overflow-hidden`. */}
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
