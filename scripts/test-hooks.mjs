/*
 * Crochets de résolution pour `node --test`.
 *
 * Les tests s'exécutent sous le lanceur natif de Node — aucune dépendance
 * ajoutée, aucun framework. Node 22 sait exécuter TypeScript directement en
 * effaçant les types ; il ne sait en revanche pas deux choses :
 *
 *   1. l'alias `@/` de `tsconfig.json`, qui n'existe que pour le bundler ;
 *   2. les modules réservés au serveur (`server-only`, `next/navigation`,
 *      `next/headers`), qui n'ont aucun sens hors d'un rendu Next et dont le
 *      seul effet ici serait de faire échouer l'import.
 *
 * Ces crochets comblent l'un et l'autre, et RIEN de plus : ils ne remplacent
 * aucun module applicatif, n'altèrent aucun comportement testé, et ne servent
 * qu'au lanceur de tests.
 *
 * ⚠️ Les doublures ci-dessous rendent `redirect` et `cookies` inertes. Les
 * fonctions qui en dépendent — `requireMember`, `requireAdmin`, les lectures
 * Supabase — ne sont donc PAS testables ici, et ne le sont pas : seule la
 * logique pure est couverte.
 */

import { statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const SERVER_ONLY = new Set(['server-only', 'next/navigation', 'next/headers']);
const STUB_PREFIX = 'logos-test-stub:';

const STUB_SOURCE = [
  'export default {};',
  'export function redirect() {',
  "  throw new Error('redirect() indisponible sous le lanceur de tests.');",
  '}',
  'export function cookies() {',
  "  throw new Error('cookies() indisponible sous le lanceur de tests.');",
  '}',
].join('\n');

/**
 * Retrouve un fichier depuis un chemin sans extension — ce que fait le
 * bundler et que Node, lui, exige d'écrire.
 */
function withExtension(base) {
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    base,
  ];
  const found = candidates.find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
  return found ? pathToFileURL(found).href : null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (SERVER_ONLY.has(specifier)) {
      return { url: STUB_PREFIX + specifier, shortCircuit: true };
    }

    /* Alias `@/` : relatif à la racine du dépôt. */
    if (specifier.startsWith('@/')) {
      const url = withExtension(path.join(ROOT, specifier.slice(2)));
      if (url) return { url, shortCircuit: true };
    }

    /* Import relatif sans extension : `./formats` → `./formats.ts`. */
    if (specifier.startsWith('.') && context.parentURL) {
      const base = path.resolve(
        path.dirname(fileURLToPath(context.parentURL)),
        specifier,
      );
      const url = withExtension(base);
      if (url) return { url, shortCircuit: true };
    }

    return nextResolve(specifier, context);
  },

  load(url, context, nextLoad) {
    if (url.startsWith(STUB_PREFIX)) {
      return { format: 'module', source: STUB_SOURCE, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
