import Link from 'next/link';

import { ArabesqueArch, ArabesqueFrieze } from '@/components/brand/Arabesque';
import { cn } from '@/lib/cn';

/*
 * Façade de bibliothèque — un meuble en noyer, pas une grille de cartes.
 *
 * ── Comment le meuble tient debout ──────────────────────────────────────────
 * La CARCASSE est le fond de la grille, en `walnut-700`. Les NICHES sont des
 * cellules opaques en `walnut-900` — plus sombre que la carcasse : c'est ce
 * contraste de matière, et non une ombre portée, qui creuse le renfoncement.
 * Les MONTANTS sont les gouttières verticales de la grille : la carcasse y
 * transparaît, exactement entre deux niches, à tous les paliers et sans une
 * seule règle conditionnelle.
 *
 * Chaque niche est couronnée d'un ARC BRISÉ et fermée en pied par une
 * TABLETTE. Une FRISE de losanges court en corniche et en socle.
 *
 * Une rangée incomplète laisse voir la carcasse : une travée fermée, en bois
 * plein. C'est un meuble, pas une grille trouée.
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
};

type Layout = 'themes' | 'subthemes';

const GRID: Record<Layout, string> = {
  themes: 'tablet:grid-cols-2 desktop:grid-cols-3',
  subthemes: 'tablet:grid-cols-3',
};

export function Bookcase({
  items,
  layout = 'themes',
  friezeId,
  className,
}: {
  items: ReadonlyArray<NicheItem>;
  layout?: Layout;
  /** Identifiant du motif de frise — unique par meuble sur une page. */
  friezeId: string;
  className?: string;
}) {
  return (
    <div
      className={cn('overflow-hidden rounded-none bg-walnut-700', className)}
    >
      {/* Corniche */}
      <div className="h-[18px] tablet:h-[22px]">
        <ArabesqueFrieze id={`${friezeId}-corniche`} />
      </div>

      {/* Les gouttières verticales SONT les montants : la carcasse y
          transparaît. Aucune gouttière horizontale — chaque niche porte sa
          propre tablette, qui la ferme exactement. */}
      <ul className={cn('grid gap-x-[14px] tablet:gap-x-[18px]', GRID[layout])}>
        {items.map((item) => (
          <li key={item.key} className="flex flex-col">
            <Niche item={item} />
          </li>
        ))}
      </ul>

      {/* Socle */}
      <div className="h-[18px] tablet:h-[22px]">
        <ArabesqueFrieze id={`${friezeId}-socle`} />
      </div>
    </div>
  );
}

function Niche({ item }: { item: NicheItem }) {
  return (
    /* Piédroits : deux filets dorés très pâles ferment l'ouverture sur les
       côtés. C'est ce qui fait lire une NICHE ENCADRÉE plutôt qu'une simple
       bande sombre. */
    <div className="flex flex-1 flex-col border-x border-[rgb(195_154_84/0.14)] bg-walnut-900">
      {/* Arc surbaissé : le fond de niche se découpe en négatif dans le mur. */}
      <ArabesqueArch className="h-[34px] shrink-0 tablet:h-[44px]" />

      <Link
        href={item.href}
        aria-current={item.selected ? 'page' : undefined}
        className={cn(
          'group flex flex-1 flex-col justify-between',
          'px-16 pb-22 pt-12 tablet:px-22 tablet:pb-26',
          'transition-colors duration-[150ms] ease-logos',
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold',
          item.selected ? 'bg-[rgb(195_154_84/0.12)]' : 'hover:bg-walnut-700',
        )}
      >
        <span className="flex items-baseline justify-between gap-16">
          <span className="font-display text-[19px] leading-[1.2] text-on-dark tablet:text-[23px]">
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
          <span className="mt-16 flex flex-wrap gap-[7px]">
            {item.subthemes.map((sub) => (
              <span
                key={sub}
                className="rounded-status border border-[rgb(195_154_84/0.45)] px-[9px] py-[4px] text-[11.5px] text-gold-overline"
              >
                {sub}
              </span>
            ))}
          </span>
        ) : null}
      </Link>

      {/* Tablette : le sol de la niche. Filet doré en arête, chant plus clair
          que le fond — la profondeur vient de la matière, pas d'une ombre. */}
      <div aria-hidden className="shrink-0">
        <div className="h-px bg-[rgb(195_154_84/0.55)]" />
        <div className="h-[9px] bg-walnut-700 tablet:h-[11px]" />
      </div>
    </div>
  );
}
