import { cn } from '@/lib/cn';

/*
 * Les tranches d'ouvrages posées au fond d'une niche.
 *
 * Elles DÉRIVENT DES RESSOURCES RÉELLES : une tranche par ressource publiée,
 * au plus six — au-delà, une niche cesse d'être lisible. Ce n'est donc ni un
 * compteur, ni une illustration inventée ; une niche sans ressource reste
 * vide, et c'est exact.
 *
 * Hauteur, largeur, teinte et inclinaison sont tirées de l'identifiant de la
 * ressource : le même ouvrage occupe toujours la même place, partout.
 *
 * Aucune teinte nouvelle : les tranches empruntent les plats et les chants de
 * couverture déjà définis (`cover-plate`, `cover-edge`, `walnut-700`) et le
 * doré en filet.
 */

const TONES = [
  'bg-cover-plate',
  'bg-cover-edge',
  'bg-walnut-700',
  'bg-cover-plate',
  'bg-[rgb(195_154_84/0.55)]',
] as const;

const HEIGHTS = [44, 54, 62, 48, 68, 58] as const;
const WIDTHS = [11, 14, 18, 12, 20, 16] as const;
const MAX_SPINES = 6;

/** FNV-1a 32 bits — stable, sans dépendance, comme `coverFamilyFromKey`. */
function hash(key: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    value ^= key.charCodeAt(i);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

export function BookSpines({
  books,
  scale = 1,
  max = MAX_SPINES,
  className,
}: {
  books?: ReadonlyArray<{ id: string }>;
  /** Facteur de hauteur : 1 dans une niche de thème, davantage en hero. */
  scale?: number;
  /** Nombre maximal de tranches. Au-delà de six, une niche cesse d'être lisible. */
  max?: number;
  className?: string;
}) {
  if (!books || books.length === 0) return null;

  const spines = books.slice(0, max);

  return (
    <span
      aria-hidden
      className={cn('flex items-end gap-[3px] tablet:gap-[4px]', className)}
    >
      {spines.map((book, index) => {
        const key = hash(book.id);
        const height = (HEIGHTS[key % HEIGHTS.length] as number) * scale;
        const width = WIDTHS[(key >>> 3) % WIDTHS.length] as number;
        const tone = TONES[(key >>> 7) % TONES.length] as string;
        /* Une tranche s'appuie parfois sur sa voisine — jamais la première. */
        const leaning = index > 0 && (key >>> 11) % 5 === 0;

        return (
          <span
            key={book.id}
            className={cn(
              'block origin-bottom',
              tone,
              leaning && '-rotate-[4deg]',
            )}
            style={{ height, width }}
          >
            {/* Tranchefile : deux filets en tête de tranche. C'est ce qui fait
                lire un ouvrage plutôt qu'un bâtonnet. */}
            <span className="mt-[7px] block h-px w-full bg-[rgb(46_30_21/0.35)]" />
            <span className="mt-[3px] block h-px w-full bg-[rgb(46_30_21/0.35)]" />
          </span>
        );
      })}

      {/* Au-delà de trois ouvrages, deux volumes sont couchés en bout de
          rangée : c'est ce qui donne son rythme à une vraie tablette. */}
      {spines.length > 3 ? (
        <span className="ml-[5px] block w-[30px] shrink-0">
          <span className="block h-[8px] w-full bg-cover-edge" />
          <span className="mt-px block h-[7px] w-[85%] bg-walnut-700" />
        </span>
      ) : null}
    </span>
  );
}
