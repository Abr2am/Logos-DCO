/*
 * Génère les versions web des assets de marque depuis les masters.
 *
 *   assets/brand/*  (masters, jamais servis)  →  public/brand/*  (web)
 *
 * Règles (décision « point O ») :
 *   - les masters originaux sont conservés tels quels et font autorité ;
 *   - le motif de la rosace n'est jamais modifié : redimensionnement et
 *     réencodage uniquement, aucun redessin, aucun recadrage, aucune
 *     vectorisation ;
 *   - la marqueterie n'est ni recadrée ni transformée en texture répétable ;
 *   - seules les tailles réellement utilisées par le Design System sont
 *     produites.
 *
 *   npm run assets:brand
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MASTERS = join(ROOT, 'assets', 'brand');
const OUT = join(ROOT, 'public', 'brand');

/**
 * Chaque largeur correspond à un usage réel du Design System.
 * Ne pas en ajouter sans usage correspondant.
 */
const TARGETS = [
  {
    master: 'rosace.png',
    prefix: 'rosace',
    alpha: true,
    widths: [
      { w: 1280, usage: 'hero desktop (filigrane 1180 px)' },
      { w: 512, usage: 'hero mobile (420 px) · filigrane de couverture' },
      { w: 128, usage: 'pastille de marque (22-52 px) · état vide (34 px)' },
    ],
  },
  {
    master: 'marqueterie.jpg',
    prefix: 'marqueterie',
    alpha: false,
    widths: [
      { w: 736, usage: 'en-tête de catégorie · panneau de hero mobile' },
      { w: 368, usage: 'plat de couverture famille 03' },
    ],
  },
];

await mkdir(OUT, { recursive: true });

for (const target of TARGETS) {
  const source = join(MASTERS, target.master);
  const { width: sw, height: sh } = await sharp(source).metadata();

  for (const { w, usage } of target.widths) {
    if (w > sw) {
      throw new Error(
        `${target.master} : largeur demandée ${w} > master ${sw}. ` +
          'Aucun agrandissement : le master fait autorité.',
      );
    }

    const out = join(OUT, `${target.prefix}-${w}.webp`);
    await sharp(source)
      .resize({ width: w, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 6, alphaQuality: 100 })
      .toFile(out);

    const { size } = await stat(out);
    const h = Math.round((sh / sw) * w);
    console.log(
      `${`${target.prefix}-${w}.webp`.padEnd(24)} ${`${w}×${h}`.padEnd(11)} ` +
        `${String(Math.round(size / 1024)).padStart(5)} Kio   ${usage}`,
    );
  }
}

/* Manifeste lisible : ce qui est publié et pourquoi. */
const files = (await readdir(OUT)).filter((f) => f.endsWith('.webp')).sort();
await writeFile(
  join(OUT, 'README.md'),
  [
    '# public/brand — versions web des assets de marque',
    '',
    '**Fichiers générés. Ne pas éditer à la main.**',
    '',
    'Régénérer : `npm run assets:brand`',
    '',
    'Les masters font autorité et vivent dans `assets/brand/` (non servis).',
    'Ils sont réextractibles du Design System bundlé via',
    '`node scripts/extract-brand-masters.mjs`.',
    '',
    ...files.map((f) => `- \`${f}\``),
    '',
  ].join('\n'),
);
