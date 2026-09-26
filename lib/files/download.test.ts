import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { SIGNED_URL_TTL, safeFilename, signedFileRedirect } from './download';

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

describe('signedFileRedirect', () => {
  const URL_SIGNEE =
    'https://projet.supabase.co/storage/v1/object/sign/resources/a/b.pdf?token=xyz';

  test('redirige en 302 vers l’URL signée', () => {
    const response = signedFileRedirect(URL_SIGNEE);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), URL_SIGNEE);
  });

  test('interdit toute mise en cache de la redirection', () => {
    assert.equal(
      signedFileRedirect(URL_SIGNEE).headers.get('cache-control'),
      'no-store',
    );
  });

  test('ne porte aucun corps', async () => {
    assert.equal(await signedFileRedirect(URL_SIGNEE).text(), '');
  });

  /* `Response.redirect()` rendrait des en-têtes immuables : la réponse doit
     être construite à la main, sans quoi `no-store` ne pourrait pas être
     posé. Ce test fige la raison de ce choix. */
  test('les en-têtes restent modifiables', () => {
    const response = signedFileRedirect(URL_SIGNEE);
    assert.doesNotThrow(() =>
      response.headers.set('cache-control', 'no-store'),
    );
  });
});

describe('SIGNED_URL_TTL', () => {
  test('reste court — une URL diffusée ne doit pas survivre', () => {
    assert.equal(SIGNED_URL_TTL, 60);
  });
});
