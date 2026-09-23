import Link from 'next/link';

/*
 * Titre Bodoni à gauche, lien tertiaire optionnel à droite sur la même ligne
 * de base. Pas de filet sous le titre, pas de surtitre monospace en accueil.
 */
export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-baseline justify-between gap-16">
      <h2 className="font-display text-h2-mobile tablet:text-h2">{title}</h2>
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 text-[13px] font-semibold text-walnut-900 underline-offset-4 hover:text-walnut-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900"
        >
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}
