import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { PDFDocument } from 'pdf-lib';

import {
  PDF_PAGINATION_MAX_BYTES,
  detectPagination,
  detectPaginationFromStorage,
} from './pagination';

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

/*
 * Depuis l'upload direct, le serveur ne tient plus les octets : il les relit
 * dans Storage, par plages. Ces tests décrivent ce contrat — et surtout ce
 * qu'il NE lit PAS.
 */

/** Conteneur ZIP volumineux : une entrée porte un bourrage de `filler` octets. */
function bigZip(names: string[], filler: number): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  names.forEach((name, index) => {
    const raw = encoder.encode(name);
    const data = index === 0 ? filler : 0;

    const local = new Uint8Array(30 + raw.length + data);
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
  });

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

/** Lecteur de plages, qui note ce qu'on lui a demandé. */
function reader(bytes: Uint8Array) {
  const calls = { tail: [] as number[], all: 0 };
  return {
    calls,
    async tail(_path: string, length: number) {
      calls.tail.push(length);
      return bytes.slice(Math.max(0, bytes.length - length));
    },
    async all() {
      calls.all += 1;
      return bytes;
    },
  };
}

const SLIDES = (count: number) =>
  Array.from({ length: count }, (_, i) => `ppt/slides/slide${i + 1}.xml`);

describe('detectPaginationFromStorage — PPTX', () => {
  test('lit la QUEUE du conteneur, jamais le fichier entier', async () => {
    const bytes = bigZip([...SLIDES(18), 'ppt/presentation.xml'], 400 * 1024);
    const source = reader(bytes);

    const result = await detectPaginationFromStorage(source, {
      path: 'u/1.pptx',
      format: 'PPTX',
      sizeBytes: bytes.length,
    });

    assert.deepEqual(result, { pageCount: null, slideCount: 18 });
    assert.equal(source.calls.all, 0, 'le fichier entier ne doit pas être lu');
    assert.deepEqual(source.calls.tail, [256 * 1024]);
  });

  test('relit une queue plus large si le répertoire central déborde', async () => {
    /* Beaucoup d'entrées aux noms longs : le répertoire central dépasse la
       première queue demandée. */
    const padding = 'x'.repeat(180);
    const names = [
      ...SLIDES(7),
      ...Array.from({ length: 1400 }, (_, i) => `ppt/media/${padding}${i}.bin`),
    ];
    /* Le fichier dépasse la seconde queue : les deux lectures sont donc de
       vraies plages, et le fichier n'est jamais rapatrié. */
    const bytes = bigZip(names, 3 * 1024 * 1024);
    const source = reader(bytes);

    const result = await detectPaginationFromStorage(source, {
      path: 'u/1.pptx',
      format: 'PPTX',
      sizeBytes: bytes.length,
    });

    assert.equal(result.slideCount, 7);
    assert.deepEqual(source.calls.tail, [256 * 1024, 2 * 1024 * 1024]);
    assert.equal(source.calls.all, 0);
  });

  test('un petit fichier est lu en entier — pas de plage inutile', async () => {
    const bytes = bigZip(SLIDES(3), 0);
    const source = reader(bytes);

    const result = await detectPaginationFromStorage(source, {
      path: 'u/1.pptx',
      format: 'PPTX',
      sizeBytes: bytes.length,
    });

    assert.equal(result.slideCount, 3);
    assert.equal(source.calls.all, 1);
    assert.deepEqual(source.calls.tail, []);
  });
});

describe('detectPaginationFromStorage — PDF', () => {
  test('compte les pages sous le seuil', async () => {
    const bytes = await pdf(12);
    const source = reader(bytes);

    const result = await detectPaginationFromStorage(source, {
      path: 'u/1.pdf',
      format: 'PDF',
      sizeBytes: bytes.length,
    });

    assert.deepEqual(result, { pageCount: 12, slideCount: null });
    assert.equal(source.calls.all, 1);
  });

  test('au-delà du seuil, la pagination reste inconnue SANS rien télécharger', async () => {
    const source = reader(await pdf(4));

    const result = await detectPaginationFromStorage(source, {
      path: 'u/1.pdf',
      format: 'PDF',
      sizeBytes: PDF_PAGINATION_MAX_BYTES + 1,
    });

    assert.deepEqual(result, { pageCount: null, slideCount: null });
    assert.equal(source.calls.all, 0, 'un gros PDF ne doit pas être rapatrié');
  });

  test('un lecteur en échec ne fait pas échouer le dépôt', async () => {
    const result = await detectPaginationFromStorage(
      {
        async tail() {
          return null;
        },
        async all() {
          throw new Error('storage indisponible');
        },
      },
      { path: 'u/1.pdf', format: 'PDF', sizeBytes: 4096 },
    );
    assert.deepEqual(result, { pageCount: null, slideCount: null });
  });
});
