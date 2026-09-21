import type { Metadata } from 'next';

import { fontVariables } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Logos',
  description:
    'Les ressources de catéchisme du Diocèse Copte Orthodoxe de Paris.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
