import type { Metadata } from 'next';
import Link from 'next/link';

import { MinimalHeader } from '@/components/layout/MinimalHeader';
import { Panel } from '@/components/ui/Panel';

/*
 * 404 racine — toute URL qui ne correspond à aucune route.
 *
 * Elle existe parce que, à défaut, Next sert sa propre page : en anglais, sans
 * bandeau, sans marque, sur un produit entièrement français.
 *
 * Pas de navigation : cette page est rendue hors de tout contexte de requête
 * et ne peut pas lire la session. Le bandeau noyer et la marque suffisent à la
 * rattacher au produit, et un seul chemin en sort — l'accueil.
 *
 * Le traitement est celui du Design System pour une erreur de page : un
 * panneau à accent bordeaux, sans rosace. La pastille dorée est réservée aux
 * états vides.
 */

export const metadata: Metadata = {
  title: 'Page introuvable — Logos',
  robots: { index: false, follow: false },
};

export default function PageIntrouvable() {
  return (
    <>
      <MinimalHeader />

      <main className="mx-auto max-w-content px-22 py-44 tablet:px-26 tablet:py-56 desktop:px-44">
        <Panel accent="burgundy" className="max-w-reading">
          <h1 className="font-display text-[20px] leading-[1.2] tablet:text-[24px]">
            Cette page n&apos;existe pas
          </h1>
          <p className="mt-12 text-body text-text-secondary">
            Le lien est peut-être incomplet, ou la page a changé d&apos;adresse.
          </p>
          <Link
            href="/"
            className="mt-16 inline-block text-[13.5px] font-semibold text-burgundy underline underline-offset-4 hover:text-burgundy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
          >
            Revenir à l&apos;accueil
          </Link>
        </Panel>
      </main>
    </>
  );
}
