import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { PDFDocument } from 'pdf-lib';

import { detectPagination } from './pagination';

/*
 * « Métadonnées page_count / slide_count lorsque possible. »
 *
 * Le contrat tient en deux phrases : la pagination est détectée quand elle
 * est lisible, et une pagination indéterminable rend `null` — JAMAIS une
 * erreur. Un dépôt ne doit pas échouer parce qu'un fichier est exotique.
 */

async function pdf(pages: number): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  for (let i = 0; i < pages; i += 1) document.addPage();
  return document.save();
}

/**
 * Fabrique un conteneur ZIP minimal — entrées non compressées — portant les
 * noms donnés. C'est la structure d'un PPTX, réduite à ce que la détection
 * lit réellement : le répertoire central.
 */
function zip(names: string[]): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const name of names) {
    const raw = encoder.encode(name);

    const local = new Uint8Array(30 + raw.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(26, raw.length, true);
    local.set(raw, 30);
    locals.push(local);

    const central = new Uint8Array(46 + raw.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(28, raw.length, true);
    centralView.setUint32(42, offset, true);
    central.set(raw, 46);
    centrals.push(central);

    offset += local.length;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, names.length, true);
  eocdView.setUint16(10, names.length, true);
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, offset, true);

  const parts = [...locals, ...centrals, eocd];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

describe('detectPagination — PDF', () => {
  test('compte les pages', async () => {
    assert.deepEqual(await detectPagination(await pdf(1), 'PDF'), {
      pageCount: 1,
      slideCount: null,
    });
    assert.deepEqual(await detectPagination(await pdf(24), 'PDF'), {
      pageCount: 24,
      slideCount: null,
    });
  });

  test('un PDF illisible ne fait pas échouer le dépôt', async () => {
    const result = await detectPagination(
      new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x01]),
      'PDF',
    );
    assert.deepEqual(result, { pageCount: null, slideCount: null });
  });
});

describe('detectPagination — PPTX', () => {
  test('compte les diapositives sans rien décompresser', async () => {
    const bytes = zip([
      '[Content_Types].xml',
      'ppt/presentation.xml',
      'ppt/slides/slide1.xml',
      'ppt/slides/slide2.xml',
      'ppt/slides/slide3.xml',
      'ppt/slideLayouts/slideLayout1.xml',
      'ppt/media/image1.png',
    ]);
    assert.deepEqual(await detectPagination(bytes, 'PPTX'), {
      pageCount: null,
      slideCount: 3,
    });
  });

  test('ne confond pas les masques et les mises en page', async () => {
    const bytes = zip([
      'ppt/slideMasters/slideMaster1.xml',
      'ppt/slideLayouts/slideLayout1.xml',
      'ppt/slideLayouts/slideLayout2.xml',
    ]);
    assert.equal((await detectPagination(bytes, 'PPTX')).slideCount, null);
  });

  test('un conteneur illisible rend null', async () => {
    const result = await detectPagination(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]),
      'PPTX',
    );
    assert.deepEqual(result, { pageCount: null, slideCount: null });
  });
});

describe('detectPagination — formats sans objet', () => {
  test('ni page ni diapositive pour les autres formats', async () => {
    for (const format of ['DOC', 'DOCX', 'PPT', 'XLS', 'XLSX'] as const) {
      assert.deepEqual(
        await detectPagination(new Uint8Array(8), format),
        { pageCount: null, slideCount: null },
        format,
      );
    }
  });
});
