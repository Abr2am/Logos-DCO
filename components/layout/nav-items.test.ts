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
 * tests tiennent les règles du 25/09/2026 : aucune barre ne porte plus
 * « Partager un cours » — l'accueil s'en charge, par ses appels à l'action —
 * et « Mon compte » est un vrai lien.
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
  test('se réduit à l’accueil et à la bibliothèque', () => {
    assert.deepEqual(
      NAV_ITEMS.map((item) => item.href),
      ['/', '/bibliotheque'],
    );
  });

  test('l’entrée de compte mène à la connexion', () => {
    assert.equal(ACCOUNT_ITEM.label, 'Connexion');
    assert.equal(ACCOUNT_ITEM.href, '/connexion');
  });

  test('le visiteur voit donc : Accueil · Bibliothèque · Connexion', () => {
    assert.deepEqual(
      [...NAV_ITEMS, ACCOUNT_ITEM].map((item) => item.label),
      ['Accueil', 'Bibliothèque', 'Connexion'],
    );
  });
});

describe('« Partager un cours »', () => {
  test('ne figure dans aucune barre, connecté ou non', () => {
    for (const bar of [NAV_ITEMS, MEMBER_NAV_ITEMS]) {
      assert.ok(!bar.some((item) => item.href === '/partager'));
      assert.ok(!bar.some((item) => item.label === 'Partager un cours'));
    }
  });
});

describe('navigation d’un membre connecté', () => {
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
