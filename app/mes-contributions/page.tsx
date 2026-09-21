import type { Metadata } from 'next';

import { Header } from '@/components/layout/Header';
import { SignOutButton } from '@/components/layout/SignOutButton';
import { Panel } from '@/components/ui/Panel';
import { requireMember } from '@/lib/auth/session';

/*
 * Mes contributions — espace authentifié.
 *
 * Cette étape n'établit que le PÉRIMÈTRE. Le tableau des dépôts, les statuts
 * et le cycle de correction appartiennent à l'étape suivante : aucun contenu
 * n'est simulé ici, et aucune ressource n'est lue.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mes contributions — Logos',
  robots: { index: false, follow: false },
};

export default async function MesContributionsPage() {
  const user = await requireMember('/mes-contributions');

  return (
    <>
      <Header
        currentPath="/mes-contributions"
        accountAction={<SignOutButton />}
      />

      <main className="mx-auto max-w-content px-20 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <h1 className="font-display text-h1-mobile tablet:text-h1">
          Mes contributions
        </h1>
        <p className="mt-12 text-body text-text-secondary">
          Connecté en tant que {user.email}.
        </p>

        <Panel accent="gold" className="mt-26 max-w-reading">
          Le suivi de vos dépôts sera disponible à la prochaine étape.
        </Panel>
      </main>
    </>
  );
}
