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

/** Entrée de compte d'un visiteur : un lien vers la connexion. */
export const ACCOUNT_ITEM: NavItem = {
  label: 'Connexion',
  href: '/connexion',
};

/**
 * Libellé de l'entrée de compte une fois connecté.
 *
 * ⚠️ POINT OUVERT « T » — INTACT. Le Design System indique que le libellé
 * bascule de « Connexion » à « Mon compte » ; il ne dit pas où mène cette
 * entrée, et aucune route de compte ne figure dans la liste fermée. Ce
 * libellé n'est donc PAS un lien : il énonce l'état de la session, et
 * l'action utile — la déconnexion — l'accompagne. Choisir une destination
 * reviendrait à trancher « T ».
 */
export const ACCOUNT_LABEL_SIGNED_IN = 'Mon compte';
