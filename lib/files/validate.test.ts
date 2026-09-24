import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  ACCEPTED_FORMATS,
  ACCEPT_ATTRIBUTE,
  MAX_UPLOAD_BYTES,
  formatFromExtension,
} from './formats';
import {
  isValidationError,
  sanitizeFilename,
  validateStoredFile,
  validateUploadRequest,
  type StoredObjectReader,
} from './validate';

/*
 * Validation des téléversements — invariant de sécurité n° 10.
 *
 * Ce que ces tests protègent : un fichier n'est accepté que si son extension,
 * son type MIME ET ses premiers octets concordent. Un conteneur ZIP n'est pas
 * rejeté au motif que c'en est un : PPTX, DOCX et XLSX en sont.
 *
 * Depuis l'upload direct, la preuve ne vient plus du formulaire mais de
 * STORAGE : `validateStoredFile` lit la taille, le type et la signature de
 * l'objet réellement déposé. La doublure ci-dessous joue ce rôle — aucun
 * réseau, aucune base.
 */

const SIGNATURES = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  ooxml: [0x50, 0x4b, 0x03, 0x04],
  ole: [0xd0, 0xcf, 0x11, 0xe0],
};

/** Objet tel que Storage le rapporte : taille, type, premiers octets. */
function stored(
  head: number[],
  options: { sizeBytes?: number; mimeType?: string | null } = {},
): StoredObjectReader {
  return {
    async stat() {
      return {
        sizeBytes: options.sizeBytes ?? 4096,
        mimeType: options.mimeType === undefined ? null : options.mimeType,
      };
    },
    async head(_path, length) {
      const bytes = new Uint8Array(length);
      bytes.set(head.slice(0, length), 0);
      return bytes;
    },
  };
}

const ABSENT: StoredObjectReader = {
  async stat() {
    return null;
  },
  async head() {
    return null;
  },
};

describe('formatFromExtension', () => {
  test('reconnaît les sept formats, casse indifférente', () => {
    for (const [format, spec] of Object.entries(ACCEPTED_FORMATS)) {
      assert.equal(formatFromExtension(`cours.${spec.extension}`), format);
      assert.equal(
        formatFromExtension(`cours.${spec.extension.toUpperCase()}`),
        format,
      );
    }
  });

  test('refuse tout le reste', () => {
    for (const nom of [
      'archive.zip',
      'programme.exe',
      'notes.txt',
      'image.png',
      'video.mp4',
      'sansextension',
      '.pdf.exe',
    ]) {
      assert.equal(formatFromExtension(nom), null, nom);
    }
  });

  test('seule la DERNIÈRE extension compte', () => {
    assert.equal(formatFromExtension('cours.pdf.zip'), null);
    assert.equal(formatFromExtension('cours.zip.pdf'), 'PDF');
  });
});

describe('sanitizeFilename', () => {
  test('retire toute composante de chemin', () => {
    assert.equal(sanitizeFilename('../../etc/passwd'), 'passwd');
    assert.equal(sanitizeFilename('C:\\Users\\moi\\cours.pdf'), 'cours.pdf');
    assert.equal(sanitizeFilename('/tmp/cours.pdf'), 'cours.pdf');
  });

  test('retire guillemets et caractères de contrôle', () => {
    assert.equal(sanitizeFilename('co"urs\r\n.pdf'), 'cours.pdf');
    assert.equal(sanitizeFilename('cours\u0000.pdf'), 'cours.pdf');
  });

  test('borne la longueur', () => {
    assert.equal(sanitizeFilename(`${'a'.repeat(400)}.pdf`).length, 200);
  });

  test('conserve les accents', () => {
    assert.equal(
      sanitizeFilename('séance d’Évangile.pdf'),
      'séance d’Évangile.pdf',
    );
  });
});

describe('validateUploadRequest — ce que le client déclare', () => {
  const PDF = { filename: 'cours.pdf', mimeType: 'application/pdf' };

  test('accepte une demande cohérente', () => {
    const result = validateUploadRequest({ ...PDF, sizeBytes: 4096 });
    assert.ok(!isValidationError(result));
    assert.equal(result.format, 'PDF');
    assert.equal(result.filename, 'cours.pdf');
    assert.equal(result.mimeType, 'application/pdf');
  });

  test('le type renvoyé est CELUI DU FORMAT, jamais celui du client', () => {
    const result = validateUploadRequest({
      filename: 'cours.pptx',
      mimeType: '',
      sizeBytes: 4096,
    });
    assert.ok(!isValidationError(result));
    assert.equal(result.mimeType, ACCEPTED_FORMATS.PPTX.mimeType);
  });

  test('refuse une extension hors liste blanche', () => {
    const result = validateUploadRequest({
      filename: 'archive.zip',
      mimeType: 'application/zip',
      sizeBytes: 4096,
    });
    assert.ok(isValidationError(result));
    assert.match(result.error, /Formats acceptés/);
  });

  test('refuse un type MIME qui ment sur l’extension', () => {
    const result = validateUploadRequest({
      filename: 'cours.pdf',
      mimeType: 'application/zip',
      sizeBytes: 4096,
    });
    assert.ok(isValidationError(result));
    assert.match(result.error, /ne correspond pas à son extension/);
  });

  test('refuse une taille nulle ou au-delà du plafond', () => {
    assert.ok(
      isValidationError(validateUploadRequest({ ...PDF, sizeBytes: 0 })),
    );
    const trop = validateUploadRequest({
      ...PDF,
      sizeBytes: MAX_UPLOAD_BYTES + 1,
    });
    assert.ok(isValidationError(trop));
    assert.match(trop.error, /taille maximale/);
  });

  test('le nom retenu est assaini', () => {
    const result = validateUploadRequest({
      filename: '../../cours.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4096,
    });
    assert.ok(!isValidationError(result));
    assert.equal(result.filename, 'cours.pdf');
  });
});

describe('validateStoredFile — ce que Storage rapporte', () => {
  test('accepte un PDF cohérent', async () => {
    const result = await validateStoredFile(stored(SIGNATURES.pdf), {
      path: 'u/1.pdf',
      filename: 'cours.pdf',
    });
    assert.ok(!isValidationError(result));
    assert.equal(result.format, 'PDF');
    assert.equal(result.sizeBytes, 4096);
  });

  test('accepte les conteneurs ZIP que SONT les formats OOXML', async () => {
    for (const [filename, mimeType] of [
      ['cours.docx', ACCEPTED_FORMATS.DOCX.mimeType],
      ['cours.pptx', ACCEPTED_FORMATS.PPTX.mimeType],
      ['cours.xlsx', ACCEPTED_FORMATS.XLSX.mimeType],
    ] as const) {
      const result = await validateStoredFile(
        stored(SIGNATURES.ooxml, { mimeType }),
        { path: 'u/1', filename },
      );
      assert.ok(!isValidationError(result), filename);
    }
  });

  test('accepte les conteneurs OLE2 des formats binaires', async () => {
    for (const [filename, mimeType] of [
      ['cours.doc', ACCEPTED_FORMATS.DOC.mimeType],
      ['cours.ppt', ACCEPTED_FORMATS.PPT.mimeType],
      ['cours.xls', ACCEPTED_FORMATS.XLS.mimeType],
    ] as const) {
      const result = await validateStoredFile(
        stored(SIGNATURES.ole, { mimeType }),
        { path: 'u/1', filename },
      );
      assert.ok(!isValidationError(result), filename);
    }
  });

  test('refuse un contenu qui ment sur son format', async () => {
    const result = await validateStoredFile(stored([0x4d, 0x5a, 0x00, 0x00]), {
      path: 'u/1.pdf',
      filename: 'cours.pdf',
    });
    assert.ok(isValidationError(result));
    assert.match(result.error, /contenu du fichier/);
  });

  test('un exécutable renommé en .pdf est refusé', async () => {
    const result = await validateStoredFile(stored([0x7f, 0x45, 0x4c, 0x46]), {
      path: 'u/1.pdf',
      filename: 'innocent.pdf',
    });
    assert.ok(isValidationError(result));
  });

  test('le type est celui de STORAGE, pas celui du formulaire', async () => {
    const result = await validateStoredFile(
      stored(SIGNATURES.pdf, { mimeType: 'application/zip' }),
      { path: 'u/1.pdf', filename: 'cours.pdf' },
    );
    assert.ok(isValidationError(result));
    assert.match(result.error, /ne correspond pas à son extension/);
  });

  test('la taille est celle de STORAGE : un gros fichier est refusé même si le formulaire annonçait petit', async () => {
    const result = await validateStoredFile(
      stored(SIGNATURES.pdf, { sizeBytes: MAX_UPLOAD_BYTES + 1 }),
      { path: 'u/1.pdf', filename: 'cours.pdf' },
    );
    assert.ok(isValidationError(result));
    assert.match(result.error, /taille maximale/);
  });

  test('refuse un objet absent ou vide', async () => {
    const absent = await validateStoredFile(ABSENT, {
      path: 'u/1.pdf',
      filename: 'cours.pdf',
    });
    assert.ok(isValidationError(absent));
    assert.match(absent.error, /introuvable/);

    const vide = await validateStoredFile(
      stored(SIGNATURES.pdf, { sizeBytes: 0 }),
      { path: 'u/1.pdf', filename: 'cours.pdf' },
    );
    assert.ok(isValidationError(vide));
  });

  test('refuse une extension hors liste blanche sans même lire l’objet', async () => {
    const result = await validateStoredFile(stored(SIGNATURES.ooxml), {
      path: 'u/1.zip',
      filename: 'archive.zip',
    });
    assert.ok(isValidationError(result));
    assert.match(result.error, /Formats acceptés/);
  });
});

describe('attribut accept', () => {
  test('ne décrit que les sept formats, extensions et types MIME', () => {
    const parts = ACCEPT_ATTRIBUTE.split(',');
    assert.equal(parts.length, 14);
    for (const interdit of ['.zip', '.exe', '.mp4', '*/*']) {
      assert.ok(!parts.includes(interdit), interdit);
    }
  });
});
