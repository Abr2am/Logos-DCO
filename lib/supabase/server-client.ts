import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

/*
 * Clients Supabase porteurs de la SESSION.
 *
 * La session vit dans des cookies `httpOnly` posés par Supabase : elle n'est
 * jamais lisible par du JavaScript de page, et n'est jamais fournie par le
 * client sous une forme à laquelle on ferait confiance.
 *
 * Ces clients n'utilisent que la clé anonyme : toute lecture reste soumise à
 * la RLS, le rôle de l'utilisateur ne donnant que ce que ses policies
 * autorisent.
 */

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis.',
    );
  }

  return { url, anonKey };
}

/** Client lié aux cookies de la requête courante (pages, Server Actions). */
export async function createSessionClient() {
  const { url, anonKey } = env();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Un composant serveur ne peut pas écrire de cookie : le
             rafraîchissement de session est alors assuré par le proxy. */
        }
      },
    },
  });
}

/** Client du proxy, qui peut écrire les cookies rafraîchis sur la réponse. */
export function createProxyClient(
  request: NextRequest,
  response: NextResponse,
) {
  const { url, anonKey } = env();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}
