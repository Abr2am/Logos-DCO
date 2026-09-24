import Link from 'next/link';

import { buttonClassName } from '@/components/ui/Button';

/*
 * Hero de l'accueil — le décor est un ASSET, le contenu reste du HTML.
 *
 * Deux compositions VALIDÉES et volontairement différentes : `hero-desktop`
 * en tablette et desktop, `hero-mobile` en mobile. On ne fait pas rentrer
 * l'une dans l'autre.
 *
 * ⚠️ Le hero n'est jamais une image aplatie : surtitre, titre, signature et
 * appels à l'action sont de vrais éléments, sélectionnables, traduisibles et
 * accessibles. L'image ne porte que le décor, d'où son `alt` vide.
 *
 * `<picture>` plutôt que deux `next/image` superposés : `<source media>` est
 * le seul moyen de ne télécharger QUE la composition du palier courant — deux
 * images en `hidden` seraient toutes deux chargées.
 *
 * ── Les proportions ─────────────────────────────────────────────────────────
 * La hauteur du hero vient d'un RAPPORT, jamais d'une valeur fixe : il suit
 * donc la largeur sans jamais sauter. En desktop c'est le rapport exact du
 * fichier — aucun recadrage. En tablette et en mobile, la maquette veut un
 * cadre plus haut : `object-cover` recadre alors par le côté gauche
 * (`object-right`), là où il n'y a que le mur.
 */
export function HomeHero() {
  return (
    <section className="relative aspect-[36/52] max-h-[620px] overflow-hidden tablet:aspect-[768/430] tablet:max-h-none desktop:aspect-[1637/724]">
      <picture>
        <source
          media="(min-width: 640px)"
          srcSet="/home/hero-desktop.webp"
          width={1637}
          height={724}
        />
        {/* `<img>` volontaire : `next/image` ne sait pas porter deux
            compositions distinctes derrière `<source media>`. */}
        <img
          src="/home/hero-mobile.webp"
          width={477}
          height={724}
          alt=""
          aria-hidden
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full select-none object-cover object-center tablet:object-right"
        />
      </picture>

      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-content px-22 tablet:px-26 desktop:px-44">
          {/* Le texte tient dans le mur clair ; les boutons, eux, peuvent aller
              un peu plus loin — ils sont pleins et restent lisibles. */}
          <div className="max-w-[61%] tablet:max-w-[56%] desktop:max-w-[50%]">
            <p className="font-mono text-[9px] font-medium uppercase leading-[1.4] tracking-[0.12em] text-walnut-700 tablet:text-mono tablet:tracking-[0.13em]">
              Diocèse Copte Orthodoxe de Paris
            </p>

            <h1 className="mt-[6px] font-display text-[27px] leading-[1.08] tablet:mt-12 tablet:text-[38px] tablet:leading-[1.1] desktop:text-hero">
              Les ressources de catéchisme
            </h1>

            <p className="mt-[6px] font-display text-[13px] italic leading-[1.45] text-text-secondary tablet:mt-12 tablet:text-signature-mobile desktop:text-signature">
              Une même foi, pour aujourd&apos;hui et pour demain.
            </p>
          </div>

          <div className="mt-16 flex max-w-[76%] flex-col items-start gap-12 tablet:mt-26 tablet:max-w-none tablet:flex-row tablet:flex-wrap">
            <Link
              href="/bibliotheque"
              className={`${buttonClassName('primary')} whitespace-nowrap`}
            >
              Explorer la bibliothèque
              <span aria-hidden className="ml-[8px]">
                →
              </span>
            </Link>
            <Link
              href="/partager"
              className={`${buttonClassName('secondary')} whitespace-nowrap`}
            >
              Partager un cours
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
