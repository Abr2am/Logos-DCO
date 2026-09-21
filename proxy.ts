import { NextResponse, type NextRequest } from 'next/server';

import { createProxyClient } from '@/lib/supabase/server-client';

/*
 * Proxy (anciennement « middleware »).
 *
 * Deux rôles, et deux seulement :
 *   1. rafraîchir les cookies de session à chaque requête — un composant
 *      serveur ne peut pas écrire de cookie, c'est donc ici que la rotation
 *      des jetons est persistée ;
 *   2. écarter d'emblée un visiteur sans session des routes authentifiées.
 *
 * Ce second point est un filtre de confort, PAS la protection : le rôle n'est
 * pas lu ici. Chaque page authentifiée revérifie l'identité ET le rôle côté
 * serveur, via `lib/auth`. Retirer ce proxy ne doit ouvrir aucun accès.
 */

const PROTECTED = ['/partager', '/mes-contributions', '/admin'];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createProxyClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !user) {
    const login = request.nextUrl.clone();
    login.pathname = '/connexion';
    login.search = '';
    login.searchParams.set('suivant', pathname);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  /* Tout sauf les fichiers statiques et les images optimisées. */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brand/).*)'],
};
