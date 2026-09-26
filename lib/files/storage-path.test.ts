import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { ACCEPTED_FORMATS } from './formats';
import { buildStoragePath, isOwnedBy } from './storage-path';

/*
 * Propriété d'un chemin de stockage — la garde de l'upload direct.
 *
 * Depuis que le navigateur dépose lui-même le fichier, le chemin fait
 * l'aller-retour par le client. `isOwnedBy` est la vérification côté
 * application ; la MÊME règle est répétée en base par `owns_storage_path`,
 * qui, elle, fait foi (voir `supabase/tests/80_contribution.sql`).
 */

const ALICE = '11111111-1111-1111-1111-111111111111';
const BOB = '22222222-2222-2222-2222-222222222222';

describe('buildStoragePath', () => {
  test('préfixe par le dépositaire et termine par l’extension du format', () => {
    for (const [format, spec] of Object.entries(ACCEPTED_FORMATS)) {
      const path = buildStoragePath(
        ALICE,
        format as keyof typeof ACCEPTED_FORMATS,
      );
      assert.ok(path.startsWith(`${ALICE}/`), path);
      assert.ok(path.endsWith(`.${spec.extension}`), path);
      assert.ok(isOwnedBy(path, ALICE));
    }
  });

  test('ne contient jamais le nom d’origine', () => {
    const path = buildStoragePath(ALICE, 'PDF');
    assert.equal(path.split('/').length, 2);
    assert.match(path.split('/')[1] ?? '', /^[0-9a-f-]{36}\.pdf$/);
  });

  test('deux dépôts ne se marchent pas dessus', () => {
    assert.notEqual(
      buildStoragePath(ALICE, 'PDF'),
      buildStoragePath(ALICE, 'PDF'),
    );
  });
});

describe('isOwnedBy', () => {
  test('accepte le chemin du dépositaire', () => {
    assert.ok(isOwnedBy(`${ALICE}/fichier.pdf`, ALICE));
  });

  test('refuse le préfixe d’un autre dépositaire', () => {
    assert.ok(!isOwnedBy(`${BOB}/fichier.pdf`, ALICE));
  });

  test('refuse un chemin sans préfixe', () => {
    assert.ok(!isOwnedBy('fichier.pdf', ALICE));
    assert.ok(!isOwnedBy('/fichier.pdf', ALICE));
  });

  test('refuse une traversée de répertoire', () => {
    assert.ok(!isOwnedBy(`${ALICE}/../${BOB}/vol.pdf`, ALICE));
    assert.ok(!isOwnedBy(`${ALICE}//${BOB}/vol.pdf`, ALICE));
  });

  test('refuse le préfixe seul, sans nom de fichier', () => {
    assert.ok(!isOwnedBy(`${ALICE}/`, ALICE));
  });

  test('refuse un préfixe qui n’en est pas un', () => {
    /* Un identifiant dont un autre serait le début ne doit rien ouvrir. */
    assert.ok(!isOwnedBy(`${ALICE}bis/fichier.pdf`, ALICE));
  });

  test('refuse un utilisateur vide', () => {
    assert.ok(!isOwnedBy('/fichier.pdf', ''));
  });
});
