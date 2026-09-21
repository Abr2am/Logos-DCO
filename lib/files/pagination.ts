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
 */

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
      const slideCount = countZipEntries(bytes, /^ppt\/slides\/slide\d+\.xml$/);
      return { pageCount: null, slideCount: slideCount || null };
    }
  } catch {
    /* Pagination indéterminable : ce n'est pas une erreur de dépôt. */
  }

  return EMPTY;
}

/**
 * Compte les entrées d'un conteneur ZIP dont le nom correspond au motif.
 *
 * Parcourt le répertoire central, en partant de son marqueur de fin (EOCD).
 * Aucune décompression : seuls les noms d'entrées sont lus.
 */
function countZipEntries(bytes: Uint8Array, pattern: RegExp): number {
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
  if (eocd < 0) return 0;

  const entryCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);

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
