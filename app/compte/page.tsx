import type { Metadata } from 'next';
import Link from 'next/link';

import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { signOut } from '@/lib/auth/actions';
import { ROLE_LABELS, requireMember } from '@/lib/auth/session';

/*
 * Mon compte.
 *
 * Décision du 25/09/2026, qui tranche le point ouvert « T » : l'entrée
 * « Mon compte » du header avait un libellé mais pas de destination. Elle en a
 * une, et cette page est la SEULE nouveauté — elle ne crée aucune
 * fonctionnalité, elle rassemble des routes existantes.
 *
 * Page sobre, volontairement : ni étagère, ni meuble, ni rosace. Le langage
 * d'architecture sert la bibliothèque ; un espace personnel est un panneau de
 * service, comme « Partager un cours ». Le patrimoine y passe par la seule
 * géométrie — bandeau noyer, filets dorés du header, cadres en retrait.
 *
 * Le rôle décide de ce qui s'affiche, mais ne protège rien : chaque
 * destination revérifie identité ET rôle côté serveur. Masquer la carte
 * « Administration » n'est pas une garde, c'est de la lisibilité.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mon compte — Logos',
  robots: { index: false, follow: false },
};

type AccountCard = { title: string; description: string; href: string };

/** Les trois espaces d'un serviteur, dans l'ordre du parcours de dépôt. */
const MEMBER_CARDS: ReadonlyArray<AccountCard> = [
  {
    title: 'Partager un cours',
    description: 'Proposez une nouvelle ressource à la bibliothèque.',
    href: '/partager',
  },
  {
    title: 'Mes contributions',
    description: 'Consultez vos cours déposés et leur statut.',
    href: '/mes-contributions',
  },
  {
    title: 'Mes questions',
    description:
      'Retrouvez les questions qui vous ont été posées sur vos ressources.',
    href: '/mes-questions',
  },
];

/** L'administrateur garde les trois cartes du serviteur, et ajoute la sienne. */
const ADMIN_CARD: AccountCard = {
  title: 'Administration',
  description: 'Modérez les ressources déposées et publiez-les.',
  href: '/admin',
};

export default async function ComptePage() {
  const user = await requireMember('/compte');
  const isAdmin = user.role === 'ADMIN';

  const cards = isAdmin ? [...MEMBER_CARDS, ADMIN_CARD] : MEMBER_CARDS;

  return (
    <>
      <Header currentPath="/compte" />

      <main className="mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <p className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-walnut-700">
          {isAdmin ? 'Espace administration' : 'Espace serviteur'}
        </p>
        <h1 className="mt-12 font-display text-h1-mobile tablet:text-h1">
          Mon compte
        </h1>

        {/* Une seule colonne en mobile : une adresse longue y tiendrait mal
            sur une demi-largeur, et `break-words` la coupe si besoin. */}
        <dl className="mt-26 max-w-form rounded-panel border border-line bg-surface px-[20px] py-16 tablet:grid tablet:grid-cols-2 tablet:gap-x-[32px]">
          <div>
            <dt className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-walnut-900">
              Adresse
            </dt>
            <dd className="mt-[6px] break-words text-[14.5px]">{user.email}</dd>
          </div>
          <div className="mt-16 tablet:mt-0">
            <dt className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-walnut-900">
              Rôle
            </dt>
            <dd className="mt-[6px] text-[14.5px]">{ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>

        <ul className="mt-26 grid gap-12 tablet:grid-cols-2">
          {cards.map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="flex h-full flex-col rounded-panel border border-line bg-surface px-[20px] py-16 transition-colors duration-[150ms] ease-logos hover:bg-cover-plate focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-walnut-900"
              >
                <span className="font-display text-[20px] leading-[1.2] text-walnut-900">
                  {card.title}
                  <span aria-hidden className="ml-[8px] text-[16px]">
                    →
                  </span>
                </span>
                <span className="mt-12 text-body text-text-secondary">
                  {card.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* La déconnexion est une écriture : un formulaire et une Server
            Action, jamais un simple lien. */}
        <form action={signOut} className="mt-34">
          <Button type="submit" variant="secondary">
            Se déconnecter
          </Button>
        </form>
      </main>
    </>
  );
}
