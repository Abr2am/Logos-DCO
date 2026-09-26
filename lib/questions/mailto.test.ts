import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { answerMailto } from './mailto';
import {
  EMAIL_MAX_LENGTH,
  EMAIL_SHAPE,
  QUESTION_MAX_LENGTH,
  QUESTION_MIN_LENGTH,
} from './types';

/*
 * Le MVP n'envoie aucun e-mail : le lien `mailto:` EST le canal de réponse.
 * S'il désigne la mauvaise adresse, la réponse part à côté sans que personne
 * ne s'en aperçoive — d'où ces tests.
 */

function destinataire(mailto: string): string {
  return decodeURIComponent(new URL(mailto).pathname);
}

describe('answerMailto', () => {
  test('adresse ordinaire et objet préfixé', () => {
    const lien = answerMailto('visiteur@example.fr', 'Le Credo');
    assert.equal(destinataire(lien), 'visiteur@example.fr');
    assert.equal(new URL(lien).searchParams.get('subject'), 'Logos — Le Credo');
  });

  test('le « @ » reste littéral', () => {
    assert.ok(answerMailto('a@b.fr', 'T').startsWith('mailto:a@b.fr?'));
  });

  test('un « ? » dans la partie locale ne coupe pas le destinataire', () => {
    const lien = answerMailto('a?b@example.fr', 'Titre');
    assert.equal(destinataire(lien), 'a?b@example.fr');
  });

  test('un « # » ne transforme pas la suite en fragment', () => {
    const lien = answerMailto('a#b@example.fr', 'Titre');
    assert.equal(destinataire(lien), 'a#b@example.fr');
    assert.equal(new URL(lien).hash, '');
  });

  test('un « & » ne crée pas un paramètre parasite', () => {
    const lien = answerMailto('a&b@example.fr', 'Titre');
    assert.equal(destinataire(lien), 'a&b@example.fr');
    assert.equal([...new URL(lien).searchParams.keys()].length, 1);
  });

  test('un titre à ponctuation ne casse pas l’objet', () => {
    const lien = answerMailto('v@e.fr', 'Marc & Luc : séance n°4 ?');
    assert.equal(
      new URL(lien).searchParams.get('subject'),
      'Logos — Marc & Luc : séance n°4 ?',
    );
  });

  test('les accents traversent l’encodage', () => {
    const lien = answerMailto('évêque@example.fr', 'Évangile');
    assert.equal(destinataire(lien), 'évêque@example.fr');
  });
});

describe('contraintes de forme des questions', () => {
  test('la borne d’adresse reflète celle de la table', () => {
    assert.equal(EMAIL_MAX_LENGTH, 254);
    assert.equal(QUESTION_MIN_LENGTH, 10);
    assert.equal(QUESTION_MAX_LENGTH, 1000);
  });

  test('le contrôle de forme accepte une adresse plausible', () => {
    for (const adresse of [
      'visiteur@example.fr',
      'marie.abdel-messih@paroisse.exemple.fr',
      'a+b@example.co.uk',
    ]) {
      assert.ok(EMAIL_SHAPE.test(adresse), adresse);
    }
  });

  test('le contrôle de forme écarte ce qui n’est pas une adresse', () => {
    for (const adresse of [
      'pas-une-adresse',
      'sans@point',
      '@example.fr',
      'deux@@example.fr',
      'espace dans@example.fr',
      'fin@example.',
      '',
    ]) {
      assert.ok(!EMAIL_SHAPE.test(adresse), adresse);
    }
  });
});
