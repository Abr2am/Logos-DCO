import type { FileFormat } from '@/lib/domain/resource';

/*
 * Formats acceptés — les sept du MVP, et rien d'autre.
 * Aucun exécutable, aucune archive.
 */

type FormatSpec = {
  extension: string;
  mimeType: string;
  /** Signature attendue en tête de fichier. */
  signature: 'pdf' | 'ooxml' | 'ole';
};

export const ACCEPTED_FORMATS: Record<FileFormat, FormatSpec> = {
  PDF: { extension: 'pdf', mimeType: 'application/pdf', signature: 'pdf' },
  DOC: {
    extension: 'doc',
    mimeType: 'application/msword',
    signature: 'ole',
  },
  DOCX: {
    extension: 'docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    signature: 'ooxml',
  },
  PPT: {
    extension: 'ppt',
    mimeType: 'application/vnd.ms-powerpoint',
    signature: 'ole',
  },
  PPTX: {
    extension: 'pptx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    signature: 'ooxml',
  },
  XLS: {
    extension: 'xls',
    mimeType: 'application/vnd.ms-excel',
    signature: 'ole',
  },
  XLSX: {
    extension: 'xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    signature: 'ooxml',
  },
};

/** Attribut `accept` du champ de fichier — confort, jamais une validation. */
export const ACCEPT_ATTRIBUTE = Object.values(ACCEPTED_FORMATS)
  .flatMap((spec) => [`.${spec.extension}`, spec.mimeType])
  .join(',');

/**
 * Taille maximale d'un téléversement.
 *
 * ⚠️ NON SPÉCIFIÉE par le cahier des charges, qui exige une limite sans en
 * fixer la valeur. 10 Mo est une valeur d'attente : c'est la SEULE constante à
 * changer, ici et dans `next.config.ts`, le jour où elle sera tranchée.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function formatFromExtension(filename: string): FileFormat | null {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const entry = Object.entries(ACCEPTED_FORMATS).find(
    ([, spec]) => spec.extension === extension,
  );
  return (entry?.[0] as FileFormat) ?? null;
}
