import Link from 'next/link';

import { cn } from '@/lib/cn';
import type { CoverFamily } from '@/lib/cover/families';

import { ResourceCover } from './ResourceCover';

/*
 * Carte ressource : couverture 3:4, titre, puis UNE SEULE ligne de
 * métadonnées `type · format · pagination`.
 *
 * « Rien d'autre : ni auteur, ni date, ni public, ni flags, ni bouton —
 *   la carte entière est la zone cliquable. »
 *
 * Hover : la couverture monte de 2 px et l'ombre s'ouvre.
 * Pas d'ombre sur la carte elle-même.
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
        'group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy',
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
      <p className="mt-12 text-[13.5px] font-medium tablet:text-[14px]">
        {title}
      </p>
      <p className="mt-[3px] text-[12px] text-help">{meta}</p>
    </Link>
  );
}
