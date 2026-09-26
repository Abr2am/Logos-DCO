import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { libraryHref, readFlags, readQuery } from './url';

/*
 * L'URL porte l'état. Ces tests fixent le contrat des liens de branche et des
 * paramètres de filtre, que la bibliothèque et l'accueil partagent.
 */

describe('libraryHref', () => {
  test('sans critère, la bibliothèque nue', () => {
    assert.equal(libraryHref({}), '/bibliotheque');
  });

  test('branche de catégorie puis de sous-catégorie', () => {
    assert.equal(
      libraryHref({ categorySlug: 'saints' }),
      '/bibliotheque/saints',
    );
    assert.equal(
      libraryHref({
        categorySlug: 'vie-chretienne',
        subcategorySlug: 'famille',
      }),
      '/bibliotheque/vie-chretienne/famille',
    );
  });

  test('une sous-catégorie sans catégorie est ignorée', () => {
    assert.equal(libraryHref({ subcategorySlug: 'famille' }), '/bibliotheque');
  });

  test('la recherche est détourée, et une recherche vide disparaît', () => {
    assert.equal(
      libraryHref({ query: '  évangile  ' }),
      '/bibliotheque?q=%C3%A9vangile',
    );
    assert.equal(libraryHref({ query: '   ' }), '/bibliotheque');
    assert.equal(libraryHref({ query: null }), '/bibliotheque');
  });

  test('plusieurs flags sont répétés, jamais concaténés', () => {
    assert.equal(
      libraryHref({ flags: ['Évangiles', 'Jeunesse'] }),
      '/bibliotheque?flags=%C3%89vangiles&flags=Jeunesse',
    );
  });

  test('branche, recherche et flags se combinent', () => {
    assert.equal(
      libraryHref({ categorySlug: 'bible', query: 'marc', flags: ['Séance'] }),
      '/bibliotheque/bible?q=marc&flags=S%C3%A9ance',
    );
  });

  test('aucune limite ni pagination n’entre dans l’URL', () => {
    const href = libraryHref({ categorySlug: 'bible', query: 'marc' });
    for (const interdit of ['page=', 'limit=', 'offset=', 'per_page']) {
      assert.ok(!href.includes(interdit), interdit);
    }
  });
});

describe('readFlags', () => {
  test('absent, unique ou répété', () => {
    assert.deepEqual(readFlags(undefined), []);
    assert.deepEqual(readFlags('Jeunesse'), ['Jeunesse']);
    assert.deepEqual(readFlags(['Jeunesse', 'Évangiles']), [
      'Jeunesse',
      'Évangiles',
    ]);
  });

  test('détoure, écarte les vides et déduplique', () => {
    assert.deepEqual(readFlags([' Jeunesse ', '', 'Jeunesse', '   ']), [
      'Jeunesse',
    ]);
  });

  test('l’ordre de première apparition est conservé', () => {
    assert.deepEqual(readFlags(['b', 'a', 'b', 'c']), ['b', 'a', 'c']);
  });
});

describe('readQuery', () => {
  test('détoure, et rend une chaîne vide à défaut', () => {
    assert.equal(readQuery('  marc '), 'marc');
    assert.equal(readQuery(undefined), '');
    assert.equal(readQuery('   '), '');
  });

  test('un paramètre répété : le premier fait foi', () => {
    assert.equal(readQuery(['marc', 'luc']), 'marc');
  });
});
