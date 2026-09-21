import { cn } from '@/lib/cn';

/*
 * Tablette — clôture toute rangée de couvertures. 12 px desktop, 9 px mobile,
 * en `--walnut-700`, filet doré en haut, ombre vers le bas.
 *
 * « Elle marque le sol de l'étagère : jamais deux tablettes consécutives sans
 *   couvertures entre elles. »
 */
export function Shelf({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'h-[9px] border-t border-gold bg-walnut-700 shadow-shelf tablet:h-[12px]',
        className,
      )}
    />
  );
}
