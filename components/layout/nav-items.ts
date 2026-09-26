/**
 * Entrées de navigation, dans l'ordre imposé.
 * Liste fermée : Accueil · Bibliothèque · compte.
 */
export type NavItem = { label: string; href: string };

/**
 * Navigation d'un VISITEUR.
 *
 * « Partager un cours » n'y figure plus (25/09/2026) : la barre n'a pas à
 * proposer une action qui exige un compte. L'accueil, lui, la propose
 * toujours — en appel à l'action du hero et du bloc « Enrichir la
 * bibliothèque » —, et le visiteur qui la suit passe par la connexion.
 */
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { label: 'Accueil', href: '/' },
  { label: 'Bibliothèque', href: '/bibliotheque' },
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
 * Navigation d'un MEMBRE connecté : la même, plus l'entrée de compte.
 *
 * Le dépôt se rejoint depuis « Mon compte », avec « Mes contributions » et
 * « Mes questions ».
 */
export const MEMBER_NAV_ITEMS: ReadonlyArray<NavItem> = [
  ...NAV_ITEMS,
  ACCOUNT_ITEM_SIGNED_IN,
];
