import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  contentSecurityPolicy,
  securityHeaders,
  supabaseOrigin,
} from './headers';

/*
 * Une politique de sécurité se relâche sans bruit : une directive ajoutée
 * « pour débloquer », et la protection disparaît sans qu'aucun écran ne
 * change. Ces tests figent ce qui ne doit jamais céder.
 */

const PROJET = 'https://abcdefgh.supabase.co';

function directive(csp: string, nom: string): string {
  const trouvee = csp
    .split('; ')
    .find((part) => part === nom || part.startsWith(`${nom} `));
  assert.ok(trouvee, `directive « ${nom} » absente`);
  return trouvee;
}

describe('content security policy', () => {
  test('la production n’accorde jamais unsafe-eval', () => {
    const csp = contentSecurityPolicy({ supabaseUrl: PROJET });
    assert.ok(!csp.includes('unsafe-eval'));
    assert.ok(
      !contentSecurityPolicy({ development: false }).includes('unsafe-eval'),
    );
  });

  test('le développement l’accorde, parce que React l’exige', () => {
    const csp = contentSecurityPolicy({ development: true });
    assert.match(directive(csp, 'script-src'), /'unsafe-eval'/);
  });

  test('le site ne peut pas être encadré', () => {
    const csp = contentSecurityPolicy({});
    assert.equal(directive(csp, 'frame-ancestors'), "frame-ancestors 'none'");
  });

  test('aucun greffon, aucune base détournée, aucun formulaire ailleurs', () => {
    const csp = contentSecurityPolicy({});
    assert.equal(directive(csp, 'object-src'), "object-src 'none'");
    assert.equal(directive(csp, 'base-uri'), "base-uri 'self'");
    assert.equal(directive(csp, 'form-action'), "form-action 'self'");
  });

  test('le navigateur ne parle qu’à nous et à Supabase', () => {
    const csp = contentSecurityPolicy({ supabaseUrl: `${PROJET}/rest/v1` });
    assert.equal(directive(csp, 'connect-src'), `connect-src 'self' ${PROJET}`);
  });

  test('les polices et les images restent chez nous', () => {
    const csp = contentSecurityPolicy({});
    assert.equal(directive(csp, 'font-src'), "font-src 'self'");
    assert.match(directive(csp, 'img-src'), /^img-src 'self' data: blob:$/);
  });

  test('tout ce qui n’est pas nommé retombe sur notre origine', () => {
    assert.equal(
      directive(contentSecurityPolicy({}), 'default-src'),
      "default-src 'self'",
    );
  });
});

describe('origine Supabase', () => {
  test('ne garde que l’origine', () => {
    assert.equal(supabaseOrigin(`${PROJET}/storage/v1/object`), PROJET);
  });

  test('absente ou illisible : le domaine générique, jamais rien', () => {
    assert.equal(supabaseOrigin(undefined), 'https://*.supabase.co');
    assert.equal(supabaseOrigin(''), 'https://*.supabase.co');
    assert.equal(supabaseOrigin('pas une URL'), 'https://*.supabase.co');
  });
});

describe('en-têtes servis', () => {
  const entetes = securityHeaders({ supabaseUrl: PROJET });
  const valeur = (key: string) =>
    entetes.find((header) => header.key === key)?.value;

  test('les six en-têtes sont présents', () => {
    for (const key of [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ]) {
      assert.ok(valeur(key), `${key} manquant`);
    }
  });

  test('HSTS dure deux ans et n’engage pas le domaine dans la liste de préchargement', () => {
    const hsts = valeur('Strict-Transport-Security') ?? '';
    assert.match(hsts, /max-age=63072000/);
    assert.match(hsts, /includeSubDomains/);
    assert.ok(!hsts.includes('preload'));
  });

  test('le clickjacking est refusé deux fois', () => {
    assert.equal(valeur('X-Frame-Options'), 'DENY');
    assert.match(
      valeur('Content-Security-Policy') ?? '',
      /frame-ancestors 'none'/,
    );
  });

  test('ni reniflage de type, ni référent complet vers l’extérieur', () => {
    assert.equal(valeur('X-Content-Type-Options'), 'nosniff');
    assert.equal(valeur('Referrer-Policy'), 'strict-origin-when-cross-origin');
  });
});
