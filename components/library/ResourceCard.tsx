import Link from 'next/link';

import { cn } from '@/lib/cn';
import type { CoverFamily } from '@/lib/cover/families';

import { ResourceCover } from './ResourceCover';

/*
 * Un ouvrage posé sur la tablette.
 *
 * Direction NOYER (23/09/2026) : AUCUNE carte blanche autour de la
 * couverture. Le lien n'a ni fond, ni bordure, ni rayon — la couverture 3:4
 * est l'objet, le titre et la ligne de métadonnées la légendent.
 *
 * « Rien d'autre : ni auteur, ni date, ni public, ni flags, ni bouton —
 *   la zone cliquable est l'ouvrage entier. »
 *
 * Survol : l'ouvrage se soulève de 2 px, l'ombre — déjà très légère —
 * s'ouvre à peine.
 */

export type ResourceCardProps = {
  href: string;
  title: string;
  category: string;
  family: CoverFamily;
  /** `type · format · pagination` — la pagination est omise si inconnue. */
  meta: string;
  className?: string;
};

export function ResourceCard({
  href,
  title,
  category,
  family,
  meta,
  className,
}: ResourceCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900',
        className,
      )}
    >
      <ResourceCover
        category={category}
        title={title}
        family={family}
        className={cn(
          'transition-[transform,box-shadow] duration-[150ms] ease-logos',
          'group-hover:-translate-y-[2px] group-hover:shadow-cover-hover',
        )}
      />
      <p className="mt-16 text-[13.5px] font-medium leading-[1.35] tablet:text-[14.5px]">
        {title}
      </p>
      <p className="mt-[5px] text-[12px] text-help">{meta}</p>
    </Link>
  );
}
