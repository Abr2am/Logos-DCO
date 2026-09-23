import { cn } from '@/lib/cn';

import { Shelf } from './Shelf';
import { ThemeCard } from './ThemeCard';

/*
 * Rayonnage de niches — les thèmes et les sous-thèmes.
 *
 * Même principe que `Bookshelf` : chaque niche porte sa propre tablette, et
 * les niches d'une rangée sont jointives — leurs tablettes se rejoignent donc
 * en une ligne continue, à tous les paliers, sans un seul calcul.
 *
 * Un filet sépare les niches voisines ; deux montants encadrent l'ensemble en
 * desktop. Ponctuels, d'un pixel : c'est une travée, pas un meuble.
 *
 *   `themes`    — les neuf thèmes : 1 · 2 · 3 par rangée.
 *   `subthemes` — les sous-thèmes d'une branche : 1 · 3 · 3 par rangée.
 */

export type NicheItem = {
  key: string;
  name: string;
  href: string;
  /** Uniquement « Vie chrétienne » en porte. */
  subthemes?: ReadonlyArray<string>;
  selected?: boolean;
};

type Layout = 'themes' | 'subthemes';

const GRID: Record<Layout, string> = {
  themes: 'tablet:grid-cols-2 desktop:grid-cols-3',
  subthemes: 'tablet:grid-cols-3',
};

export function ThemeShelf({
  items,
  layout = 'themes',
  className,
}: {
  items: ReadonlyArray<NicheItem>;
  layout?: Layout;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-y border-[rgb(46_30_21/0.14)]',
        'desktop:border-x desktop:border-x-[rgb(46_30_21/0.14)]',
        className,
      )}
    >
      {/* Les filets qui séparent les niches ne sont PAS posés par
          `nth-child` : à chaque palier il faudrait les ajouter puis les
          retirer, et deux classes réglant `border-left-width` sur un même
          élément ne s'ordonnent pas de façon fiable (voir CLAUDE.md).

          Chaque niche porte donc les MÊMES bordures — haut et gauche — et se
          décale d'un pixel pour que la sienne recouvre celle de sa voisine.
          Le résultat est exact à tous les paliers, sans une seule règle
          conditionnelle, et une rangée incomplète ne laisse aucune cellule
          fantôme. */}
      <ul className={cn('grid', GRID[layout])}>
        {items.map((item) => (
          <li
            key={item.key}
            className="-ml-px -mt-px flex flex-col border-l border-t border-[rgb(46_30_21/0.1)]"
          >
            <div className="flex flex-1 flex-col">
              <ThemeCard
                name={item.name}
                href={item.href}
                subthemes={item.subthemes}
                selected={item.selected}
              />
            </div>
            <Shelf />
          </li>
        ))}
      </ul>
    </div>
  );
}
