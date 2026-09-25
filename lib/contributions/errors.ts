/*
 * Ce qu'un membre a le droit de lire quand la base refuse.
 *
 * Un message PostgreSQL brut nomme des tables, des colonnes, des contraintes
 * et des policies. `app/error.tsx` s'interdit déjà de les afficher — les
 * formulaires de contribution, eux, les recopiaient tels quels dans le
 * panneau d'erreur. Ce module ferme cette porte, sans rien perdre :
 *
 *   · `userMessage` ne renvoie JAMAIS que des phrases écrites ici ;
 *   · `logDatabaseError` conserve le détail technique côté SERVEUR, dans le
 *     journal de la fonction — le même endroit que les erreurs levées par
 *     `throw`, qui n'atteignent pas davantage le navigateur.
 *
 * Deux codes sont traduits parce que la base les lève vraiment dans ce
 * parcours : `42501` (RLS ou matrice de transitions) et `23514` (règle de la
 * ressource). Tout le reste reçoit le message d'attente de l'appelant.
 */

/** Ce que `supabase-js` rend d'une erreur PostgREST, réduit à l'utile. */
export type DatabaseError = {
  code?: string | null;
  message?: string | null;
};

/** `insufficient_privilege` — la RLS, ou une transition interdite. */
const INSUFFICIENT_PRIVILEGE = '42501';

/** `check_violation` — une règle de la ressource n'est pas tenue. */
const CHECK_VIOLATION = '23514';

const BY_SQLSTATE: Record<string, string> = {
  [INSUFFICIENT_PRIVILEGE]:
    "Cette action a été refusée : la ressource n'est pas modifiable, ou elle ne vous appartient pas.",
  [CHECK_VIOLATION]:
    "Une règle de la ressource n'est pas respectée : cinq flags au minimum, et un fichier.",
};

/**
 * Le message à afficher. Le texte de la base n'en fait jamais partie : soit
 * une phrase connue, soit celle que l'appelant propose.
 */
export function userMessage(
  error: DatabaseError | null | undefined,
  fallback: string,
): string {
  const code = error?.code;
  if (typeof code === 'string' && code in BY_SQLSTATE) {
    return BY_SQLSTATE[code] as string;
  }
  return fallback;
}

/**
 * Le détail, pour le journal du serveur — jamais pour la page.
 *
 * C'est le seul canal de diagnostic du MVP : aucun service d'observabilité
 * n'entre dans la pile, et la plateforme collecte déjà la sortie d'erreur.
 */
export function logDatabaseError(
  context: string,
  error: DatabaseError | null | undefined,
): void {
  console.error(`[logos] ${context}`, {
    code: error?.code ?? null,
    message: error?.message ?? null,
  });
}
