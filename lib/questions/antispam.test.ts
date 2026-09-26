import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

/*
 * Le jeton est la seule des deux barrières applicatives qui ait une
 * cryptographie : c'est elle qu'on vérifie ici. Le leurre, lui, se résume à
 * « ce champ est-il rempli ».
 *
 * ⚠️ La clé doit exister AVANT le premier appel : le module la lit à chaque
 * signature, jamais au chargement, ce qui rend ce test possible.
 */

process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'cle-de-service-de-test';

const {
  MAX_FORM_AGE_MS,
  MIN_FILL_MS,
  issueFormToken,
  isHoneypotFilled,
  verifyFormToken,
} = await import('./antispam');

const NOW = 1_800_000_000_000;

describe('jeton du formulaire', () => {
  test('un formulaire rempli posément est accepté', () => {
    const token = issueFormToken(NOW);
    assert.equal(verifyFormToken(token, NOW + MIN_FILL_MS), 'ok');
    assert.equal(verifyFormToken(token, NOW + 30_000), 'ok');
  });

  test('une soumission instantanée est une machine', () => {
    const token = issueFormToken(NOW);
    assert.equal(verifyFormToken(token, NOW), 'trop-rapide');
    assert.equal(verifyFormToken(token, NOW + MIN_FILL_MS - 1), 'trop-rapide');
  });

  test('un formulaire trop vieux est périmé', () => {
    const token = issueFormToken(NOW);
    assert.equal(verifyFormToken(token, NOW + MAX_FORM_AGE_MS + 1), 'perime');
  });

  test('une signature falsifiée est refusée', () => {
    const token = issueFormToken(NOW);
    const [stamp, signature] = token.split('.');

    /* L'horodatage reculé pour passer le délai, mais la signature ne suit pas. */
    assert.equal(
      verifyFormToken(`${Number(stamp) - 60_000}.${signature}`, NOW + 60_000),
      'invalide',
    );
    assert.equal(
      verifyFormToken(`${stamp}.${signature}x`, NOW + 5_000),
      'invalide',
    );
    assert.equal(verifyFormToken(`${stamp}.`, NOW + 5_000), 'invalide');
  });

  test('un jeton absent ou malformé est refusé', () => {
    for (const value of [
      null,
      undefined,
      '',
      'sans-point',
      '.abc',
      'abc.def',
    ]) {
      assert.equal(
        verifyFormToken(value, NOW + 5_000),
        'invalide',
        String(value),
      );
    }
  });

  test('un horodatage dans le futur est refusé', () => {
    const token = issueFormToken(NOW + 10 * 60_000);
    assert.equal(verifyFormToken(token, NOW), 'invalide');
  });

  test('deux jetons du même instant sont identiques, et stables', () => {
    assert.equal(issueFormToken(NOW), issueFormToken(NOW));
  });
});

describe('leurre', () => {
  test('vide ou absent : c’est un humain', () => {
    assert.equal(isHoneypotFilled(null), false);
    assert.equal(isHoneypotFilled(''), false);
    assert.equal(isHoneypotFilled('   '), false);
  });

  test('rempli : c’est un robot', () => {
    assert.equal(isHoneypotFilled('https://spam.test'), true);
    assert.equal(isHoneypotFilled(' x '), true);
  });
});
