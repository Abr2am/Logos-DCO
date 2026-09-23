import { cn } from '@/lib/cn';

import { RosacePastille } from './Rosace';

/*
 * Pastille de rosace + mot-marque.
 *
 * « Aucune autre déclinaison : pas de monogramme, pas de version sans
 * pastille, pas de rosace seule en favicon inférieur à 22 px. »
 *
 * Le mot-marque est la seule exception à la règle « les titres Bodoni ne sont
 * jamais en capitales ».
 */

type BrandMarkSize = 'sm' | 'md' | 'hero';

const SIZES: Record<
  BrandMarkSize,
  { pastille: number; word: string; gap: string; tracking: string }
> = {
  // Mobile : pastille 22 px, mot-marque 21 px.
  sm: {
    pastille: 22,
    word: 'text-[21px]',
    gap: 'gap-[9px]',
    tracking: '0.14em',
  },
  // Desktop : pastille 26 px, mot-marque 25 px.
  md: {
    pastille: 26,
    word: 'text-[25px]',
    gap: 'gap-[11px]',
    tracking: '0.14em',
  },
  // Hero : pastille 46-52 px, interlettrage 0,3 em.
  hero: {
    pastille: 52,
    word: 'text-[44px]',
    gap: 'gap-[18px]',
    tracking: '0.3em',
  },
};

type BrandMarkProps = {
  size?: BrandMarkSize;
  /** `dark` = posé sur fond noyer : pastille dorée et mot-marque ivoire. */
  tone?: 'light' | 'dark';
  className?: string;
};

export function BrandMark({
  size = 'md',
  tone = 'light',
  className,
}: BrandMarkProps) {
  const spec = SIZES[size];

  return (
    <span className={cn('inline-flex items-center', spec.gap, className)}>
      <RosacePastille
        size={spec.pastille}
        tone={tone === 'light' ? 'walnut' : 'gold'}
      />
      <span
        className={cn(
          'font-display uppercase leading-none',
          spec.word,
          tone === 'light' ? 'text-text' : 'text-on-dark',
        )}
        style={{ letterSpacing: spec.tracking }}
      >
        Logos
      </span>
    </span>
  );
}
