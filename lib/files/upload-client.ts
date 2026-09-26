/*
 * Dépôt du fichier — NAVIGATEUR → STORAGE, sans passer par le serveur.
 *
 * C'est ce qui lève la limite de corps de requête de l'hébergeur : l'octet ne
 * traverse jamais la fonction. L'URL est signée par le serveur pour UN chemin
 * précis, elle expire, et `x-upsert: false` interdit d'écraser un objet.
 *
 * ⚠️ `XMLHttpRequest` et non `fetch` : seul XHR expose la progression d'un
 * envoi. Sur un fichier de plusieurs dizaines de méga-octets, depuis un
 * téléphone, un formulaire sans retour paraîtrait figé.
 *
 * Le `content-type` envoyé est celui que le SERVEUR a retenu pour le format,
 * jamais celui que déclare le système du visiteur : c'est ce type que Storage
 * enregistre, et que la validation d'après dépôt vérifiera.
 */

export type UploadToSignedUrl = {
  signedUrl: string;
  file: File;
  mimeType: string;
  /** Fraction envoyée, de 0 à 1. */
  onProgress?: (ratio: number) => void;
};

export function putToSignedUrl({
  signedUrl,
  file,
  mimeType,
  onProgress,
}: UploadToSignedUrl): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', signedUrl, true);
    request.setRequestHeader('content-type', mimeType);
    request.setRequestHeader('cache-control', 'max-age=3600');
    request.setRequestHeader('x-upsert', 'false');

    /* Clé anonyme : publique par construction, elle n'autorise rien par
       elle-même. C'est le jeton contenu dans l'URL signée qui permet
       l'écriture, et seulement à ce chemin. */
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
      request.setRequestHeader('apikey', anonKey);
      request.setRequestHeader('authorization', `Bearer ${anonKey}`);
    }

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    });

    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }
      reject(new Error(`Storage ${request.status}`));
    });

    request.addEventListener('error', () =>
      reject(new Error('réseau interrompu')),
    );
    request.addEventListener('abort', () => reject(new Error('interrompu')));

    request.send(file);
  });
}
