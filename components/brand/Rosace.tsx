import Image from 'next/image';

import { cn } from '@/lib/cn';

/*
 * La rosace n'a que QUATRE usages autorisés par le Design System :
 *   1. marque       — pastille circulaire 22-40 px
 *   2. hero         — une seule occurrence par écran, ≥ 200 px
 *   3. couverture   — filigrane ≤ 26 %, au plus 1 couverture sur 5
 *   4. état vide    — pastille dorée de 34 px, une fois
 *
 * Interdits : déformation, recadrage en fragment, redessin, motif répété,
 * usage comme icône fonctionnelle, rotation, contour tracé, mono-trait.
 *
 * Ce module n'expose que ces usages. Il n'y a volontairement aucun composant
 * « rosace générique » : toute nouvelle utilisation exigerait de modifier le
 * Design System, pas ce fichier.
 */

const SRC_SMALL = '/brand/rosace-128.webp';
const SRC_MEDIUM = '/brand/rosace-512.webp';
const SRC_LARGE = '/brand/rosace-1280.webp';

type PastilleTone = 'burgundy' | 'gold';

type RosacePastilleProps = {
  /** Diamètre en pixels. 22 mobile · 26 desktop · 34 état vide · 46-52 hero. */
  size?: number;
  /** Bordeaux sur fond clair, doré sur fond noyer. */
  tone?: PastilleTone;
  className?: string;
};

/**
 * Usages 1 (marque) et 4 (état vide) : rosace tramée en luminosité dans une
 * pastille circulaire. C'est la seule forme totalement arrondie du système.
 */
export function RosacePastille({
  size = 26,
  tone = 'burgundy',
  className,
}: RosacePastilleProps) {
  // Le Design System cadre la rosace à 138-140 % du diamètre de la pastille.
  const inner = Math.round(size * 1.4);

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full isolate',
        tone === 'burgundy' ? 'bg-burgundy' : 'bg-gold',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={SRC_SMALL}
        alt=""
        aria-hidden
        width={inner}
        height={inner}
        className="max-w-none mix-blend-luminosity"
        style={{ opacity: tone === 'burgundy' ? 0.85 : 0.9 }}
      />
    </span>
  );
}

type RosaceHeroProps = {
  /**
   * Desktop : 1180 px en `multiply` à 10-12 % sur ivoire, débordant du cadre.
   * Mobile : 420 px en `luminosity` à 30 % sur panneau noyer.
   */
  variant: 'desktop' | 'mobile';
  className?: string;
};

/**
 * Usage 2 (hero) : une seule occurrence par écran. Le positionnement
 * (débordement, ancrage) appartient à la page ; ce composant fixe la taille,
 * le mode de fusion et l'opacité.
 *
 * « L'utilisateur doit la ressentir avant de l'identifier. »
 */
export function RosaceHero({ variant, className }: RosaceHeroProps) {
  const desktop = variant === 'desktop';
  const size = desktop ? 1180 : 420;

  return (
    <Image
      src={desktop ? SRC_LARGE : SRC_MEDIUM}
      alt=""
      aria-hidden
      width={size}
      height={size}
      priority
      className={cn(
        'pointer-events-none max-w-none select-none',
        desktop ? 'mix-blend-multiply' : 'mix-blend-luminosity',
        className,
      )}
      style={{ opacity: desktop ? 0.11 : 0.3 }}
    />
  );
}

/**
 * Usage 3 (couverture) : filigrane en luminosité, opacité 26 %, partiellement
 * hors cadre. Au plus une couverture sur cinq dans une grille.
 *
 * Réservé à `ResourceCover` (famille « motif »).
 */
export function RosaceCoverWatermark() {
  return (
    <Image
      src={SRC_MEDIUM}
      alt=""
      aria-hidden
      width={512}
      height={512}
      className="pointer-events-none absolute bottom-[-44%] left-[-16%] w-[200%] max-w-none select-none mix-blend-luminosity opacity-[.26]"
    />
  );
}
