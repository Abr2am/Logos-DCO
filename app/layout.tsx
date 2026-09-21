import type { Metadata } from 'next';

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
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
