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
/* `rosace-1280.webp` n'est plus employée : le hero est désormais discret et
   n'a plus besoin d'un rendu de 1180 px. Le fichier reste disponible. */

type PastilleTone = 'walnut' | 'gold';

type RosacePastilleProps = {
  /** Diamètre en pixels. 22 mobile · 26 desktop · 34 état vide · 46-52 hero. */
  size?: number;
  /** Noyer sur fond clair, doré sur fond noyer. */
  tone?: PastilleTone;
  className?: string;
};

/**
 * Usages 1 (marque) et 4 (état vide) : rosace tramée en luminosité dans une
 * pastille circulaire. C'est la seule forme totalement arrondie du système.
 */
export function RosacePastille({
  size = 26,
  tone = 'walnut',
  className,
}: RosacePastilleProps) {
  // Le Design System cadre la rosace à 138-140 % du diamètre de la pastille.
  const inner = Math.round(size * 1.4);

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full isolate',
        tone === 'walnut' ? 'bg-walnut-900' : 'bg-gold',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* ⚠️ RECENTRAGE. Le centre de masse du motif d'origine n'est pas son
          centre géométrique : il est décalé de +0,82 % en x et de −1,38 % en y
          (mesuré sur `rosace-512.webp`). Sans cette correction, la rosace
          paraît légèrement haute et à droite dans sa pastille. */}
      <Image
        src={SRC_SMALL}
        alt=""
        aria-hidden
        width={inner}
        height={inner}
        className="max-w-none mix-blend-luminosity"
        style={{
          opacity: tone === 'walnut' ? 0.85 : 0.9,
          transform: `translate(${-0.82 * inner * 0.01}px, ${1.38 * inner * 0.01}px)`,
        }}
      />
    </span>
  );
}

type RosaceHeroProps = {
  /** Diamètre en pixels. Le hero de l'accueil l'emploie autour de 300-420 px. */
  size?: number;
  className?: string;
};

/**
 * Usage 2 (hero) : une seule occurrence par écran.
 *
 * Direction NOYER (23/09/2026) : la rosace est DISCRÈTE et ne domine plus
 * l'écran. Elle est rendue ENTIÈRE — jamais recadrée, jamais coupée par un
 * bord —, en multiplication à 9 % sur l'ivoire. C'est un élément architectural
 * ponctuel, pas un décor de fond.
 *
 * « L'utilisateur doit la ressentir avant de l'identifier. »
 */
export function RosaceHero({ size = 360, className }: RosaceHeroProps) {
  return (
    <Image
      src={SRC_MEDIUM}
      alt=""
      aria-hidden
      width={size}
      height={size}
      priority
      className={cn(
        'pointer-events-none max-w-none select-none mix-blend-multiply',
        className,
      )}
      style={{
        width: size,
        height: size,
        opacity: 0.09,
        /* Même recentrage que la pastille : le motif n'est pas centré dans
           son cadre d'origine. */
        transform: `translate(${-0.82 * size * 0.01}px, ${1.38 * size * 0.01}px)`,
      }}
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
