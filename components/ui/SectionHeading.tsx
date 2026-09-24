import Link from 'next/link';

import { cn } from '@/lib/cn';

/*
 * Titre Bodoni à gauche, lien tertiaire optionnel à droite sur la même ligne
 * de base. Pas de filet SOUS le titre, pas de surtitre monospace en accueil.
 *
 * Direction architecturale (23/09/2026) : un montant doré de 3 px précède le
 * titre. C'est la même arête que celle qui court en nez de tablette et en
 * corniche — le doré ponctue la structure, il ne décore pas.
 */
export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string;
  /**
   * Lien tertiaire. `short` porte le libellé court des petits écrans, où le
   * libellé complet ferait passer le titre à la ligne ; `short: null` retire
   * le lien sous 1024 px, comme la maquette de l'accueil.
   */
  action?: { label: string; href: string; short?: string | null };
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-baseline justify-between gap-16', className)}
    >
      <h2 className="flex items-center gap-12 font-display text-h2-mobile tablet:text-h2">
        <span
          aria-hidden
          className="block h-[21px] w-[3px] shrink-0 bg-gold tablet:h-[28px]"
        />
        {title}
      </h2>
      {action ? (
        <Link
          href={action.href}
          className={cn(
            'shrink-0 text-[13px] font-semibold text-walnut-900 underline-offset-4',
            'hover:text-walnut-700 hover:underline',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900',
            action.short === null && 'hidden desktop:block',
          )}
        >
          {action.short ? (
            <>
              <span className="desktop:hidden">{action.short}</span>
              <span className="hidden desktop:inline">{action.label}</span>
            </>
          ) : (
            action.label
          )}{' '}
          →
        </Link>
      ) : null}
    </div>
  );
}
