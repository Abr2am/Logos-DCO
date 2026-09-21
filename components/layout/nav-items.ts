/**
 * Entrées de navigation du Design System, dans l'ordre imposé.
 * Liste fermée : Accueil · Bibliothèque · Partager un cours · compte.
 */
export const NAV_ITEMS = [
  { label: 'Accueil', href: '/' },
  { label: 'Bibliothèque', href: '/bibliotheque' },
  { label: 'Partager un cours', href: '/partager' },
] as const;

export type NavItem = { label: string; href: string };

/**
 * Entrée de compte par défaut : visiteur non authentifié.
 *
 * ⚠️ POINT OUVERT — le Design System indique que le libellé bascule sur
 * « Mon compte » une fois connecté, mais aucune route de compte n'est définie
 * par le cahier des charges. La destination authentifiée est donc fournie par
 * l'appelant ; elle n'est pas décidée ici.
 */
export const DEFAULT_ACCOUNT_ITEM: NavItem = {
  label: 'Connexion',
  href: '/connexion',
};
