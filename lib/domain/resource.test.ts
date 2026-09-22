import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  AUDIENCES,
  FILE_FORMATS,
  RESOURCE_TYPES,
  fileFormatLine,
  resourceMetaLine,
} from './resource';

/*
 * Les libellés sont ceux du cahier des charges, mot pour mot. Ces tests sont
 * là pour qu'un renommage « qui ne fait de mal à personne » devienne rouge.
 */

describe('référentiels du cahier des charges', () => {
  test('sept types, huit publics, sept formats', () => {
    assert.equal(Object.keys(RESOURCE_TYPES).length, 7);
    assert.equal(Object.keys(AUDIENCES).length, 8);
    assert.equal(FILE_FORMATS.length, 7);
  });

  test('les libellés sont ceux de la spécification', () => {
    assert.equal(RESOURCE_TYPES.COURS_PRESENTATION, 'Cours / présentation');
    assert.equal(RESOURCE_TYPES.SUPPORT_DE_SEANCE, 'Support de séance');
    assert.equal(AUDIENCES.TOUS_PUBLICS, 'Tous les publics');
    assert.equal(AUDIENCES.PETITE_ENFANCE, 'Petite enfance');
  });

  test('aucun format exécutable ni archive', () => {
    for (const interdit of ['ZIP', 'EXE', 'RAR', 'MP4']) {
      assert.ok(!FILE_FORMATS.includes(interdit as never), interdit);
    }
  });
});

describe('fileFormatLine', () => {
  test('accorde le pluriel des pages', () => {
    const base = { format: 'PDF' as const, slideCount: null };
    assert.equal(fileFormatLine({ ...base, pageCount: 1 }), 'PDF · 1 page');
    assert.equal(fileFormatLine({ ...base, pageCount: 32 }), 'PDF · 32 pages');
  });

  test('accorde le pluriel des diapositives', () => {
    const base = { format: 'PPTX' as const, pageCount: null };
    assert.equal(
      fileFormatLine({ ...base, slideCount: 1 }),
      'PPTX · 1 diapositive',
    );
    assert.equal(
      fileFormatLine({ ...base, slideCount: 18 }),
      'PPTX · 18 diapositives',
    );
  });

  test('omet la pagination lorsqu’elle est inconnue', () => {
    assert.equal(
      fileFormatLine({ format: 'DOCX', pageCount: null, slideCount: null }),
      'DOCX',
    );
  });

  test('une pagination nulle ne produit pas « 0 page »', () => {
    assert.equal(
      fileFormatLine({ format: 'PDF', pageCount: 0, slideCount: null }),
      'PDF',
    );
  });

  test('sans format ni pagination, la ligne est vide', () => {
    assert.equal(
      fileFormatLine({ format: null, pageCount: null, slideCount: null }),
      '',
    );
  });

  test('les pages priment sur les diapositives', () => {
    assert.equal(
      fileFormatLine({ format: 'PDF', pageCount: 4, slideCount: 9 }),
      'PDF · 4 pages',
    );
  });
});

describe('resourceMetaLine', () => {
  test('type · format · pagination, et rien d’autre', () => {
    assert.equal(
      resourceMetaLine({
        resourceType: 'FICHE_PEDAGOGIQUE',
        format: 'PDF',
        pageCount: 12,
        slideCount: null,
      }),
      'Fiche pédagogique · PDF · 12 pages',
    );
  });

  test('le type seul suffit quand le fichier est inconnu', () => {
    assert.equal(
      resourceMetaLine({
        resourceType: 'JEU',
        format: null,
        pageCount: null,
        slideCount: null,
      }),
      'Jeu',
    );
  });

  test('aucun séparateur orphelin', () => {
    const line = resourceMetaLine({
      resourceType: 'AUTRE',
      format: null,
      pageCount: null,
      slideCount: null,
    });
    assert.ok(!line.includes('·'), line);
    assert.equal(line.trim(), line);
  });
});
