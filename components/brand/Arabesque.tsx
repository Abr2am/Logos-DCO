import { cn } from '@/lib/cn';

/*
 * Menuiserie copte — la géométrie, et rien d'autre.
 *
 * Ces tracés dérivent de la rosace : étoile à douze branches, losanges
 * entrelacés, arcs brisés. Ils sont **géométriques, fins et élégants**, jamais
 * figuratifs. Aucune croix, aucune icône, aucun objet liturgique : l'identité
 * doit rester reconnaissable une fois tout symbole retiré.
 *
 * ⚠️ Aucun de ces motifs ne sert de TEXTURE DE FOND. Chacun est une pièce
 * d'architecture — un arc au-dessus d'une niche, une frise de corniche, un
 * montant — et s'étire exactement sur la pièce qu'il habille.
 *
 * 80 % contemporain / 20 % héritage copte : le patrimoine passe par la
 * géométrie des ouvrages, pas par leur accumulation.
 */

/**
 * Arc brisé couronnant une niche.
 *
 * Le tracé remplit l'écoinçon — la matière AU-DESSUS de l'arc — de sorte que
 * l'ouverture se découpe en négatif dans le montant. Étiré horizontalement
 * (`preserveAspectRatio="none"`), il épouse n'importe quelle largeur de niche
 * sans qu'aucune valeur ne soit à recalculer.
 */
export function ArabesqueArch({ className }: { className?: string }) {
  /* Arc SEGMENTAIRE : une niche large se couvre d'un arc surbaissé, pas d'un
     plein cintre — qui, étiré, ne serait plus qu'une ondulation. Les reins
     montent vite depuis les piédroits, le sommet reste tendu. */
  const intrados =
    'M0,48 C 5,47 8,38 14,28 C 22,14 34,6 50,6 ' +
    'C 66,6 78,14 86,28 C 92,38 95,47 100,48';
  /* Même tracé, refermé par le haut : l'écoinçon — la matière AU-DESSUS de
     l'arc — est plein, et l'ouverture se découpe en négatif. */
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
 * Frise de corniche ou de socle — losanges entrelacés.
 *
 * Le motif est porté par un `<pattern>` qui se répète LE LONG de la frise :
 * c'est de la menuiserie sur une pièce de bois, pas une texture posée sous
 * une page. La frise ne fait que 18-22 px de haut.
 */
export function ArabesqueFrieze({
  id,
  className,
}: {
  /** Identifiant unique du motif — deux frises sur une page se marcheraient dessus. */
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
 * Montant ajouré — le refend vertical entre deux niches.
 *
 * Une colonne de losanges, tracée sur toute la hauteur du montant. Étirée
 * verticalement, elle suit la hauteur de la rangée sans calcul.
 */
export function ArabesqueUpright({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 120"
      preserveAspectRatio="none"
      className={cn('block h-full w-full', className)}
    >
      <rect width="16" height="120" className="fill-walnut-700" />
      <path
        d="M8,0 V120"
        stroke="var(--color-gold)"
        strokeOpacity="0.28"
        strokeWidth="0.6"
        vectorEffect="non-scaling-stroke"
      />
      {[24, 60, 96].map((y) => (
        <path
          key={y}
          d={`M8,${y - 9} L13,${y} L8,${y + 9} L3,${y} Z`}
          fill="none"
          stroke="var(--color-gold)"
          strokeOpacity="0.4"
          strokeWidth="0.9"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
