import Link from 'next/link';

import { cn } from '@/lib/cn';

/*
 * 12,5 px, séparateur « › » doré, dernier niveau en 600 non cliquable.
 * En mobile, seuls les deux derniers niveaux sont affichés.
 */

export type Crumb = { label: string; href?: string };

export function Breadcrumb({
  items,
  tone = 'light',
}: {
  items: ReadonlyArray<Crumb>;
  /** `dark` = posé sur l'en-tête noyer d'une catégorie. */
  tone?: 'light' | 'dark';
}) {
  const hiddenBefore = Math.max(0, items.length - 2);

  return (
    <nav aria-label="Fil d'Ariane">
      <ol
        className={cn(
          'flex flex-wrap items-center gap-[7px] text-small',
          tone === 'light' ? 'text-help' : 'text-[rgb(249_244_234/0.65)]',
        )}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${index}`}
              className={cn(
                'items-center gap-[7px]',
                // Les niveaux intermédiaires sont masqués en mobile : seuls
                // les deux derniers sont affichés.
                index < hiddenBefore ? 'hidden tablet:flex' : 'flex',
              )}
            >
              {index > 0 ? (
                <span aria-hidden className="text-gold">
                  ›
                </span>
              ) : null}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    isLast && 'font-semibold',
                    isLast && (tone === 'light' ? 'text-text' : 'text-on-dark'),
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
