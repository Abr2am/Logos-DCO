import type { FileFormat } from '@/lib/domain/resource';

import {
  ACCEPTED_FORMATS,
  MAX_UPLOAD_BYTES,
  formatFromExtension,
} from './formats';

/*
 * Validation des téléversements — CÔTÉ SERVEUR, sans aucune confiance dans ce
 * que le navigateur déclare. Invariant de sécurité n° 10.
 *
 * ── Depuis l'upload direct (24/09/2026) ─────────────────────────────────────
 * Le fichier ne transite plus par la fonction serveur : il va du navigateur à
 * Storage. La validation se fait donc EN DEUX TEMPS :
 *
 *   1. `validateUploadRequest` — avant de signer l'URL. Ne voit que ce que le
 *      client déclare : c'est un filtre de confort, qui évite de signer une
 *      URL pour un `.exe`. Il ne prouve rien.
 *   2. `validateStoredFile` — après le dépôt, avant que la ressource
 *      n'existe. Il lit l'objet RÉELLEMENT stocké : sa taille et son type
 *      selon Storage, et ses premiers octets. C'est LUI qui fait foi.
 *
 * Trois contrôles indépendants, tous obligatoires, au temps 2 :
 *   · l'extension appartient à la liste blanche des sept formats ;
 *   · le type enregistré par Storage correspond exactement à cette extension ;
 *   · les premiers octets correspondent au conteneur attendu.
 *
 * ⚠️ PPTX, DOCX et XLSX SONT des conteneurs ZIP : le contrôle ne rejette pas
 * « une archive », il vérifie que le conteneur est bien celui qu'annonce le
 * format déclaré. Un `.zip` renommé en `.pptx` passerait la signature — c'est
 * assumé et sans conséquence : le fichier n'est jamais exécuté, il vit dans un
 * bucket privé et n'est servi qu'en pièce jointe, après publication.
 *
 * Ce module est PUR : il ne connaît ni Supabase, ni le réseau. Il reçoit un
 * lecteur (`StoredObjectReader`), ce qui le rend testable sans base.
 */

export type ValidatedFile = {
  format: FileFormat;
  mimeType: string;
  filename: string;
  sizeBytes: number;
};

export type ValidationError = { error: string };

/** Ce que le formulaire annonce avant le dépôt — jamais une preuve. */
export type UploadRequest = {
  filename: string;
  sizeBytes: number;
  /** Type déclaré par le navigateur. Vide est acceptable. */
  mimeType?: string;
};

/**
 * Accès en lecture à un objet du bucket, réduit au strict nécessaire.
 * L'implémentation Supabase vit dans `storage-reader.ts` ; les tests en
 * fournissent une doublure.
 */
export type StoredObjectReader = {
  /** Taille et type enregistrés par Storage. `null` si l'objet n'existe pas. */
  stat(
    path: string,
  ): Promise<{ sizeBytes: number; mimeType: string | null } | null>;
  /** Les `length` premiers octets de l'objet. */
  head(path: string, length: number): Promise<Uint8Array | null>;
};

const SIGNATURES = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  ooxml: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04
  ole: [0xd0, 0xcf, 0x11, 0xe0], // conteneur OLE2 (DOC, PPT, XLS)
} as const;

/** Longueur lue en tête d'objet : la plus longue signature fait 4 octets. */
export const SIGNATURE_BYTES = 8;

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

function tooLarge(): ValidationError {
  const max = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
  return { error: `Le fichier dépasse la taille maximale de ${max} Mo.` };
}

const WRONG_FORMAT: ValidationError = {
  error: 'Formats acceptés : PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX.',
};

/** Retire toute composante de chemin et les caractères problématiques. */
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? '';
  const cleaned = base.replace(/["\r\n\u0000-\u001f\u007f]/g, '').trim();
  return cleaned.slice(0, 200);
}

/**
 * Temps 1 — avant de signer l'URL de dépôt.
 *
 * Tout ici vient du client et peut mentir ; ces contrôles évitent simplement
 * de signer une URL pour un fichier manifestement hors périmètre. La preuve
 * vient de `validateStoredFile`.
 */
export function validateUploadRequest(
  request: UploadRequest,
): ValidatedFile | ValidationError {
  if (!request.sizeBytes || request.sizeBytes <= 0) {
    return { error: 'Joignez un fichier.' };
  }
  if (request.sizeBytes > MAX_UPLOAD_BYTES) return tooLarge();

  const filename = sanitizeFilename(request.filename);
  const format = formatFromExtension(filename);
  if (!format) return WRONG_FORMAT;

  const spec = ACCEPTED_FORMATS[format];
  if (request.mimeType && request.mimeType !== spec.mimeType) {
    return { error: 'Le type du fichier ne correspond pas à son extension.' };
  }

  return {
    format,
    mimeType: spec.mimeType,
    filename,
    sizeBytes: request.sizeBytes,
  };
}

/**
 * Temps 2 — l'objet est déposé, la ressource n'existe pas encore.
 *
 * La taille et le type viennent de STORAGE, pas du formulaire : c'est ce qui
 * rend l'upload direct aussi sûr que l'ancien passage par le serveur.
 */
export async function validateStoredFile(
  reader: StoredObjectReader,
  input: { path: string; filename: string },
): Promise<ValidatedFile | ValidationError> {
  const filename = sanitizeFilename(input.filename);
  const format = formatFromExtension(filename);
  if (!format) return WRONG_FORMAT;

  const stat = await reader.stat(input.path);
  if (!stat) return { error: 'Le fichier téléversé est introuvable.' };
  if (stat.sizeBytes <= 0) return { error: 'Joignez un fichier.' };
  if (stat.sizeBytes > MAX_UPLOAD_BYTES) return tooLarge();

  const spec = ACCEPTED_FORMATS[format];
  if (stat.mimeType && stat.mimeType !== spec.mimeType) {
    return { error: 'Le type du fichier ne correspond pas à son extension.' };
  }

  const head = await reader.head(input.path, SIGNATURE_BYTES);
  if (!head || !startsWith(head, SIGNATURES[spec.signature])) {
    return { error: 'Le contenu du fichier ne correspond pas à son format.' };
  }

  return {
    format,
    mimeType: spec.mimeType,
    filename,
    sizeBytes: stat.sizeBytes,
  };
}

export function isValidationError(
  value: ValidatedFile | ValidationError,
): value is ValidationError {
  return 'error' in value;
}
