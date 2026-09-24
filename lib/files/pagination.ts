import 'server-only';

import { PDFDocument } from 'pdf-lib';

import type { FileFormat } from '@/lib/domain/resource';

/*
 * Détection automatique de la pagination — « lorsque possible ».
 *
 *   PDF   → nombre de pages.
 *   PPTX  → nombre de diapositives, lu dans le répertoire central du
 *           conteneur ZIP : il suffit d'énumérer les NOMS d'entrées, sans rien
 *           décompresser.
 *   PPT   → format binaire OLE2 : hors de portée sans bibliothèque dédiée.
 *   Autres → sans objet.
 *
 * Toute erreur de lecture renvoie `null` : une pagination inconnue est un cas
 * normal, que l'interface omet. Elle ne doit jamais faire échouer un dépôt.
 *
 * ── Depuis l'upload direct (24/09/2026) ─────────────────────────────────────
 * Le serveur n'a plus les octets sous la main : il les relit dans Storage.
 * `detectPaginationFromStorage` n'en demande donc que le strict nécessaire —
 * la QUEUE du conteneur pour un PPTX, le fichier entier pour un PDF et
 * seulement sous `PDF_PAGINATION_MAX_BYTES`. Au-delà, `pageCount` reste
 * `null` : c'est un arbitrage validé, pas une panne.
 */

/**
 * Au-delà de ce seuil, la pagination d'un PDF n'est plus détectée : `pdf-lib`
 * exige le document entier, et rapatrier 50 Mo dans une fonction serverless
 * pour un simple compteur n'en vaut pas le prix.
 */
export const PDF_PAGINATION_MAX_BYTES = 15 * 1024 * 1024;

/** Tailles de queue essayées pour retrouver le répertoire central d'un ZIP. */
const ZIP_TAIL_ATTEMPTS = [256 * 1024, 2 * 1024 * 1024] as const;

export type Pagination = {
  pageCount: number | null;
  slideCount: number | null;
};

const EMPTY: Pagination = { pageCount: null, slideCount: null };

export async function detectPagination(
  bytes: Uint8Array,
  format: FileFormat,
): Promise<Pagination> {
  try {
    if (format === 'PDF') {
      const document = await PDFDocument.load(bytes, {
        updateMetadata: false,
        ignoreEncryption: true,
      });
      const pageCount = document.getPageCount();
      return { pageCount: pageCount > 0 ? pageCount : null, slideCount: null };
    }

    if (format === 'PPTX') {
      const slideCount = countZipEntries(bytes, SLIDES, 0);
      return { pageCount: null, slideCount: slideCount || null };
    }
  } catch {
    /* Pagination indéterminable : ce n'est pas une erreur de dépôt. */
  }

  return EMPTY;
}

/**
 * Pagination d'un objet DÉJÀ DÉPOSÉ, lu par plages.
 *
 * Aucune erreur ne remonte : une pagination indéterminable vaut `null`, et un
 * dépôt n'échoue jamais pour cette raison.
 */
export async function detectPaginationFromStorage(
  reader: {
    tail(path: string, length: number): Promise<Uint8Array | null>;
    all(path: string): Promise<Uint8Array | null>;
  },
  input: { path: string; format: FileFormat; sizeBytes: number },
): Promise<Pagination> {
  try {
    if (input.format === 'PDF') {
      if (input.sizeBytes > PDF_PAGINATION_MAX_BYTES) return EMPTY;
      const bytes = await reader.all(input.path);
      return bytes ? await detectPagination(bytes, 'PDF') : EMPTY;
    }

    if (input.format === 'PPTX') {
      for (const length of ZIP_TAIL_ATTEMPTS) {
        if (length >= input.sizeBytes) {
          /* Le fichier tient dans la queue demandée : il est lu en entier. */
          const bytes = await reader.all(input.path);
          if (!bytes) return EMPTY;
          const count = countZipEntries(bytes, SLIDES, 0);
          return { pageCount: null, slideCount: count || null };
        }

        const tail = await reader.tail(input.path, length);
        if (!tail) return EMPTY;

        const count = countZipEntries(
          tail,
          SLIDES,
          input.sizeBytes - tail.length,
        );
        /* `null` = répertoire central hors de la queue lue : on réessaie plus
           large. `0` = lu, mais aucune diapositive. */
        if (count !== null)
          return { pageCount: null, slideCount: count || null };
      }
    }
  } catch {
    /* Pagination indéterminable : ce n'est pas une erreur de dépôt. */
  }

  return EMPTY;
}

const SLIDES = /^ppt\/slides\/slide\d+\.xml$/;

/**
 * Compte les entrées d'un conteneur ZIP dont le nom correspond au motif.
 *
 * Parcourt le répertoire central, en partant de son marqueur de fin (EOCD).
 * Aucune décompression : seuls les noms d'entrées sont lus.
 *
 * `base` est la position, dans le FICHIER, du premier octet de `bytes` : elle
 * vaut 0 sur un fichier entier, et le décalage de la queue lorsqu'on ne lit
 * que la fin de l'objet. Renvoie `null` si le répertoire central commence
 * avant la portion lue — l'appelant relit alors une queue plus longue.
 */
function countZipEntries(
  bytes: Uint8Array,
  pattern: RegExp,
  base: number,
): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const EOCD_SIGNATURE = 0x06054b50;
  const ENTRY_SIGNATURE = 0x02014b50;

  // Le commentaire final peut atteindre 65 535 octets.
  const searchStart = Math.max(0, bytes.length - 22 - 0xffff);
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= searchStart; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) return base === 0 ? 0 : null;

  const entryCount = view.getUint16(eocd + 10, true);
  const absolute = view.getUint32(eocd + 16, true);
  if (absolute < base) return null;
  let offset = absolute - base;

  const decoder = new TextDecoder();
  let matches = 0;

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.length) break;
    if (view.getUint32(offset, true) !== ENTRY_SIGNATURE) break;

    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);

    const name = decoder.decode(
      bytes.subarray(offset + 46, offset + 46 + nameLength),
    );
    if (pattern.test(name)) matches += 1;

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return matches;
}
