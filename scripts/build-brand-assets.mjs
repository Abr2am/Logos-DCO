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
 *   - l'emblème officiel n'est NI redessiné, NI déformé, NI recoloré : le
 *     master fait foi. Deux opérations seulement lui sont appliquées, et
 *     elles ne touchent pas au dessin (voir `buildEmbleme`) ;
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

await buildEmbleme();

/*
 * Emblème officiel — `assets/brand/embleme.png` fait foi.
 *
 * Le master est fourni en PNG OPAQUE, sur fond blanc, et son dessin n'est pas
 * centré dans son cadre (marges 196 / 173 / 164 / 107 px). Deux opérations,
 * et deux seulement, sont appliquées — aucune ne touche au dessin :
 *
 *   1. le fond blanc EXTÉRIEUR devient transparent, par remplissage depuis les
 *      bords. Les blancs INTÉRIEURS fermés — les cannelures de la hampe — sont
 *      préservés : ils font partie du dessin ;
 *   2. le cadre est rogné sur la boîte englobante de l'encre. Rien du logo
 *      n'est coupé : seules les marges vides disparaissent. C'est ce qui rend
 *      le centrage exact dans ses conteneurs, SANS aucune translation
 *      arbitraire.
 *
 * Ni redimensionnement de forme, ni recolorisation, ni filtre, ni ombre. Le
 * rapport d'aspect du dessin est conservé tel quel.
 */
async function buildEmbleme() {
  const source = join(MASTERS, 'embleme.png');
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const at = (x, y) => (y * width + x) * channels;
  /* Le master a traversé une compression avec pertes : le « blanc » y vaut
     253-255 selon les pixels. Le seuil est donc tolérant. */
  const WHITE = 236;
  const isWhite = (i) =>
    data[i] >= WHITE && data[i + 1] >= WHITE && data[i + 2] >= WHITE;

  /* 1 · Remplissage depuis les bords — seul le fond extérieur est atteint. */
  const outside = new Uint8Array(width * height);
  const queue = [];
  const push = (x, y) => {
    const p = y * width + x;
    if (outside[p] || !isWhite(at(x, y))) return;
    outside[p] = 1;
    queue.push(p);
  };
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }
  while (queue.length > 0) {
    const p = queue.pop();
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }
  for (let p = 0; p < outside.length; p += 1) {
    if (outside[p]) data[p * channels + 3] = 0;
  }

  /* 2 · Boîte englobante de l'encre restante. */
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[at(x, y) + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const box = {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };

  const trimmed = sharp(data, { raw: { width, height, channels } }).extract(
    box,
  );

  /* Une seule taille servie : l'emblème n'est employé qu'entre 26 et 58 px.
     256 px de large couvre le hero à plus de quatre fois sa taille. */
  const out = join(OUT, 'embleme-256.webp');
  await trimmed
    .resize({ width: 256, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 92, effort: 6, alphaQuality: 100 })
    .toFile(out);

  const { size } = await stat(out);
  console.log(
    `${'embleme-256.webp'.padEnd(24)} ${`256×${Math.round((box.height / box.width) * 256)}`.padEnd(11)} ` +
      `${String(Math.round(size / 1024)).padStart(5)} Kio   marque (26-58 px)`,
  );
  console.log(
    `   dessin ${box.width}×${box.height} px, rapport ${(box.width / box.height).toFixed(4)} ` +
      `— rogné de (${box.left}, ${box.top}) dans un master de ${width}×${height}`,
  );
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
