'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signIn, type SignInState } from '@/lib/auth/actions';

const INITIAL: SignInState = { error: null };

/*
 * Formulaire de connexion.
 *
 * Un seul message d'erreur, volontairement indifférencié : distinguer
 * « compte inconnu » de « mot de passe incorrect » révélerait quelles adresses
 * possèdent un compte.
 *
 * Aucune inscription, aucun lien de création de compte : les comptes sont
 * créés par le diocèse.
 */
export function LoginForm({ returnPath }: { returnPath: string | null }) {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);

  return (
    <form action={formAction} className="grid gap-22">
      {returnPath ? (
        <input type="hidden" name="suivant" value={returnPath} />
      ) : null}

      <Input
        id="email"
        name="email"
        type="email"
        label="Adresse e-mail"
        required
        autoComplete="email"
        placeholder="vous@exemple.fr"
        error={state.error ?? undefined}
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Mot de passe"
        required
        autoComplete="current-password"
        placeholder="••••••••"
      />

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </Button>
    </form>
  );
}
