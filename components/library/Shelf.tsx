import { cn } from '@/lib/cn';

/*
 * Tablette — la pièce élémentaire du rayonnage.
 *
 * Structure graphique, JAMAIS une bibliothèque réaliste : un aplat noyer, un
 * filet doré très fin au-dessus, une ombre portée légère. Aucune texture de
 * bois, aucun motif répété.
 *
 * ⚠️ Elle reste DISCRÈTE : 7 px en mobile, 9 px au-delà. L'étagère porte les
 * ouvrages, elle ne les concurrence pas.
 *
 * « Elle marque le sol de l'étagère : jamais deux tablettes consécutives sans
 *   couvertures entre elles. »
 */
export function Shelf({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'h-[7px] border-t border-[rgb(195_154_84/0.7)] bg-walnut-700 shadow-shelf tablet:h-[9px]',
        className,
      )}
    />
  );
}
