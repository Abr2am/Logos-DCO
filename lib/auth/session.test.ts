import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { safeReturnPath } from './session';

/*
 * `safeReturnPath` garde le paramètre `?suivant=` de la connexion. Sans lui,
 * une redirection ouverte permettrait d'envoyer un utilisateur fraîchement
 * authentifié vers un domaine étranger depuis un lien qui porte le nom de
 * Logos. Seul un chemin interne est accepté.
 */

describe('safeReturnPath', () => {
  test('accepte un chemin interne', () => {
    assert.equal(safeReturnPath('/partager'), '/partager');
    assert.equal(
      safeReturnPath('/bibliotheque/saints'),
      '/bibliotheque/saints',
    );
    assert.equal(safeReturnPath('/'), '/');
  });

  test('refuse une absence de valeur', () => {
    assert.equal(safeReturnPath(null), null);
    assert.equal(safeReturnPath(undefined), null);
    assert.equal(safeReturnPath(''), null);
  });

  test('refuse une URL absolue', () => {
    for (const cible of [
      'https://exemple-malveillant.test/phishing',
      'http://exemple-malveillant.test',
      'javascript:alert(1)',
      'data:text/html,<script>',
    ]) {
      assert.equal(safeReturnPath(cible), null, cible);
    }
  });

  test('refuse une URL protocole-relative', () => {
    assert.equal(safeReturnPath('//exemple-malveillant.test'), null);
    assert.equal(safeReturnPath('//exemple-malveillant.test/partager'), null);
  });

  test('refuse un chemin qui ne commence pas par une barre', () => {
    assert.equal(safeReturnPath('partager'), null);
    assert.equal(safeReturnPath('../admin'), null);
  });
});
