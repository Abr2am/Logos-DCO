import Image from 'next/image';

import { RosaceCoverWatermark } from '@/components/brand/Rosace';
import { cn } from '@/lib/cn';
import type { CoverFamily } from '@/lib/cover/families';

/*
 * Couverture générative — calculée depuis la catégorie (surtitre), le titre
 * et un index stable. Aucune illustration, aucune image téléversée.
 *
 * Invariants : ratio 3:4, angles vifs, tranche gauche 7 px (9 px en fiche),
 * surtitre monospace 7,5-8 px à 0,2 em, titre Bodoni sur 4 lignes maximum,
 * un filet de clôture, ombre `cover`. Jamais cadre ET ombre renforcée.
 *
 * ⚠️ Une famille ne représente JAMAIS une catégorie : aucune correspondance
 * couleur ↔ thème. La catégorie n'est exprimée que par le texte.
 */

type CoverVariant = 'grid' | 'detail';

type FamilySpec = {
  plate: string;
  spine: string;
  shadow: string;
  overline: string;
  title: string;
  /** Cadre intérieur en retrait — absent de la famille « minimal ». */
  frame?: string;
  rule: string;
};

const FAMILIES: Record<CoverFamily, FamilySpec> = {
  burgundy: {
    plate: 'bg-burgundy',
    spine: 'border-l-cover-spine',
    shadow: 'shadow-[0_8px_20px_rgb(46_30_21/0.2)]',
    overline: 'text-gold-overline',
    title: 'text-on-dark',
    frame: 'border-[rgb(195_154_84/0.6)]',
    rule: 'bg-[rgb(195_154_84/0.75)]',
  },
  ivory: {
    plate: 'bg-surface border border-[rgb(36_24_16/0.18)]',
    spine: 'border-l-cover-edge',
    shadow: 'shadow-[0_8px_20px_rgb(46_30_21/0.14)]',
    overline: 'text-burgundy',
    title: 'text-text',
    frame: 'border-[rgb(110_27_42/0.35)]',
    rule: 'bg-[rgb(110_27_42/0.45)]',
  },
  walnut: {
    plate: 'bg-walnut-900',
    spine: 'border-l-[#241710]',
    shadow: 'shadow-[0_8px_20px_rgb(46_30_21/0.28)]',
    overline: 'text-gold-overline',
    title: 'text-on-dark',
    frame:
      'border-[rgb(195_154_84/0.5)] bg-[linear-gradient(rgb(46_30_21/0.55),rgb(46_30_21/0.8))]',
    rule: 'bg-[rgb(195_154_84/0.7)]',
  },
  motif: {
    plate: 'bg-burgundy',
    spine: 'border-l-cover-spine',
    shadow: 'shadow-[0_8px_20px_rgb(46_30_21/0.2)]',
    overline: 'text-gold-overline',
    title: 'text-on-dark',
    frame: 'border-[rgb(195_154_84/0.6)]',
    rule: 'bg-[rgb(195_154_84/0.75)]',
  },
  minimal: {
    plate: 'bg-cover-plate border border-[rgb(36_24_16/0.14)]',
    spine: 'border-l-walnut-700',
    shadow: 'shadow-[0_8px_20px_rgb(46_30_21/0.12)]',
    overline: 'text-burgundy',
    title: 'text-text',
    rule: 'bg-[rgb(36_24_16/0.25)]',
  },
};

export type ResourceCoverProps = {
  /** Surtitre : nom de la catégorie. Seule expression du thème. */
  category: string;
  title: string;
  family: CoverFamily;
  variant?: CoverVariant;
  className?: string;
};

export function ResourceCover({
  category,
  title,
  family,
  variant = 'grid',
  className,
}: ResourceCoverProps) {
  const spec = FAMILIES[family];
  const detail = variant === 'detail';

  const overline = (
    <span
      className={cn(
        'font-mono font-medium uppercase',
        detail ? 'text-[8px]' : 'text-[7.5px]',
        spec.overline,
      )}
      style={{ letterSpacing: '0.2em' }}
    >
      {category}
    </span>
  );

  const heading = (
    <span
      className={cn(
        'line-clamp-4 font-display leading-[1.15]',
        detail ? 'text-cover-detail' : 'text-cover-mobile tablet:text-cover',
        spec.title,
      )}
    >
      {title}
    </span>
  );

  const rule = <span aria-hidden className={cn('h-px w-full', spec.rule)} />;

  return (
    <div
      className={cn(
        'relative isolate flex aspect-[3/4] overflow-hidden rounded-none',
        detail ? 'border-l-[9px]' : 'border-l-[7px]',
        spec.plate,
        spec.spine,
        spec.shadow,
        className,
      )}
    >
      {family === 'walnut' ? (
        <Image
          src="/brand/marqueterie-368.webp"
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 640px) 50vw, 340px"
          className="object-cover opacity-30"
        />
      ) : null}
      {family === 'motif' ? <RosaceCoverWatermark /> : null}

      {family === 'minimal' ? (
        <div className="relative flex flex-1 flex-col justify-end px-16 py-[18px]">
          {overline}
          <span className="mt-[10px]">{heading}</span>
          <span className="mt-12">{rule}</span>
        </div>
      ) : (
        <div
          className={cn(
            'relative m-[11px] flex flex-1 flex-col justify-between border px-[14px] py-[18px] text-center',
            spec.frame,
          )}
        >
          {overline}
          {heading}
          {rule}
        </div>
      )}
    </div>
  );
}
