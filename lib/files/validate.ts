import 'server-only';

import type { FileFormat } from '@/lib/domain/resource';

import {
  ACCEPTED_FORMATS,
  MAX_UPLOAD_BYTES,
  formatFromExtension,
} from './formats';

/*
 * Validation des téléversements — CÔTÉ SERVEUR, sans aucune confiance dans ce
 * que le navigateur déclare.
 *
 * Trois contrôles indépendants, tous obligatoires :
 *   1. l'extension appartient à la liste blanche des sept formats ;
 *   2. le type MIME déclaré correspond exactement à cette extension ;
 *   3. les premiers octets du fichier correspondent au conteneur attendu.
 *
 * ⚠️ PPTX, DOCX et XLSX SONT des conteneurs ZIP : le contrôle ne rejette pas
 * « une archive », il vérifie que le conteneur est bien celui qu'annonce le
 * format déclaré. Un `.zip` renommé en `.pptx` passerait la signature — c'est
 * assumé et sans conséquence : le fichier n'est jamais exécuté, il est stocké
 * dans un bucket privé et servi en pièce jointe.
 */

export type ValidatedFile = {
  format: FileFormat;
  mimeType: string;
  filename: string;
  sizeBytes: number;
  bytes: Uint8Array;
};

export type ValidationError = { error: string };

const SIGNATURES = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  ooxml: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04
  ole: [0xd0, 0xcf, 0x11, 0xe0], // conteneur OLE2 (DOC, PPT, XLS)
} as const;

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

/** Retire toute composante de chemin et les caractères problématiques. */
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? '';
  const cleaned = base.replace(/["\r\n\u0000-\u001f\u007f]/g, '').trim();
  return cleaned.slice(0, 200);
}

export async function validateUpload(
  file: File | null,
): Promise<ValidatedFile | ValidationError> {
  if (!file || file.size === 0) {
    return { error: 'Joignez un fichier.' };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const max = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
    return { error: `Le fichier dépasse la taille maximale de ${max} Mo.` };
  }

  const filename = sanitizeFilename(file.name);
  const format = formatFromExtension(filename);
  if (!format) {
    return {
      error: 'Formats acceptés : PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX.',
    };
  }

  const spec = ACCEPTED_FORMATS[format];
  if (file.type && file.type !== spec.mimeType) {
    return { error: 'Le type du fichier ne correspond pas à son extension.' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!startsWith(bytes, SIGNATURES[spec.signature])) {
    return { error: 'Le contenu du fichier ne correspond pas à son format.' };
  }

  return {
    format,
    mimeType: spec.mimeType,
    filename,
    sizeBytes: bytes.byteLength,
    bytes,
  };
}

export function isValidationError(
  value: ValidatedFile | ValidationError,
): value is ValidationError {
  return 'error' in value;
}
