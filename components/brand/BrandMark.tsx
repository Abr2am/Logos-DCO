import Image from 'next/image';

import { cn } from '@/lib/cn';

/*
 * EMBLÈME OFFICIEL + mot-marque.
 *
 * L'emblème remplace la pastille de rosace depuis le 23/09/2026 : c'est le
 * logo validé du diocèse, et il fait foi. Il est servi tel quel depuis
 * `public/brand/embleme-256.webp`, généré du master par `npm run assets:brand`.
 *
 * ⚠️ Le fichier n'est ni redessiné, ni redécoupé, ni recoloré, ni filtré.
 * Seule sa HAUTEUR est imposée ; la largeur reste `auto`, donc le rapport
 * d'aspect est exactement celui du fichier — il ne peut être ni déformé, ni
 * coupé, même si le master était remplacé par une version au cadrage
 * différent.
 *
 * ⚠️ Les attributs `width` / `height` valent le DOUBLE de la taille affichée :
 * ils ne dimensionnent rien (le style s'en charge), ils disent seulement à
 * `next/image` quelle définition servir. Sans cela, l'emblème serait servi à
 * 1× et paraîtrait flou sur un écran à forte densité.
 *
 * Le centrage dans son conteneur est purement géométrique — le fichier servi
 * est rogné sur la boîte englobante du dessin, donc aucune translation de
 * compensation n'est appliquée, et il ne faut pas en introduire.
 *
 * « Aucune autre déclinaison : pas de monogramme, pas de version sans
 * emblème, pas d'emblème seul en favicon inférieur à 22 px. »
 *
 * Le mot-marque est la seule exception à la règle « les titres Bodoni ne sont
 * jamais en capitales ». L'emblème ne le contient pas : il reste du texte.
 */

const SRC = '/brand/embleme-256.webp';

/** Rapport largeur / hauteur du DESSIN, mesuré sur le master : 964 × 907. */
const RATIO = 964 / 907;

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
  const height = spec.emblem;
  /* Définition servie : 2× la taille affichée, arrondie sur le rapport réel. */
  const served = { h: height * 2, w: Math.round(height * 2 * RATIO) };

  return (
    <span className={cn('inline-flex items-center', spec.gap, className)}>
      <Image
        src={SRC}
        alt=""
        aria-hidden
        width={served.w}
        height={served.h}
        priority
        className="block shrink-0"
        style={{ height, width: 'auto' }}
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
