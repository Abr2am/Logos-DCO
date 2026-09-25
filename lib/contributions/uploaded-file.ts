/*
 * Le fichier déposé, tel que le formulaire l'annonce.
 *
 * Depuis l'upload direct, le navigateur dépose l'objet dans Storage puis
 * transmet un CHEMIN. Ce module dit seulement si un nouveau fichier a été
 * déposé, et lequel ; il ne valide rien — ni le format, ni la propriété du
 * chemin, qui relèvent de `claimUploadedFile` et de son miroir SQL.
 *
 * Pourquoi un module à part : `actions.ts` porte `'use server'` et ne peut
 * exporter que des fonctions asynchrones. Celle-ci est pure, donc testable
 * par `npm run test`.
 */

export type UploadedFileRef = {
  /** Chemin de l'objet dans le bucket. Interne au serveur. */
  storagePath: string;
  /** Nom d'origine, tel que le visiteur l'a choisi. */
  filename: string;
};

/**
 * `null` quand aucun fichier n'a été déposé — le cas ordinaire d'une
 * modification de métadonnées, qui doit laisser le fichier en place.
 */
export function readUploadedFileRef(
  formData: FormData,
): UploadedFileRef | null {
  const storagePath = String(formData.get('storagePath') ?? '').trim();
  if (!storagePath) return null;

  return {
    storagePath,
    filename: String(formData.get('filename') ?? '').trim(),
  };
}
