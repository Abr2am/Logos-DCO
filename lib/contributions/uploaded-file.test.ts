import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { readUploadedFileRef } from './uploaded-file';

/*
 * C'est ce qui distingue « enregistrer les modifications » d'un remplacement
 * de fichier. Se tromper ici, c'est soit perdre le nouveau fichier — le bug
 * corrigé le 25/09/2026 côté administration —, soit tenter un remplacement
 * qu'on n'a pas demandé.
 */

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

const PATH = '11111111-1111-1111-1111-111111111111/abcd.pdf';

describe('readUploadedFileRef', () => {
  test('aucun fichier déposé : rien à remplacer', () => {
    assert.equal(readUploadedFileRef(form({})), null);
    assert.equal(readUploadedFileRef(form({ title: 'Titre corrigé' })), null);
  });

  test('un chemin vide ou blanc ne déclenche aucun remplacement', () => {
    assert.equal(readUploadedFileRef(form({ storagePath: '' })), null);
    assert.equal(readUploadedFileRef(form({ storagePath: '   ' })), null);
  });

  test('un fichier déposé est rendu tel quel', () => {
    assert.deepEqual(
      readUploadedFileRef(form({ storagePath: PATH, filename: 'cours.pdf' })),
      { storagePath: PATH, filename: 'cours.pdf' },
    );
  });

  test('le nom manquant n’empêche pas la détection — la validation tranchera', () => {
    assert.deepEqual(readUploadedFileRef(form({ storagePath: PATH })), {
      storagePath: PATH,
      filename: '',
    });
  });

  test('les autres champs du formulaire n’entrent pas en compte', () => {
    const data = form({ id: 'x', title: 'T', storagePath: PATH });
    data.append('flags', 'Un');
    assert.equal(readUploadedFileRef(data)?.storagePath, PATH);
  });
});
