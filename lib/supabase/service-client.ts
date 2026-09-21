import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
 * Client Supabase de SERVICE — serveur uniquement.
 *
 * La clé `service_role` CONTOURNE la RLS. Ce module est protégé par
 * `server-only` : toute tentative de l'importer depuis un composant client
 * casse le build, plutôt que de laisser la clé fuir silencieusement.
 *
 * Il n'existe qu'un usage à ce stade : la route de téléchargement, qui
 * interroge `get_published_file` — laquelle n'accepte que les ressources
 * publiées — puis signe une URL de courte durée sur le bucket privé.
 */

let client: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis ' +
        'pour le téléchargement. Copier .env.example en .env.local.',
    );
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
