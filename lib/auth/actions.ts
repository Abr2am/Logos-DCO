'use server';

import { redirect } from 'next/navigation';

import { createSessionClient } from '@/lib/supabase/server-client';

import { safeReturnPath } from './session';

/*
 * Actions d'authentification.
 *
 * Il n'existe AUCUNE inscription : le diocèse crée les comptes. Ce module
 * n'expose donc que la connexion et la déconnexion — pas d'inscription, pas
 * de création de compte, pas d'invitation.
 */

export type SignInState = { error: string | null };

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeReturnPath(String(formData.get('suivant') ?? '')) ?? '/';

  if (!email || !password) {
    return { error: 'Renseignez votre adresse e-mail et votre mot de passe.' };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    /* Message unique : distinguer « compte inconnu » de « mot de passe
       incorrect » révélerait quelles adresses possèdent un compte. */
    return { error: 'Identifiants incorrects.' };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect('/');
}
