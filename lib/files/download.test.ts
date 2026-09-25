import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { SIGNED_URL_TTL, safeFilename } from './download';

/*
 * Le nom de fichier part dans `Content-Disposition`. Ce qui est vérifié ici
 * n'est pas du confort d'affichage : c'est qu'aucun nom stocké en base ne
 * puisse s'échapper de l'en-tête.
 */

describe('safeFilename', () => {
  test('laisse un nom ordinaire intact', () => {
    assert.equal(
      safeFilename('La Croix - MAK 2026.pptx'),
      'La Croix - MAK 2026.pptx',
    );
  });

  test('retire toute composante de chemin', () => {
    assert.equal(safeFilename('../../etc/passwd'), 'passwd');
    assert.equal(safeFilename('C:\\Windows\\cours.pdf'), 'cours.pdf');
  });

  test('retire guillemets, retours à la ligne et caractères de contrôle', () => {
    assert.equal(
      safeFilename('cours".pdf\r\nX-Injected: 1'),
      'cours.pdfX-Injected: 1',
    );
    assert.equal(safeFilename('cours\u0000.pdf'), 'cours.pdf');
  });

  test('ne renvoie jamais une chaîne vide', () => {
    assert.equal(safeFilename(''), 'ressource');
    assert.equal(safeFilename('"""'), 'ressource');
    assert.equal(safeFilename('   '), 'ressource');
  });
});

describe('SIGNED_URL_TTL', () => {
  test('reste court — une URL diffusée ne doit pas survivre', () => {
    assert.equal(SIGNED_URL_TTL, 60);
  });
});
