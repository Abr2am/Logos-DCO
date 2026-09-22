'use client';

import Link from 'next/link';

import { MinimalHeader } from '@/components/layout/MinimalHeader';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';

/*
 * Frontière d'erreur racine — toute exception non rattrapée du rendu serveur.
 *
 * Sans elle, une panne de la base rend une page VIDE : l'application répond
 * 500 avec un corps sans le moindre texte. Le visiteur ne sait pas si le site
 * est cassé ou si sa connexion a lâché.
 *
 * ⚠️ AUCUN DÉTAIL TECHNIQUE N'EST AFFICHÉ — décision produit du 23/09/2026.
 * Ni le message d'erreur, ni sa pile, ni son `digest` : un message d'erreur
 * de base de données peut révéler des noms de tables, de colonnes ou de
 * policies. Le paramètre `error` est reçu parce que Next l'impose, et il
 * n'est pas lu.
 *
 * Le traitement est celui du Design System : panneau à accent bordeaux, « ! »
 * textuel s'il en faut un. Aucun rouge, aucune couleur d'état.
 */

export default function ErreurApplication({ reset }: { reset: () => void }) {
  return (
    <>
      <MinimalHeader />

      <main className="mx-auto max-w-content px-22 py-44 tablet:px-26 tablet:py-56 desktop:px-44">
        <Panel accent="burgundy" className="max-w-reading">
          <h1 className="font-display text-[20px] leading-[1.2] tablet:text-[24px]">
            Une erreur est survenue
          </h1>
          <p className="mt-12 text-body text-text-secondary">
            La page n&apos;a pas pu être affichée. Réessayez dans un instant ;
            si cela se reproduit, revenez plus tard.
          </p>

          <div className="mt-16 flex flex-wrap items-center gap-16">
            <Button variant="secondary" onClick={reset}>
              Réessayer
            </Button>
            <Link
              href="/"
              className="text-[13.5px] font-semibold text-burgundy underline underline-offset-4 hover:text-burgundy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
            >
              Revenir à l&apos;accueil
            </Link>
          </div>
        </Panel>
      </main>
    </>
  );
}
