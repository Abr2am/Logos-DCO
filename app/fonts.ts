import { Archivo, Bodoni_Moda, JetBrains_Mono } from 'next/font/google';

/*
 * Les trois familles du Design System, et elles seules.
 *
 *   Bodoni Moda   titres éditoriaux — 400, 500, italique 400
 *   Archivo       interface & texte — 400, 500, 600
 *   JetBrains Mono surtitres & labels — 500 uniquement
 *
 * Les polices sont auto-hébergées par next/font (aucun appel à Google en
 * production) et exposées en variables CSS consommées par `styles/tokens.css`.
 */

export const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-archivo',
  display: 'swap',
});

export const bodoniModa = Bodoni_Moda({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni-moda',
  display: 'swap',
});

export const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

/** À appliquer sur <html> pour publier les trois variables de police. */
export const fontVariables = [
  archivo.variable,
  bodoniModa.variable,
  jetBrainsMono.variable,
].join(' ');
