import { redirect } from 'next/navigation';

import { createSessionClient } from '@/lib/supabase/server-client';

/*
 * Couche d'authentification — ISOLÉE ET REMPLAÇABLE.
 *
 * Le reste de l'application ne connaît que ce module : `currentUser`,
 * `requireMember`, `requireAdmin`. Passer au SSO / OIDC du diocèse consistera
 * à réécrire ce fichier et son implémentation Supabase, sans toucher aux
 * pages.
 *
 * Règles non négociables appliquées ici :
 *   - le rôle n'est JAMAIS lu dans un jeton fourni par le client : il est relu
 *     en base à chaque appel, sous la RLS, qui ne laisse voir à un membre que
 *     sa propre ligne ;
 *   - `getUser()` et non `getSession()` : le premier fait valider le jeton par
 *     Supabase, le second se contente de lire un cookie.
 */

export type MemberRole = 'SERVANT' | 'ADMIN';

/**
 * Libellés d'affichage des deux rôles.
 *
 * `User.role` ne connaît que `SERVANT` et `ADMIN` ; PUBLIC est l'absence de
 * compte, jamais une valeur en base. Ces libellés sont donc exhaustifs.
 */
export const ROLE_LABELS: Record<MemberRole, string> = {
  SERVANT: 'Serviteur',
  ADMIN: 'Administrateur',
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: MemberRole;
  displayName: string | null;
};

/** L'utilisateur authentifié, ou `null`. Ne redirige pas. */
export async function currentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createSessionClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  /* Le rôle vient de la base, jamais des métadonnées du jeton — qui sont
     modifiables par l'utilisateur sur certains fournisseurs. */
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, role, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id as string,
    email: profile.email as string,
    role: profile.role as MemberRole,
    displayName: (profile.display_name as string | null) ?? null,
  };
}

/**
 * Chemin de retour après connexion.
 *
 * Seuls les chemins internes sont acceptés : `//exemple.com` ou une URL
 * absolue ouvriraient une redirection arbitraire.
 */
export function safeReturnPath(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export function loginHref(returnPath?: string): string {
  const safe = safeReturnPath(returnPath);
  return safe ? `/connexion?suivant=${encodeURIComponent(safe)}` : '/connexion';
}

/** Exige un compte. Redirige vers la connexion sinon. */
export async function requireMember(
  returnPath: string,
): Promise<AuthenticatedUser> {
  const user = await currentUser();
  if (!user) redirect(loginHref(returnPath));
  return user;
}

/**
 * Exige le rôle ADMIN.
 *
 * Réservé aux écrans d'administration : un serviteur authentifié obtient la
 * même réponse qu'un visiteur — la redirection ne révèle pas l'existence de
 * l'écran.
 */
export async function requireAdmin(
  returnPath: string,
): Promise<AuthenticatedUser> {
  const user = await requireMember(returnPath);
  if (user.role !== 'ADMIN') redirect('/');
  return user;
}
