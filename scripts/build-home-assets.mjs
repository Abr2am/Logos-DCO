/*
 * Prépare les assets d'architecture de l'accueil.
 *
 *   assets/home/*  (masters validés, jamais servis)  →  public/home/*  (web)
 *
 * Règles :
 *   - les masters font autorité : aucun redessin, aucun recadrage, aucune
 *     retouche, aucun filtre. Ce script ne fait que convertir au format web ;
 *   - un master déjà en WebP est COPIÉ tel quel — le réencoder ne ferait que
 *     dégrader une image déjà compressée avec pertes ;
 *   - un master PNG est encodé une fois en WebP, à qualité élevée, sans
 *     redimensionnement : `next/image` produit ensuite les largeurs servies.
 *
 *   npm run assets:home
 */
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MASTERS = join(ROOT, 'assets', 'home');
const OUT = join(ROOT, 'public', 'home');

/** Chaque entrée correspond à un usage réel de l'accueil. */
const TARGETS = [
  {
    master: 'hero-desktop.webp',
    web: 'hero-desktop.webp',
    usage: 'hero — tablette et desktop',
  },
  {
    master: 'hero-mobile.png',
    web: 'hero-mobile.webp',
    usage: 'hero — mobile (composition distincte)',
  },
  {
    master: 'bookcase-horizontal.webp',
    web: 'bookcase-horizontal.webp',
    usage: 'Explorer par thème — tablette et desktop',
  },
  {
    master: 'bookcase-vertical.webp',
    web: 'bookcase-vertical.webp',
    usage: 'Explorer par thème — mobile',
  },
];

await mkdir(OUT, { recursive: true });

for (const { master, web, usage } of TARGETS) {
  const source = join(MASTERS, master);
  const destination = join(OUT, web);
  const { width, height, hasAlpha } = await sharp(source).metadata();

  if (master.endsWith('.webp')) {
    await copyFile(source, destination);
  } else {
    await sharp(source)
      .webp({ quality: 90, effort: 6, alphaQuality: 100 })
      .toFile(destination);
  }

  const { size } = await stat(destination);
  console.log(
    `${web.padEnd(26)} ${`${width}×${height}`.padEnd(11)} ` +
      `${String(Math.round(size / 1024)).padStart(5)} Kio   ` +
      `${hasAlpha ? 'alpha  ' : '       '}${usage}`,
  );
}

/* Manifeste lisible : ce qui est publié et pourquoi. */
const files = (await readdir(OUT)).filter((f) => f.endsWith('.webp')).sort();
await writeFile(
  join(OUT, 'README.md'),
  [
    "# public/home — assets d'architecture de l'accueil",
    '',
    '**Fichiers générés. Ne pas éditer à la main.**',
    '',
    'Régénérer : `npm run assets:home`',
    '',
    'Les masters validés font autorité et vivent dans `assets/home/`',
    '(non servis). Ils ne sont ni redessinés, ni recadrés, ni retouchés :',
    'le script convertit au format web, rien de plus.',
    '',
    ...files.map((f) => `- \`${f}\``),
    '',
  ].join('\n'),
);
