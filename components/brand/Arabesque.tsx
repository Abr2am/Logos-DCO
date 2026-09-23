import { cn } from '@/lib/cn';

/*
 * Menuiserie copte — la géométrie, et rien d'autre.
 *
 * Ces tracés dérivent de la rosace : étoile à douze branches, losanges
 * entrelacés, arcs, grecques. Ils sont **géométriques, fins et élégants**,
 * jamais figuratifs. Aucune croix, aucune icône, aucun objet liturgique :
 * l'identité doit rester reconnaissable une fois tout symbole retiré.
 *
 * ⚠️ Aucun de ces motifs ne sert de TEXTURE DE FOND. Chacun est une pièce
 * d'architecture — un arc au-dessus d'une niche, une frise de corniche, une
 * grecque de socle, un claustra de montant — et s'étire exactement sur la
 * pièce qu'il habille.
 *
 * 80 % contemporain / 20 % héritage copte : le patrimoine passe par la
 * géométrie des ouvrages, pas par leur accumulation.
 *
 * ⚠️ Chaque motif répété (`<pattern>`) exige un `id` UNIQUE dans la page :
 * deux frises partageant un identifiant se marcheraient dessus.
 */

/**
 * Arc surbaissé couronnant une niche.
 *
 * Une niche large se couvre d'un arc surbaissé, pas d'un plein cintre — qui,
 * étiré, ne serait plus qu'une ondulation. Les reins montent vite depuis les
 * piédroits, le sommet reste tendu.
 *
 * Le tracé remplit l'écoinçon — la matière AU-DESSUS de l'arc — de sorte que
 * l'ouverture se découpe en négatif dans le mur. Étiré horizontalement
 * (`preserveAspectRatio="none"`), il épouse n'importe quelle largeur de niche
 * sans qu'aucune valeur ne soit à recalculer.
 */
export function ArabesqueArch({ className }: { className?: string }) {
  const intrados =
    'M0,48 C 5,47 8,38 14,28 C 22,14 34,6 50,6 ' +
    'C 66,6 78,14 86,28 C 92,38 95,47 100,48';
  const spandrel = `${intrados} L100,0 L0,0 Z`;

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 48"
      preserveAspectRatio="none"
      className={cn('block w-full', className)}
    >
      <path d={spandrel} className="fill-walnut-700" />
      <path
        d={intrados}
        fill="none"
        stroke="var(--color-gold)"
        strokeOpacity="0.45"
        strokeWidth="0.7"
        vectorEffect="non-scaling-stroke"
      />
      {/* Imposts : la naissance de l'arc est marquée de part et d'autre. */}
      <path
        d="M0,46 H9 M91,46 H100"
        stroke="var(--color-gold)"
        strokeOpacity="0.3"
        strokeWidth="0.6"
        vectorEffect="non-scaling-stroke"
      />
      {/* Clé de voûte : un losange posé sur la ligne de faîte, seule
          ponctuation de l'arc. */}
      <path
        d="M50,1 L55,7 L50,13 L45,7 Z"
        fill="var(--color-gold)"
        fillOpacity="0.4"
      />
    </svg>
  );
}

/**
 * Frise de corniche — losanges entrelacés.
 *
 * Le motif est porté par un `<pattern>` qui se répète LE LONG de la frise :
 * c'est de la menuiserie sur une pièce de bois, pas une texture posée sous
 * une page. La frise ne fait que 16-22 px de haut.
 */
export function ArabesqueFrieze({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 20"
      preserveAspectRatio="xMidYMid slice"
      className={cn('block h-full w-full', className)}
    >
      <defs>
        <pattern
          id={id}
          x="0"
          y="0"
          width="40"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M20,2 L38,10 L20,18 L2,10 Z"
            fill="none"
            stroke="var(--color-gold)"
            strokeOpacity="0.26"
            strokeWidth="0.8"
          />
          <path
            d="M20,7 L25,10 L20,13 L15,10 Z"
            fill="var(--color-gold)"
            fillOpacity="0.2"
          />
          <path
            d="M0,10 H2 M38,10 H40"
            stroke="var(--color-gold)"
            strokeOpacity="0.26"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="400" height="20" className="fill-walnut-700" />
      <rect width="400" height="20" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * Grecque de socle — bande d'entrelacs orthogonaux.
 *
 * Le pied du meuble est plus dense et plus sombre que la corniche : c'est lui
 * qui pose l'ensemble au sol.
 */
export function ArabesqueFret({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 24"
      preserveAspectRatio="xMidYMid slice"
      className={cn('block h-full w-full', className)}
    >
      <defs>
        <pattern
          id={id}
          x="0"
          y="0"
          width="32"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          {/* Grecque : un méandre fermé, repris en miroir d'un pas à l'autre. */}
          <path
            d="M2,21 V6 H16 V16 H9 V11 H12 M18,3 V18 H32"
            fill="none"
            stroke="var(--color-gold)"
            strokeOpacity="0.3"
            strokeWidth="1.1"
          />
        </pattern>
      </defs>
      <rect width="400" height="24" className="fill-walnut-900" />
      <rect width="400" height="24" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * Claustra — le remplissage ajouré d'un montant ou d'un panneau.
 *
 * Losanges jointifs tracés au filet doré, très pâles. Employé sur la JOUE du
 * meuble et sur le panneau du hero, jamais sous du texte courant.
 */
export function ArabesqueLattice({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      /* ⚠️ Un viewBox LARGE : `slice` met le tracé à l'échelle du plus grand
         côté, si bien qu'un petit viewBox donnerait un claustra grossier. */
      viewBox="0 0 480 480"
      preserveAspectRatio="xMidYMid slice"
      className={cn('block h-full w-full', className)}
    >
      <defs>
        <pattern
          id={id}
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M12,0 L24,12 L12,24 L0,12 Z"
            fill="none"
            stroke="var(--color-gold)"
            strokeOpacity="0.22"
            strokeWidth="0.9"
          />
          <path
            d="M12,8 L16,12 L12,16 L8,12 Z"
            fill="var(--color-gold)"
            fillOpacity="0.1"
          />
        </pattern>
      </defs>
      <rect width="480" height="480" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * Médaillon de montant — étoile à douze branches, inscrite dans son cercle.
 *
 * C'est la ciselure qui ponctue la joue du meuble, à la manière d'une rosette
 * sculptée. Tracé géométrique : ce n'est PAS la rosace de la marque, dont les
 * usages restent au nombre de quatre.
 */
export function ArabesqueMedallion({ className }: { className?: string }) {
  const points: string[] = [];
  for (let i = 0; i < 24; i += 1) {
    const radius = i % 2 === 0 ? 15 : 8.5;
    const angle = (Math.PI * i) / 12;
    points.push(
      `${(16 + radius * Math.sin(angle)).toFixed(2)},${(16 - radius * Math.cos(angle)).toFixed(2)}`,
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 32 32"
      className={cn('block', className)}
      width="32"
      height="32"
    >
      <circle
        cx="16"
        cy="16"
        r="15"
        fill="none"
        stroke="var(--color-gold)"
        strokeOpacity="0.32"
        strokeWidth="0.9"
      />
      <polygon
        points={points.join(' ')}
        fill="var(--color-gold)"
        fillOpacity="0.14"
        stroke="var(--color-gold)"
        strokeOpacity="0.36"
        strokeWidth="0.8"
      />
      <circle
        cx="16"
        cy="16"
        r="3"
        fill="var(--color-gold)"
        fillOpacity="0.3"
      />
    </svg>
  );
}
