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
  validateUpload,
} from './validate';

/*
 * Validation des téléversements — invariant de sécurité n° 10.
 *
 * Ce que ces tests protègent : un fichier n'est accepté que si son extension,
 * son type MIME ET ses premiers octets concordent. Un conteneur ZIP n'est pas
 * rejeté au motif que c'en est un : PPTX, DOCX et XLSX en sont.
 */

const SIGNATURES = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  ooxml: [0x50, 0x4b, 0x03, 0x04],
  ole: [0xd0, 0xcf, 0x11, 0xe0],
};

function upload(name: string, type: string, head: number[], extra = 64): File {
  const bytes = new Uint8Array(head.length + extra);
  bytes.set(head, 0);
  return new File([bytes], name, { type });
}

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

describe('validateUpload', () => {
  test('accepte un PDF cohérent', async () => {
    const result = await validateUpload(
      upload('cours.pdf', 'application/pdf', SIGNATURES.pdf),
    );
    assert.ok(!isValidationError(result));
    assert.equal(result.format, 'PDF');
    assert.equal(result.filename, 'cours.pdf');
  });

  test('accepte les conteneurs ZIP que SONT les formats OOXML', async () => {
    for (const [name, mime] of [
      ['cours.docx', ACCEPTED_FORMATS.DOCX.mimeType],
      ['cours.pptx', ACCEPTED_FORMATS.PPTX.mimeType],
      ['cours.xlsx', ACCEPTED_FORMATS.XLSX.mimeType],
    ] as const) {
      const result = await validateUpload(upload(name, mime, SIGNATURES.ooxml));
      assert.ok(!isValidationError(result), name);
    }
  });

  test('accepte les conteneurs OLE2 des formats binaires', async () => {
    for (const [name, mime] of [
      ['cours.doc', ACCEPTED_FORMATS.DOC.mimeType],
      ['cours.ppt', ACCEPTED_FORMATS.PPT.mimeType],
      ['cours.xls', ACCEPTED_FORMATS.XLS.mimeType],
    ] as const) {
      const result = await validateUpload(upload(name, mime, SIGNATURES.ole));
      assert.ok(!isValidationError(result), name);
    }
  });

  test('refuse une extension hors liste blanche', async () => {
    const result = await validateUpload(
      upload('archive.zip', 'application/zip', SIGNATURES.ooxml),
    );
    assert.ok(isValidationError(result));
    assert.match(result.error, /Formats acceptés/);
  });

  test('refuse un type MIME qui ment sur l’extension', async () => {
    const result = await validateUpload(
      upload('cours.pdf', 'application/zip', SIGNATURES.pdf),
    );
    assert.ok(isValidationError(result));
    assert.match(result.error, /ne correspond pas à son extension/);
  });

  test('refuse un contenu qui ment sur son format', async () => {
    const result = await validateUpload(
      upload('cours.pdf', 'application/pdf', [0x4d, 0x5a, 0x00, 0x00]),
    );
    assert.ok(isValidationError(result));
    assert.match(result.error, /contenu du fichier/);
  });

  test('un exécutable renommé en .pdf est refusé', async () => {
    const result = await validateUpload(
      upload('innocent.pdf', 'application/pdf', [0x7f, 0x45, 0x4c, 0x46]),
    );
    assert.ok(isValidationError(result));
  });

  test('refuse un fichier vide ou absent', async () => {
    assert.ok(isValidationError(await validateUpload(null)));
    const vide = new File([], 'cours.pdf', { type: 'application/pdf' });
    assert.ok(isValidationError(await validateUpload(vide)));
  });

  test('refuse au-delà de la taille maximale', async () => {
    const trop = upload(
      'cours.pdf',
      'application/pdf',
      SIGNATURES.pdf,
      MAX_UPLOAD_BYTES,
    );
    const result = await validateUpload(trop);
    assert.ok(isValidationError(result));
    assert.match(result.error, /taille maximale/);
  });

  test('le nom retenu est assaini, jamais celui du client', async () => {
    const result = await validateUpload(
      upload('../../cours.pdf', 'application/pdf', SIGNATURES.pdf),
    );
    assert.ok(!isValidationError(result));
    assert.equal(result.filename, 'cours.pdf');
  });

  test('un type MIME absent ne bloque pas — la signature tranche', async () => {
    const result = await validateUpload(
      upload('cours.pdf', '', SIGNATURES.pdf),
    );
    assert.ok(!isValidationError(result));
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
