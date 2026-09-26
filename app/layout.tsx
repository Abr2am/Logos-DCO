import type { Metadata } from 'next';

import { Footer } from '@/components/layout/Footer';

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
      {/* Le pied est global : il clôt CHAQUE page, et la colonne flex le
          maintient en bas même lorsque le contenu est court. */}
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
