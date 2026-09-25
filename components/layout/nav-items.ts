/**
 * Entrées de navigation du Design System, dans l'ordre imposé.
 * Liste fermée : Accueil · Bibliothèque · Partager un cours · compte.
 */
export type NavItem = { label: string; href: string };

/** Navigation d'un VISITEUR — inchangée. */
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { label: 'Accueil', href: '/' },
  { label: 'Bibliothèque', href: '/bibliotheque' },
  { label: 'Partager un cours', href: '/partager' },
];

/** Entrée de compte d'un visiteur : un lien vers la connexion. */
export const ACCOUNT_ITEM: NavItem = {
  label: 'Connexion',
  href: '/connexion',
};

/**
 * Entrée de compte d'un membre connecté.
 *
 * Décision du 25/09/2026 : elle **tranche le point ouvert « T »**. Le libellé
 * bascule toujours de « Connexion » à « Mon compte » — mais c'est désormais un
 * VRAI lien, vers `/compte`.
 */
export const ACCOUNT_ITEM_SIGNED_IN: NavItem = {
  label: 'Mon compte',
  href: '/compte',
};

/**
 * Navigation d'un MEMBRE connecté.
 *
 * « Partager un cours » en sort : le dépôt est proposé depuis « Mon compte »,
 * avec « Mes contributions » et « Mes questions ». La barre publique, elle,
 * ne bouge pas — un visiteur y trouve toujours l'entrée, qui le mène à la
 * connexion.
 */
export const MEMBER_NAV_ITEMS: ReadonlyArray<NavItem> = [
  ...NAV_ITEMS.filter((item) => item.href !== '/partager'),
  ACCOUNT_ITEM_SIGNED_IN,
];
