/*
 * L'URL porte l'état : la recherche et les filtres sont des paramètres, la
 * branche est un segment de chemin. Aucun gestionnaire d'état côté client.
 *
 *   /bibliotheque
 *   /bibliotheque/[categorie]
 *   /bibliotheque/[categorie]/[sous-categorie]
 *   ?q=…&flags=…&flags=…
 */

export type LibraryLocation = {
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  query?: string | null;
  flags?: readonly string[];
};

export function libraryHref({
  categorySlug,
  subcategorySlug,
  query,
  flags = [],
}: LibraryLocation): string {
  const segments = ['/bibliotheque'];
  if (categorySlug) {
    segments.push(categorySlug);
    if (subcategorySlug) segments.push(subcategorySlug);
  }

  const params = new URLSearchParams();
  const trimmed = query?.trim();
  if (trimmed) params.set('q', trimmed);
  for (const flag of flags) params.append('flags', flag);

  const search = params.toString();
  return search ? `${segments.join('/')}?${search}` : segments.join('/');
}

/** Normalise `flags` : le paramètre peut être absent, unique ou répété. */
export function readFlags(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list.map((flag) => flag.trim()).filter(Boolean))];
}

export function readQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? '';
}
