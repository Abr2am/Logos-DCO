import { cn } from '@/lib/cn';

/*
 * Quatre statuts, différenciés par la MATIÈRE et non par une palette de
 * dashboard : doré plein, bordeaux plein, contour bordeaux, contour neutre.
 *
 * « Ils n'apparaissent que dans Mes contributions et l'administration,
 *   jamais dans la bibliothèque publique. »
 *
 * `DRAFT` reste un état technique interne : il n'a pas de rendu.
 */

export type DisplayedStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

const STATUS: Record<DisplayedStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'En attente',
    className: 'bg-gold text-text px-[10px] py-[5px]',
  },
  PUBLISHED: {
    label: 'Publiée',
    className: 'bg-burgundy text-on-dark px-[10px] py-[5px]',
  },
  REJECTED: {
    label: 'À corriger',
    className: 'border-[1.5px] border-burgundy text-burgundy px-[9px] py-[4px]',
  },
  ARCHIVED: {
    label: 'Archivée',
    className: 'border border-[rgb(36_24_16/0.3)] text-help px-[10px] py-[4px]',
  },
};

export function Status({ status }: { status: DisplayedStatus }) {
  const { label, className } = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-status text-[11px] font-semibold leading-none',
        className,
      )}
    >
      {label}
    </span>
  );
}
