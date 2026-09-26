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
  /* Le Design System cadre la rosace à 138-140 % du diamètre de la pastille.
     La taille intérieure est forcée à un nombre PAIR : avec une pastille de
     diamètre pair, le décalage de centrage `(size - inner) / 2` tombe alors
     sur un entier. Un demi-pixel suffit à faire paraître le motif décentré
     dans un cercle de 22 px. */
  const inner = Math.round((size * 1.4) / 2) * 2;

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full isolate',
        tone === 'walnut' ? 'bg-walnut-900' : 'bg-gold',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* ⚠️ AUCUNE correction de position — et c'est délibéré.
          Mesure du fichier source (`rosace-512.webp`, canal alpha) :
          barycentre à 254,47 / 253,91 pour un cadre de 512, soit −0,30 % et
          −0,41 %. Le motif EST centré dans son cadre. Le seul décentrage
          visible venait d'un `translate` posé le 23/09/2026 à partir d'une
          mesure faite sur la luminance SANS le canal alpha : elle pesait la
          densité d'encre, pas la géométrie. Le retirer recentre réellement le
          logo. Ne pas le réintroduire sans remesurer sur l'alpha. */}
      <Image
        src={SRC_SMALL}
        alt=""
        aria-hidden
        width={inner}
        height={inner}
        className="max-w-none mix-blend-luminosity"
        style={{ opacity: tone === 'walnut' ? 0.85 : 0.9 }}
      />
    </span>
  );
}

type RosaceHeroProps = {
  /**
   * Diamètre en pixels. **Omis**, la taille est portée par `className` — le
   * cas de l'accueil : la rosace y prend la HAUTEUR de sa section
   * (`h-full w-auto`), si bien que ses extrémités haute et basse ne sont
   * jamais coupées, quelle que soit la longueur du contenu.
   */
  size?: number;
  /** Opacité du filigrane. Très faible par principe. */
  opacity?: number;
  /**
   * Mode de fusion. `multiply` sur fond clair — le motif y creuse l'ivoire ;
   * `screen` sur aplat noyer — sans lui, un motif sombre sur un fond sombre
   * ne se voit pas.
   *
   * ⚠️ Le mode est porté par CE composant et par lui seul : deux classes
   * `mix-blend-*` sur un même élément ne s'ordonnent pas de façon fiable.
   */
  blend?: 'multiply' | 'screen';
  className?: string;
};

const BLEND: Record<'multiply' | 'screen', string> = {
  multiply: 'mix-blend-multiply',
  screen: 'mix-blend-screen',
};

/**
 * Usage 2 (hero) : une seule occurrence par écran.
 *
 * Élément ARCHITECTURAL d'arrière-plan : très agrandi, centre nettement
 * décalé vers la droite, opacité très faible. Il donne la géométrie copte de
 * la page sans jamais concurrencer le texte.
 *
 * Le motif est un disque TANGENT à son cadre (mesuré sur le canal alpha :
 * l'alpha couvre exactement 78 % du carré, soit π/4). Dimensionner la rosace
 * par sa hauteur suffit donc à garantir qu'aucune extrémité n'est coupée : le
 * débordement ne peut avoir lieu que sur les côtés.
 *
 * Le motif est centré dans son cadre : aucune correction de position n'est
 * appliquée.
 *
 * « L'utilisateur doit la ressentir avant de l'identifier. »
 */
export function RosaceHero({
  size,
  opacity = 0.07,
  blend = 'multiply',
  className,
}: RosaceHeroProps) {
  return (
    <Image
      src={SRC_MEDIUM}
      alt=""
      aria-hidden
      /* Dimensions intrinsèques : elles ne fixent que le rapport d'aspect
         lorsque la taille vient de `className`. */
      width={size ?? 512}
      height={size ?? 512}
      priority
      className={cn(
        'pointer-events-none max-w-none select-none',
        BLEND[blend],
        className,
      )}
      style={
        size === undefined
          ? { opacity }
          : { width: size, height: size, opacity }
      }
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
