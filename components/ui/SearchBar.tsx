import { cn } from '@/lib/cn';

/*
 * Bouton attaché au champ, sans radius intérieur : c'est un bloc unique.
 * Deux portées seulement — globale, ou limitée à une branche.
 *
 * Aucune liste de mots-clés suggérés sous le champ : les flags sont libres et
 * propres à chaque ressource, en afficher une sélection donnerait
 * l'impression d'une taxonomie.
 *
 * Pas d'autocomplétion, pas de recherche avancée, pas de recherche dans le
 * contenu des fichiers.
 */

type SearchBarProps = {
  /** `global` : accueil et bibliothèque. `branch` : en-tête de catégorie. */
  scope?: 'global' | 'branch';
  /** Nom du thème, pour la portée limitée à une branche. */
  branchLabel?: string;
  action?: string;
  defaultValue?: string;
  className?: string;
};

export function SearchBar({
  scope = 'global',
  branchLabel,
  action,
  defaultValue,
  className,
}: SearchBarProps) {
  const branch = scope === 'branch';
  const placeholder = branch
    ? `Rechercher dans ${branchLabel ?? 'ce thème'}…`
    : 'Rechercher un cours, un thème, un saint, un passage biblique…';

  return (
    <form
      action={action}
      role="search"
      className={cn(
        'flex items-stretch rounded-control',
        'focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-burgundy',
        branch
          ? 'border border-[rgb(195_154_84/0.6)] bg-ivory'
          : 'border border-[rgb(36_24_16/0.25)] bg-surface',
        className,
      )}
    >
      <label htmlFor="q" className="sr-only">
        {branch ? placeholder : 'Rechercher une ressource'}
      </label>
      <div className="flex flex-1 items-center gap-[10px] px-[14px] tablet:gap-[14px] tablet:px-[24px]">
        {/* Marque de recherche : cercle géométrique, conforme au gabarit. */}
        <span
          aria-hidden
          className="size-[12px] shrink-0 rounded-full border-[1.5px] border-burgundy tablet:size-[15px]"
        />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent py-[14px] text-[13px] text-text placeholder:text-placeholder focus:outline-none tablet:py-0 tablet:text-[16px]"
        />
      </div>
      <button
        type="submit"
        className={cn(
          'shrink-0 bg-burgundy font-semibold text-on-dark',
          'transition-colors duration-[150ms] ease-logos hover:bg-burgundy-hover',
          'px-[16px] text-[12.5px] tablet:px-[34px] tablet:text-ui',
        )}
      >
        <span className="tablet:hidden">OK</span>
        <span className="hidden tablet:inline">Rechercher</span>
      </button>
    </form>
  );
}
