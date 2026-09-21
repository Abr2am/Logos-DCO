import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
 * Client Supabase de la surface PUBLIQUE.
 *
 * Il n'utilise que la clé anonyme. Celle-ci est publique par nature : elle
 * n'est sûre que parce que la RLS est active sur toutes les tables et que le
 * rôle anonyme n'a accès à aucune d'entre elles — uniquement à la taxonomie,
 * aux trois vues publiques et aux deux fonctions de bibliothèque.
 *
 * La clé `service_role` n'apparaît jamais ici.
 */

let client: SupabaseClient | null = null;

export function publicClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis. ' +
        'Copier .env.example en .env.local.',
    );
  }

  client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
