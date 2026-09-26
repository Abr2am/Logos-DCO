/*
 * En-têtes de sécurité HTTP — point `I6` de l'audit du 25/09/2026.
 *
 * Rien ici ne remplace la RLS : ces en-têtes protègent le NAVIGATEUR d'un
 * visiteur, là où PostgreSQL protège les données. Ils ferment trois portes que
 * l'application laissait ouvertes : l'encadrement dans une iframe tierce —
 * donc le détournement de clic sur le formulaire de connexion —, le
 * chargement d'un script d'une autre origine, et l'envoi d'un formulaire
 * ailleurs que chez nous.
 *
 * ── Pourquoi `'unsafe-inline'` dans `script-src` ────────────────────────────
 * Next place la charge utile du rendu serveur dans des balises `<script>`
 * en ligne. Les interdire casserait l'hydratation de toutes les pages. La
 * parade propre est un NONCE par requête, posé dans `proxy.ts` — mais elle
 * impose un rendu dynamique à chaque page, ce que la page 404, prérendue,
 * n'est pas. C'est une amélioration à part entière, pas un réglage.
 *
 * La CSP garde donc une valeur réelle mais bornée : elle n'arrête pas un
 * script injecté en ligne, elle empêche d'en charger un depuis une autre
 * origine, d'exfiltrer vers une adresse arbitraire (`connect-src`), de
 * détourner l'envoi d'un formulaire (`form-action`) et d'encadrer le site
 * (`frame-ancestors`).
 *
 * ⚠️ `'unsafe-eval'` n'est accordé qu'en DÉVELOPPEMENT, où React s'en sert
 * pour reconstruire les piles d'erreur. La production ne l'obtient jamais.
 */

export type SecurityHeader = { key: string; value: string };

export type SecurityOptions = {
  /** `NEXT_PUBLIC_SUPABASE_URL`, pour autoriser l'API et le Storage. */
  supabaseUrl?: string | undefined;
  /** Vrai sous `next dev`. */
  development?: boolean;
};

/**
 * L'origine Supabase à autoriser en `connect-src` : le navigateur y dépose
 * les fichiers par URL signée.
 *
 * ⚠️ Si la variable manque au moment du build, on retombe sur le domaine
 * générique plutôt que de produire une politique qui casserait le
 * téléversement. Mieux vaut une origine large qu'un site inutilisable.
 */
export function supabaseOrigin(url?: string | undefined): string {
  if (!url) return 'https://*.supabase.co';
  try {
    return new URL(url).origin;
  } catch {
    return 'https://*.supabase.co';
  }
}

/** La politique, en une chaîne — l'ordre des directives est sans effet. */
export function contentSecurityPolicy(options: SecurityOptions = {}): string {
  const supabase = supabaseOrigin(options.supabaseUrl);
  const script = options.development
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${script}`,
    /* Tailwind sert une feuille de notre origine ; Next et quelques
       composants posent des styles en ligne (opacité de la rosace, géométrie
       des niches en pourcentages). */
    "style-src 'self' 'unsafe-inline'",
    /* Couvertures génératives et polices auto-hébergées : tout vient de
       chez nous. `data:` couvre les images en ligne de Next. */
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${supabase}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/**
 * Les en-têtes servis sur toutes les routes.
 *
 * `preload` est volontairement absent de HSTS : il engage le domaine auprès
 * des navigateurs, et se retire difficilement. C'est une décision de
 * déploiement, pas un réglage d'application.
 */
export function securityHeaders(
  options: SecurityOptions = {},
): SecurityHeader[] {
  return [
    {
      key: 'Content-Security-Policy',
      value: contentSecurityPolicy(options),
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains',
    },
    /* `frame-ancestors` le dit déjà aux navigateurs récents ; celui-ci reste
       pour les autres. Deux formulations, une seule règle. */
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    /* L'application n'emploie aucune de ces interfaces. */
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
  ];
}
