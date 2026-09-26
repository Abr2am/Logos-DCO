import { ArabesqueArch, ArabesqueLattice } from '@/components/brand/Arabesque';

import { BookSpines } from './BookSpines';

/*
 * Le fragment d'architecture du hero — le meuble vu de biais, en bord d'écran.
 *
 * Ce n'est ni une image, ni une illustration : c'est la même menuiserie que
 * `Bookcase`, réduite à une imposte ajourée et deux tablettes. Il est
 * `aria-hidden` et ne porte AUCUN lien : la navigation reste celle du hero et
 * du meuble des thèmes.
 *
 * Les ouvrages qui y sont posés partent des ressources réellement publiées.
 * ⚠️ Différence assumée avec les niches de thème : ici, la rangée est COMPLÉTÉE
 * par des tranches muettes lorsque la bibliothèque est encore jeune. C'est du
 * mobilier — un rayon vide se lirait comme un trou — et non une liste : ce
 * panneau est `aria-hidden`, ne porte aucun lien et ne prétend compter
 * personne. Les niches de « Explorer par thème », elles, restent exactes :
 * une tranche = une ressource publiée dans ce thème.
 */

/** Complète une rangée jusqu'à `size` tranches, de façon déterministe. */
function fillShelf(
  books: ReadonlyArray<{ id: string }>,
  seed: string,
  size: number,
): { id: string }[] {
  const shelf = books.slice(0, size).map((book) => ({ id: book.id }));
  for (let i = shelf.length; i < size; i += 1) {
    shelf.push({ id: `${seed}-${i}` });
  }
  return shelf;
}
export function HeroShelf({
  books,
  id,
}: {
  books: ReadonlyArray<{ id: string }>;
  /** Identifiant du claustra — unique dans la page. */
  id: string;
}) {
  return (
    <div
      aria-hidden
      className="relative h-full w-full overflow-hidden bg-walnut-700"
    >
      {/* Arête : le montant qui referme le meuble côté salle. */}
      <div className="absolute inset-y-0 left-0 w-px bg-[rgb(195_154_84/0.45)]" />

      <div className="flex h-full flex-col gap-[10px] p-[10px] pl-[14px]">
        {/* Imposte ajourée — le claustra laisse passer la lumière. */}
        <div className="relative h-[44px] shrink-0 overflow-hidden bg-walnut-900 shadow-niche desktop:h-[54px]">
          <ArabesqueLattice id={id} />
        </div>

        {/* Trois tablettes : une niche haute et vide se lirait comme un trou,
            trois se lisent comme un rayonnage. */}
        <HeroNiche books={fillShelf(books.slice(0, 3), `${id}-a`, 11)} />
        <HeroNiche books={fillShelf(books.slice(3, 6), `${id}-b`, 9)} />
        <HeroNiche books={fillShelf(books.slice(6, 9), `${id}-c`, 12)} />
      </div>
    </div>
  );
}

function HeroNiche({ books }: { books: ReadonlyArray<{ id: string }> }) {
  return (
    <div className="relative flex flex-1 flex-col justify-end bg-walnut-900 shadow-niche">
      <ArabesqueArch className="absolute inset-x-0 top-0 h-[24px] desktop:h-[30px]" />
      <BookSpines books={books} scale={1.15} max={12} className="px-16 pb-12" />
      <div className="shrink-0">
        <div className="h-px bg-[rgb(195_154_84/0.55)]" />
        <div className="h-[9px] bg-walnut-700 desktop:h-[11px]" />
      </div>
    </div>
  );
}
