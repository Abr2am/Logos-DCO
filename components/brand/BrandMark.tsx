import { cn } from '@/lib/cn';

import { Emblem } from './Emblem';

/*
 * EMBLÈME OFFICIEL + mot-marque.
 *
 * L'emblème remplace la pastille de rosace depuis le 23/09/2026 : c'est le
 * logo validé du diocèse, et il fait foi. Il est servi tel quel depuis
 * `public/brand/embleme-256.webp`, généré du master par `npm run assets:brand`.
 *
 * L'image elle-même vit dans `Emblem` : mêmes règles, un seul endroit — le
 * fichier n'y est ni redessiné, ni recoloré, ni déformé, et son centrage est
 * purement géométrique.
 *
 * « Aucune autre déclinaison : pas de monogramme, pas de version sans
 * emblème, pas d'emblème seul en favicon inférieur à 22 px. »
 *
 * Le mot-marque est la seule exception à la règle « les titres Bodoni ne sont
 * jamais en capitales ». L'emblème ne le contient pas : il reste du texte.
 */

type BrandMarkSize = 'sm' | 'md' | 'hero';

const SIZES: Record<
  BrandMarkSize,
  { emblem: number; word: string; gap: string; tracking: string }
> = {
  // Mobile : emblème 26 px de haut, mot-marque 21 px.
  sm: {
    emblem: 26,
    word: 'text-[21px]',
    gap: 'gap-[10px]',
    tracking: '0.14em',
  },
  // Desktop : emblème 32 px, mot-marque 25 px.
  md: {
    emblem: 32,
    word: 'text-[25px]',
    gap: 'gap-[12px]',
    tracking: '0.14em',
  },
  // Hero : emblème 58 px, interlettrage 0,3 em.
  hero: {
    emblem: 58,
    word: 'text-[44px]',
    gap: 'gap-[20px]',
    tracking: '0.3em',
  },
};

type BrandMarkProps = {
  size?: BrandMarkSize;
  /** `dark` = posé sur fond noyer : le mot-marque passe en ivoire. */
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
      <Emblem height={spec.emblem} priority />
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
