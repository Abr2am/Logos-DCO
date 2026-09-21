/*
 * Réextrait les masters de marque depuis le Design System bundlé.
 *
 * Les deux images de marque (rosace, marqueterie) ne vivent dans le dépôt
 * qu'encapsulées en base64 dans `docs/Logos - Design System V2.html`.
 * Ce script les réécrit bit-à-bit dans `assets/brand/`, sans aucune
 * transformation. Il sert de filet de sécurité : les masters versionnés
 * restent la référence, ce script prouve qu'ils sont reproductibles.
 *
 *   node scripts/extract-brand-masters.mjs
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = join(ROOT, 'docs', 'Logos - Design System V2.html');
const OUT = join(ROOT, 'assets', 'brand');

/** Identifiants des ressources dans le manifeste du bundle. */
const MASTERS = {
  '78510d34-930d-476a-a479-abf868e5aef6': 'rosace.png',
  '43edd359-5fb3-40c0-8b04-48bb86ef138f': 'marqueterie.jpg',
};

const html = await readFile(BUNDLE, 'utf8');
const manifestMatch = html.match(
  /<script type="__bundler\/manifest">\s*([\s\S]*?)\s*<\/script>/,
);
if (!manifestMatch?.[1]) {
  throw new Error('Manifeste introuvable dans le bundle du Design System.');
}
const manifest = JSON.parse(manifestMatch[1]);

await mkdir(OUT, { recursive: true });

for (const [id, filename] of Object.entries(MASTERS)) {
  const entry = manifest[id];
  if (!entry) throw new Error(`Ressource ${id} absente du manifeste.`);

  const payload = Object.values(entry).find(
    (value) => typeof value === 'string' && value.length > 1000,
  );
  if (!payload) throw new Error(`Aucune charge base64 pour ${filename}.`);

  const bytes = Buffer.from(payload, 'base64');
  await writeFile(join(OUT, filename), bytes);

  const sha = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  console.log(`${filename.padEnd(18)} ${bytes.length} octets  sha256:${sha}…`);
}
