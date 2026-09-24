import Link from 'next/link';

import { cn } from '@/lib/cn';

/*
 * LE MEUBLE — les neuf thèmes installés dans leurs niches.
 *
 * Employé par l'accueil ET par `/bibliotheque` : c'est le même meuble, donc
 * le même composant. Toute modification ici se voit sur les deux pages —
 * vérifier les deux.
 *
 * ── La menuiserie est un ASSET, pas du CSS ──────────────────────────────────
 * Le meuble vient des deux fichiers validés : `bookcase-horizontal` en
 * tablette et desktop, `bookcase-vertical` en mobile. Les deux compositions
 * sont volontairement différentes — on ne fait pas rentrer l'une dans l'autre.
 * Rien n'est redessiné ici.
 *
 * ── Comment les thèmes tiennent DANS les niches ─────────────────────────────
 * L'image est l'élément de flux : sa hauteur suit sa propre largeur, donc le
 * bloc se met à l'échelle tout seul. Les thèmes sont posés par-dessus en
 * POURCENTAGES de cette boîte — mesurés une fois sur les fichiers — si bien
 * qu'ils restent dans leurs niches à toutes les largeurs, sans point de
 * rupture supplémentaire et sans JavaScript.
 *
 * ── Pourquoi `<picture>` et non `next/image` ────────────────────────────────
 * Deux fichiers pour deux compositions : `<source media>` est le seul moyen
 * de n'en télécharger QU'UN. Deux `next/image` superposés en `hidden` seraient
 * tous deux chargés. Les fichiers sont déjà en WebP et pèsent ~95 Kio.
 */

export type BookcaseTheme = {
  slug: string;
  name: string;
  href: string;
  /** Uniquement « Vie chrétienne » en porte. */
  subthemes: ReadonlyArray<string>;
};

/* ── Géométrie intérieure des meubles, en % de l'image ────────────────────── */

/**
 * Meuble horizontal (1987 × 801) : deux tablettes, 5 thèmes puis 4.
 *
 * La seconde rangée n'est PAS à colonnes égales : « Vie chrétienne » porte
 * trois sous-thèmes et « Formation des serviteurs » un nom long — la maquette
 * leur donne plus de place qu'à « Saints » et « Divers ».
 */
const WIDE = {
  left: 11.4,
  width: 77.2,
  rows: [
    { top: 21, height: 23, count: 5, template: 'repeat(5, minmax(0, 1fr))' },
    { top: 55.5, height: 22, count: 4, template: '0.95fr 1.5fr 1.3fr 0.9fr' },
  ],
} as const;

/** Meuble vertical (1003 × 1484) : cinq tablettes. */
const TALL = {
  left: 18.6,
  width: 62.8,
  rows: [
    { top: 11.4, height: 10.6 },
    { top: 28.8, height: 10.6 },
    { top: 46.2, height: 10.4 },
    { top: 63.4, height: 10.2 },
    { top: 80.6, height: 10.6 },
  ],
} as const;

/**
 * Répartition mobile, reprise de la maquette : deux thèmes par tablette, sauf
 * « Vie chrétienne » — la septième — qui occupe la sienne à elle seule, ses
 * trois sous-thèmes en demandant la place.
 */
const TALL_ROWS: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6],
  [7, 8],
];

export function ThemeBookcase({
  themes,
  className,
}: {
  themes: ReadonlyArray<BookcaseTheme>;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <picture>
        <source
          media="(min-width: 640px)"
          srcSet="/home/bookcase-horizontal.webp"
          width={1987}
          height={801}
        />
        {/* `<img>` volontaire : `next/image` ne sait pas porter deux
            compositions distinctes derrière `<source media>`. */}
        <img
          src="/home/bookcase-vertical.webp"
          width={1003}
          height={1484}
          alt=""
          aria-hidden
          className="block h-auto w-full select-none"
        />
      </picture>

      {/* Mobile — cinq tablettes */}
      <div className="tablet:hidden">
        {TALL.rows.map((row, index) => {
          const indexes = TALL_ROWS[index] ?? [];
          const items = indexes
            .map((position) => themes[position])
            .filter((theme): theme is BookcaseTheme => theme !== undefined);
          if (items.length === 0) return null;

          return (
            <Shelf
              key={row.top}
              left={TALL.left}
              width={TALL.width}
              top={row.top}
              height={row.height}
              template={`repeat(${items.length}, minmax(0, 1fr))`}
              themes={items}
              compact
            />
          );
        })}
      </div>

      {/* Tablette et desktop — deux tablettes, 5 puis 4 */}
      <div className="hidden tablet:block">
        {WIDE.rows.map((row, index) => {
          const start = index === 0 ? 0 : WIDE.rows[0]!.count;
          const items = themes.slice(start, start + row.count);
          if (items.length === 0) return null;

          return (
            <Shelf
              key={row.top}
              left={WIDE.left}
              width={WIDE.width}
              top={row.top}
              height={row.height}
              template={row.template}
              themes={items}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Une tablette : ses thèmes, répartis en colonnes égales dans la niche. */
function Shelf({
  left,
  width,
  top,
  height,
  template,
  themes,
  compact,
}: {
  left: number;
  width: number;
  top: number;
  height: number;
  /** `grid-template-columns` de la rangée. */
  template: string;
  themes: ReadonlyArray<BookcaseTheme>;
  compact?: boolean;
}) {
  return (
    <ul
      className={cn(
        'absolute grid',
        compact ? 'gap-[6px]' : 'gap-[10px] desktop:gap-[14px]',
      )}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top: `${top}%`,
        height: `${height}%`,
        gridTemplateColumns: template,
      }}
    >
      {themes.map((theme) => (
        <li key={theme.slug} className="min-w-0">
          <ThemeCard theme={theme} compact={compact} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Le thème lui-même : un cartel d'ivoire posé au fond de la niche, cerné d'un
 * filet doré. Pas une carte flottante — il remplit son alvéole.
 */
function ThemeCard({
  theme,
  compact,
}: {
  theme: BookcaseTheme;
  compact?: boolean;
}) {
  return (
    <Link
      href={theme.href}
      className={cn(
        'flex h-full flex-col justify-between rounded-control',
        'border border-[rgb(195_154_84/0.55)] bg-surface',
        'transition-colors duration-[150ms] ease-logos',
        'hover:border-walnut-700 hover:bg-cover-plate',
        'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-walnut-900',
        compact
          ? 'px-[7px] py-[5px]'
          : 'px-12 py-[9px] tablet:px-12 desktop:px-16 desktop:py-12',
      )}
    >
      <span className="flex items-start justify-between gap-[6px]">
        <span
          className={cn(
            'font-display leading-[1.12] text-text',
            compact
              ? 'text-[11px]'
              : 'text-[12.5px] desktop:text-[19px] desktop:leading-[1.15]',
          )}
        >
          {theme.name}
        </span>
        <span
          aria-hidden
          className={cn(
            'shrink-0 leading-none text-walnut-700',
            compact ? 'text-[10px]' : 'text-[11px] desktop:text-[13px]',
          )}
        >
          →
        </span>
      </span>

      {theme.subthemes.length > 0 ? (
        <>
          {/* Pastilles — mobile et desktop, là où la niche est assez large.
              ⚠️ Une seule classe d'affichage de base : `hidden` puis
              `desktop:flex`. Deux classes réglant `display` sur un même
              élément ne s'ordonnent pas de façon fiable. */}
          <span
            className={cn(
              'flex-wrap items-end',
              compact
                ? 'flex gap-[4px]'
                : 'hidden gap-[6px] desktop:flex desktop:gap-[7px]',
            )}
          >
            {theme.subthemes.map((sub) => (
              <span
                key={sub}
                className={cn(
                  'whitespace-nowrap rounded-status border border-line text-text-secondary',
                  compact
                    ? 'px-[4px] py-px text-[8.5px]'
                    : 'px-[7px] py-[2px] text-[11px]',
                )}
              >
                {sub}
              </span>
            ))}
          </span>

          {/* Tablette : la niche est trop étroite pour trois pastilles — la
              maquette y met une seule ligne à points médians. */}
          {compact ? null : (
            <span className="hidden truncate text-[8.5px] leading-[1.3] text-text-secondary tablet:block desktop:hidden">
              {theme.subthemes.join(' · ')}
            </span>
          )}
        </>
      ) : null}
    </Link>
  );
}
