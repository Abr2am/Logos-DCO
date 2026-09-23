import Link from 'next/link';

import { cn } from '@/lib/cn';

/*
 * Niche de thème — une travée du rayonnage, pas une carte d'interface.
 *
 * Direction NOYER (23/09/2026) : les neuf thèmes ne sont plus une grille de
 * cartes génériques mais une composition de niches. Chaque niche est un
 * renfoncement ivoire, fermé en pied par une tablette noyer surmontée d'un
 * filet doré ; les niches d'une même rangée sont jointives, si bien que leurs
 * tablettes ne forment qu'une seule ligne — c'est le rayonnage.
 *
 * AUCUN compteur de ressources. Seule « Vie chrétienne » affiche ses trois
 * sous-thèmes.
 *
 * ⚠️ La composition en rangées appartient à `ThemeShelf` : cette niche ne
 * connaît que son propre contenu.
 */

export type ThemeCardProps = {
  name: string;
  href: string;
  /** Uniquement pour « Vie chrétienne ». */
  subthemes?: ReadonlyArray<string>;
  selected?: boolean;
};

export function ThemeCard({
  name,
  href,
  subthemes,
  selected = false,
}: ThemeCardProps) {
  return (
    <Link
      href={href}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'group flex h-full flex-col justify-between',
        'px-16 pb-[18px] pt-[17px] tablet:px-22 tablet:pb-22 tablet:pt-26',
        'transition-colors duration-[150ms] ease-logos',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-walnut-900',
        selected ? 'bg-walnut-900' : 'bg-surface hover:bg-theme-hover',
      )}
    >
      <span className="flex items-baseline justify-between gap-16">
        <span
          className={cn(
            'font-display text-[19px] leading-[1.2] tablet:text-[23px]',
            selected ? 'text-on-dark' : 'text-text',
          )}
        >
          {name}
        </span>
        <span
          aria-hidden
          className={cn(
            'shrink-0 transition-transform duration-[150ms] ease-logos',
            'group-hover:translate-x-[2px]',
            selected ? 'text-gold-overline' : 'text-gold',
          )}
        >
          →
        </span>
      </span>

      {subthemes && subthemes.length > 0 ? (
        <span className="mt-16 flex flex-wrap gap-[7px]">
          {subthemes.map((sub) => (
            <span
              key={sub}
              className={cn(
                'rounded-status border px-[9px] py-[4px] text-[11.5px]',
                selected
                  ? 'border-[rgb(249_244_234/0.3)] text-on-dark'
                  : 'border-[rgb(36_24_16/0.14)] text-text-secondary',
              )}
            >
              {sub}
            </span>
          ))}
        </span>
      ) : null}
    </Link>
  );
}
