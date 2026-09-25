import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  ACCOUNT_ITEM,
  ACCOUNT_ITEM_SIGNED_IN,
  MEMBER_NAV_ITEMS,
  NAV_ITEMS,
} from './nav-items';

/*
 * La navigation est une LISTE FERMÉE, et elle diffère selon la session. Ces
 * tests tiennent les deux règles du 25/09/2026 : la barre publique ne change
 * pas, et celle d'un membre connecté ne porte plus « Partager un cours ».
 */

/** Les routes de la liste fermée de CLAUDE.md, seules destinations permises. */
const ROUTES = [
  '/',
  '/bibliotheque',
  '/ressource',
  '/connexion',
  '/compte',
  '/partager',
  '/mes-contributions',
  '/mes-questions',
  '/admin',
];

describe('navigation du visiteur', () => {
  test('reste inchangée : accueil, bibliothèque, partager', () => {
    assert.deepEqual(
      NAV_ITEMS.map((item) => item.href),
      ['/', '/bibliotheque', '/partager'],
    );
  });

  test('l’entrée de compte mène à la connexion', () => {
    assert.equal(ACCOUNT_ITEM.label, 'Connexion');
    assert.equal(ACCOUNT_ITEM.href, '/connexion');
  });
});

describe('navigation d’un membre connecté', () => {
  test('ne porte plus « Partager un cours »', () => {
    assert.ok(!MEMBER_NAV_ITEMS.some((item) => item.href === '/partager'));
    assert.ok(
      !MEMBER_NAV_ITEMS.some((item) => item.label === 'Partager un cours'),
    );
  });

  test('« Mon compte » est un vrai lien, en dernière position', () => {
    assert.equal(ACCOUNT_ITEM_SIGNED_IN.label, 'Mon compte');
    assert.equal(ACCOUNT_ITEM_SIGNED_IN.href, '/compte');
    assert.deepEqual(MEMBER_NAV_ITEMS.at(-1), ACCOUNT_ITEM_SIGNED_IN);
  });

  test('conserve l’accueil et la bibliothèque, dans l’ordre', () => {
    assert.deepEqual(
      MEMBER_NAV_ITEMS.map((item) => item.href),
      ['/', '/bibliotheque', '/compte'],
    );
  });
});

describe('liste fermée', () => {
  test('aucune entrée ne sort des routes prévues', () => {
    for (const item of [...NAV_ITEMS, ...MEMBER_NAV_ITEMS, ACCOUNT_ITEM]) {
      assert.ok(ROUTES.includes(item.href), item.href);
    }
  });

  test('aucun doublon dans une même barre', () => {
    for (const bar of [NAV_ITEMS, MEMBER_NAV_ITEMS]) {
      const hrefs = bar.map((item) => item.href);
      assert.equal(new Set(hrefs).size, hrefs.length);
    }
  });
});
