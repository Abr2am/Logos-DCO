import Link from 'next/link';

import {
  ArabesqueArch,
  ArabesqueFret,
  ArabesqueFrieze,
  ArabesqueLattice,
  ArabesqueMedallion,
} from '@/components/brand/Arabesque';
import { cn } from '@/lib/cn';

import { BookSpines } from './BookSpines';

/*
 * LE MEUBLE — une bibliothèque, pas une grille de cartes.
 *
 * ── Ce qui en fait un meuble et non neuf rectangles ─────────────────────────
 * Une CORNICHE moulurée le couronne, une GRECQUE de socle le pose au sol, et
 * deux JOUES ajourées le ferment de part et d'autre. Entre les deux, les
 * niches ne sont que des ouvertures pratiquées dans une même carcasse : le
 * fond `walnut-700` transparaît dans les gouttières de la grille — ce sont les
 * MONTANTS — et referme les rangées incomplètes en travée pleine.
 *
 * ── La profondeur ──────────────────────────────────────────────────────────
 * Elle vient de trois choses, jamais d'un dégradé ni d'une texture de bois :
 *   1. l'étagement des aplats — joue et façade en `walnut-700`, fond de niche
 *      en `walnut-900`, grecque de socle en `walnut-900` ;
 *   2. une ombre portée INTERNE très discrète (`shadow-niche`) : le linteau
 *      projette son ombre sur le fond de la niche, comme dans un vrai
 *      renfoncement ;
 *   3. les arêtes — filets dorés d'un pixel en nez de tablette, en imposte et
 *      en corniche.
 *
 * ── Les rangées ────────────────────────────────────────────────────────────
 * Desktop : 5 niches puis 4, sur une grille de 20 colonnes (4 × 5 = 5 × 4).
 * Tablette : 3 par rangée. Mobile : 2. Aucune règle conditionnelle en
 * JavaScript — la composition est portée par la seule grille CSS.
 *
 * ⚠️ Rien ici n'est photoréaliste : aplats, filets, tracés géométriques. Ni
 * musée, ni brocante, ni texture de bois. Le résultat doit rester
 * contemporain, premium et éditorial.
 */

export type NicheItem = {
  key: string;
  name: string;
  href: string;
  /** Uniquement « Vie chrétienne » en porte. */
  subthemes?: ReadonlyArray<string>;
  selected?: boolean;
  /**
   * Les ouvrages réellement publiés dans ce thème. Les tranches en sont
   * dérivées — ce n'est pas une illustration décorative. Une niche vide reste
   * une niche : du bois, pas un trou.
   */
  books?: ReadonlyArray<{ id: string }>;
};

type Layout = 'themes' | 'subthemes';

/* Les neuf thèmes tiennent en deux rangées de 5 et 4 : sur 20 colonnes, une
   niche de la première rangée en occupe 4, une de la seconde 5. */
const GRID: Record<Layout, string> = {
  themes:
    'grid-cols-2 tablet:grid-cols-6 desktop:grid-cols-[repeat(20,minmax(0,1fr))]',
  subthemes: 'grid-cols-1 tablet:grid-cols-3',
};

function spanFor(layout: Layout, index: number): string {
  if (layout === 'subthemes') return '';
  return index < 5
    ? 'tablet:col-span-2 desktop:col-span-4'
    : 'tablet:col-span-2 desktop:col-span-5';
}

export function Bookcase({
  items,
  layout = 'themes',
  friezeId,
  className,
}: {
  items: ReadonlyArray<NicheItem>;
  layout?: Layout;
  /** Identifiant des motifs — unique par meuble sur une page. */
  friezeId: string;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden bg-walnut-700', className)}>
      <Cornice id={`${friezeId}-corniche`} />

      <div className="flex">
        <Cheek id={`${friezeId}-joue-g`} />

        {/* Les gouttières verticales SONT les montants : la carcasse y
            transparaît. La gouttière horizontale est la traverse entre les
            deux niveaux. */}
        <ul
          className={cn(
            'grid flex-1 gap-x-[10px] gap-y-[8px] px-[6px] tablet:gap-x-[14px] tablet:px-0',
            GRID[layout],
          )}
        >
          {items.map((item, index) => (
            <li
              key={item.key}
              className={cn('flex flex-col', spanFor(layout, index))}
            >
              <Niche item={item} />
            </li>
          ))}
        </ul>

        <Cheek id={`${friezeId}-joue-d`} />
      </div>

      <Plinth id={`${friezeId}-socle`} />
    </div>
  );
}

/** Corniche : larmier saillant, filet doré, frise, puis l'ombre du linteau. */
function Cornice({ id }: { id: string }) {
  return (
    <div aria-hidden>
      <div className="h-[7px] bg-walnut-700 tablet:h-[9px]" />
      <div className="h-px bg-[rgb(195_154_84/0.4)]" />
      <div className="h-[16px] tablet:h-[20px]">
        <ArabesqueFrieze id={id} />
      </div>
      <div className="h-px bg-[rgb(31_20_13/0.5)]" />
    </div>
  );
}

/** Socle : grecque dense en noyer sombre — c'est le pied du meuble. */
function Plinth({ id }: { id: string }) {
  return (
    <div aria-hidden>
      <div className="h-px bg-[rgb(195_154_84/0.32)]" />
      <div className="h-[18px] tablet:h-[24px]">
        <ArabesqueFret id={id} />
      </div>
      <div className="h-[6px] bg-walnut-700 tablet:h-[8px]" />
    </div>
  );
}

/**
 * Joue du meuble — panneau ajouré ponctué de deux médaillons.
 *
 * Masquée sous 640 px : à cette largeur, elle prendrait la place des niches.
 * Le bois y reste présent par le liseré de la carcasse.
 */
function Cheek({ id }: { id: string }) {
  return (
    <div
      aria-hidden
      className="relative hidden w-[34px] shrink-0 flex-col items-center justify-around bg-walnut-700 py-22 tablet:flex desktop:w-[44px]"
    >
      <div className="absolute inset-[7px] opacity-70">
        <ArabesqueLattice id={id} />
      </div>
      <ArabesqueMedallion className="relative h-[22px] w-[22px] desktop:h-[26px] desktop:w-[26px]" />
      <ArabesqueMedallion className="relative h-[22px] w-[22px] desktop:h-[26px] desktop:w-[26px]" />
    </div>
  );
}

function Niche({ item }: { item: NicheItem }) {
  return (
    /* Piédroits : deux filets dorés très pâles ferment l'ouverture sur les
       côtés. `shadow-niche` creuse le renfoncement. */
    <div className="flex flex-1 flex-col border-x border-[rgb(195_154_84/0.14)] bg-walnut-900 shadow-niche">
      {/* Arc surbaissé : le fond de niche se découpe en négatif dans le mur. */}
      <ArabesqueArch className="h-[26px] shrink-0 tablet:h-[34px]" />

      <Link
        href={item.href}
        aria-current={item.selected ? 'page' : undefined}
        className={cn(
          'group flex flex-1 flex-col',
          'px-12 pb-12 pt-4 tablet:px-16 tablet:pb-16',
          'transition-colors duration-[150ms] ease-logos',
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold',
          item.selected ? 'bg-[rgb(195_154_84/0.12)]' : 'hover:bg-walnut-700',
        )}
      >
        <span className="flex items-baseline justify-between gap-8">
          <span className="font-display text-[17px] leading-[1.2] text-on-dark tablet:text-[20px]">
            {item.name}
          </span>
          <span
            aria-hidden
            className="shrink-0 text-gold transition-transform duration-[150ms] ease-logos group-hover:translate-x-[2px]"
          >
            →
          </span>
        </span>

        {item.subthemes && item.subthemes.length > 0 ? (
          <span className="mt-12 flex flex-wrap gap-[6px]">
            {item.subthemes.map((sub) => (
              <span
                key={sub}
                className="rounded-status border border-[rgb(195_154_84/0.45)] px-[8px] py-[3px] text-[11px] text-gold-overline"
              >
                {sub}
              </span>
            ))}
          </span>
        ) : null}

        {/* Les ouvrages sont posés au fond de la niche, contre la tablette. */}
        {/* Les tranches sont à l'échelle de la niche : une niche de thème
            n'est pas un rayon d'apparat. */}
        <BookSpines books={item.books} scale={0.78} className="mt-auto pt-12" />
      </Link>

      {/* Tablette : le sol de la niche. Filet doré en nez, chant plus clair que
          le fond — la profondeur vient de la matière, pas d'une ombre. */}
      <div aria-hidden className="shrink-0">
        <div className="h-px bg-[rgb(195_154_84/0.55)]" />
        <div className="h-[9px] bg-walnut-700 tablet:h-[11px]" />
      </div>
    </div>
  );
}
