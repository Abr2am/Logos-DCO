import Image from 'next/image';

import { cn } from '@/lib/cn';

/*
 * L'EMBLÈME OFFICIEL, seul — sans le mot-marque.
 *
 * C'est la même image que celle de `BrandMark`, servie du même fichier : le
 * logo validé du diocèse, jamais redessiné, recoloré, filtré ni déformé.
 *
 * ⚠️ Seule la HAUTEUR est imposée ; la largeur reste `auto`, donc le rapport
 * d'aspect est exactement celui du fichier. Les attributs `width` / `height`
 * valent le double de la taille affichée : ils ne dimensionnent rien, ils
 * disent à `next/image` quelle définition servir — sans quoi l'emblème serait
 * servi à 1× et paraîtrait flou sur un écran à forte densité.
 *
 * Le fichier servi est rogné sur la boîte englobante du dessin : le centrage
 * est donc purement géométrique, et aucune translation de compensation n'est
 * appliquée.
 */

const SRC = '/brand/embleme-256.webp';

/** Rapport largeur / hauteur du DESSIN, mesuré sur le master : 964 × 907. */
export const EMBLEM_RATIO = 964 / 907;

export function Emblem({
  height,
  priority,
  className,
}: {
  /** Hauteur affichée, en pixels. */
  height: number;
  priority?: boolean;
  className?: string;
}) {
  const served = {
    height: height * 2,
    width: Math.round(height * 2 * EMBLEM_RATIO),
  };

  return (
    <Image
      src={SRC}
      alt=""
      aria-hidden
      width={served.width}
      height={served.height}
      priority={priority}
      className={cn('block shrink-0', className)}
      style={{ height, width: 'auto' }}
    />
  );
}
