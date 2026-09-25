/*
 * Ce qu'un téléchargement a de commun, quel que soit son destinataire.
 *
 * Deux routes délivrent un fichier du bucket privé, et une seule règle vaut
 * pour les deux : une URL signée de courte durée, qui force la pièce jointe.
 *
 *   · `/api/telechargement/[id]`        public, ressources PUBLIÉES
 *   · `/api/admin/telechargement/[id]`  administration, tous statuts
 *
 * ⚠️ La route publique porte encore sa propre copie de `safeFilename` : elle
 * est hors du périmètre de cette évolution et n'a pas été touchée. Les deux
 * copies sont identiques ; les réunir sera une modification à part entière.
 */

/** Validité d'une URL signée de téléchargement, en secondes. */
export const SIGNED_URL_TTL = 60;

/**
 * Redirection vers l'URL signée — **jamais mise en cache**.
 *
 * L'URL porte un jeton valable une minute. Un cache partagé — proxy
 * d'entreprise, cache de navigateur, intermédiaire quelconque — qui
 * conserverait ce 302 le rejouerait pour un autre visiteur, et servirait le
 * fichier sans repasser par la vérification de statut ni de rôle.
 *
 * ⚠️ La réponse est construite à la main : les en-têtes de
 * `Response.redirect()` sont immuables, `headers.set()` y lève un
 * `TypeError`.
 */
export function signedFileRedirect(signedUrl: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: signedUrl,
      'cache-control': 'no-store',
    },
  });
}

/**
 * Le nom de fichier vient de la base et finit dans un en-tête HTTP.
 *
 * On en retire donc tout ce qui pourrait en sortir — guillemets, retours à la
 * ligne, caractères de contrôle — ainsi que toute composante de chemin.
 */
export function safeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? 'ressource';
  const cleaned = base.replace(/["\r\n\u0000-\u001f\u007f]/g, '').trim();
  return cleaned || 'ressource';
}
