import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { logDatabaseError, userMessage } from './errors';

/*
 * Le seul invariant qui compte : quoi que dise PostgreSQL, le visiteur ne le
 * lit pas. Les messages ci-dessous sont de vrais messages du moteur, avec ce
 * qu'ils nomment — tables, colonnes, contraintes, policies.
 */

const MESSAGES_POSTGRES = [
  {
    code: '42501',
    message: 'new row violates row-level security policy for table "resources"',
  },
  {
    code: '23514',
    message:
      'new row for relation "files" violates check constraint "files_mime_type_allowed"',
  },
  {
    code: '23505',
    message:
      'duplicate key value violates unique constraint "files_storage_path_key"',
  },
  {
    code: '23502',
    message: 'null value in column "storage_path" of relation "files"',
  },
  {
    code: '42883',
    message: 'function public.submit_resource(unknown) does not exist',
  },
  { code: 'PGRST202', message: 'Could not find the function in the schema' },
  { code: '42P01', message: 'permission denied for table questions' },
];

/** Ce qu'aucun message affiché ne doit contenir, jamais. */
const MOTS_INTERDITS = [
  'policy',
  'constraint',
  'relation',
  'column',
  'table',
  'schema',
  'public.',
  'pg_',
  'null value',
  'duplicate key',
];

const ATTENTE = 'La ressource n’a pas pu être soumise.';

describe('userMessage', () => {
  test('ne renvoie jamais le message de PostgreSQL', () => {
    for (const error of MESSAGES_POSTGRES) {
      const rendu = userMessage(error, ATTENTE);
      assert.notEqual(rendu, error.message, error.code);
      assert.ok(
        !rendu.includes(error.message),
        `${error.code} : le message brut ressort`,
      );
    }
  });

  test('ne laisse filtrer aucun terme de schéma', () => {
    for (const error of MESSAGES_POSTGRES) {
      const rendu = userMessage(error, ATTENTE).toLowerCase();
      for (const mot of MOTS_INTERDITS) {
        assert.ok(
          !rendu.includes(mot),
          `${error.code} laisse passer « ${mot} »`,
        );
      }
    }
  });

  test('traduit les deux codes que la base lève vraiment', () => {
    const refus = userMessage(
      { code: '42501', message: 'peu importe' },
      ATTENTE,
    );
    assert.match(refus, /refusée/);
    assert.notEqual(refus, ATTENTE);

    const regle = userMessage(
      { code: '23514', message: 'peu importe' },
      ATTENTE,
    );
    assert.match(regle, /cinq flags/);
    assert.notEqual(regle, ATTENTE);
  });

  test('rend le message d’attente pour tout le reste', () => {
    assert.equal(
      userMessage({ code: '23505', message: 'x' }, ATTENTE),
      ATTENTE,
    );
    assert.equal(userMessage({ message: 'sans code' }, ATTENTE), ATTENTE);
    assert.equal(userMessage({}, ATTENTE), ATTENTE);
    assert.equal(userMessage(null, ATTENTE), ATTENTE);
    assert.equal(userMessage(undefined, ATTENTE), ATTENTE);
  });

  test('un code inattendu ne fait pas passer son message', () => {
    const rendu = userMessage(
      { code: 'XX000', message: 'internal error: pg_toast corrupted' },
      ATTENTE,
    );
    assert.equal(rendu, ATTENTE);
  });
});

describe('logDatabaseError', () => {
  test('conserve le détail technique côté serveur', () => {
    const original = console.error;
    const vu: unknown[][] = [];
    console.error = (...args: unknown[]) => void vu.push(args);
    try {
      logDatabaseError('submit_resource', {
        code: '42501',
        message: 'new row violates row-level security policy',
      });
    } finally {
      console.error = original;
    }

    assert.equal(vu.length, 1);
    assert.match(String(vu[0]?.[0]), /submit_resource/);
    assert.deepEqual(vu[0]?.[1], {
      code: '42501',
      message: 'new row violates row-level security policy',
    });
  });

  test('supporte une erreur vide', () => {
    const original = console.error;
    console.error = () => {};
    try {
      assert.doesNotThrow(() => logDatabaseError('rpc', null));
      assert.doesNotThrow(() => logDatabaseError('rpc', undefined));
    } finally {
      console.error = original;
    }
  });
});
