import Link from 'next/link';

import { cn } from '@/lib/cn';

/*
 * Carte de thème. AUCUN compteur de ressources.
 * Seule « Vie chrétienne » affiche ses trois sous-thèmes.
 *
 * En mobile, la carte devient une ligne de liste.
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
        'block rounded-control border border-l-[3px] px-16 py-[15px]',
        'transition-colors duration-[150ms] ease-logos',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy',
        'tablet:px-22 tablet:py-26',
        selected
          ? 'border-burgundy border-l-gold bg-burgundy'
          : 'border-line border-l-walnut-700 bg-surface hover:border-[rgb(36_24_16/0.2)] hover:bg-theme-hover',
      )}
    >
      <span className="flex items-center justify-between gap-16">
        <span
          className={cn(
            'font-display text-[19px] tablet:text-[23px]',
            selected ? 'text-on-dark' : 'text-text group-hover:text-burgundy',
          )}
        >
          {name}
        </span>
        <span
          aria-hidden
          className={cn(selected ? 'text-gold-overline' : 'text-gold')}
        >
          →
        </span>
      </span>
      {subthemes && subthemes.length > 0 ? (
        <span className="mt-12 flex flex-wrap gap-[7px]">
          {subthemes.map((sub) => (
            <span
              key={sub}
              className={cn(
                'rounded-status border px-[9px] py-[4px] text-[11.5px]',
                selected
                  ? 'border-[rgb(249_244_234/0.3)] text-on-dark'
                  : 'border-[rgb(36_24_16/0.14)] text-text',
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
