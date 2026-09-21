import type { Metadata } from 'next';

import { Header } from '@/components/layout/Header';
import { SignOutButton } from '@/components/layout/SignOutButton';
import { Panel } from '@/components/ui/Panel';
import { requireMember } from '@/lib/auth/session';

/*
 * Partager un cours — espace authentifié.
 *
 * Cette étape n'établit que le PÉRIMÈTRE : le formulaire de dépôt en une seule
 * page et le workflow de soumission appartiennent à l'étape suivante. Aucune
 * donnée métier n'est simulée ici.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partager un cours — Logos',
  robots: { index: false, follow: false },
};

export default async function PartagerPage() {
  const user = await requireMember('/partager');

  return (
    <>
      <Header currentPath="/partager" accountAction={<SignOutButton />} />

      <main className="mx-auto max-w-form px-20 py-34 tablet:px-26 tablet:py-44">
        <h1 className="font-display text-h1-mobile tablet:text-h1">
          Partager un cours
        </h1>
        <p className="mt-12 text-body text-text-secondary">
          Connecté en tant que {user.email}.
        </p>

        <Panel accent="gold" className="mt-26">
          Le formulaire de dépôt sera disponible à la prochaine étape. Votre
          ressource sera relue par un administrateur avant publication.
        </Panel>
      </main>
    </>
  );
}
