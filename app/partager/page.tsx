import type { Metadata } from 'next';
import Link from 'next/link';

import { ResourceForm } from '@/components/contribution/ResourceForm';
import { Header } from '@/components/layout/Header';
import { buttonClassName } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { requireMember } from '@/lib/auth/session';
import { submitResource, updateResource } from '@/lib/contributions/actions';
import { getEditableResource } from '@/lib/contributions/queries';
import { getCategories } from '@/lib/library/queries';

/*
 * Partager un cours — formulaire en UNE SEULE PAGE, jamais un wizard.
 *
 * Le serviteur ne publie jamais : la soumission mène en PENDING, et la
 * validation humaine reste la règle.
 *
 * La correction d'une ressource « À corriger » réutilise ce même formulaire
 * via `?ressource=<id>` : le cahier des charges prévoit « Modifier la
 * ressource » sans définir de route distincte, et la liste des routes est
 * fermée.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partager un cours — Logos',
  robots: { index: false, follow: false },
};

export default async function PartagerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireMember('/partager');
  const params = await searchParams;

  const submitted = params.soumise === '1';
  const rawId = Array.isArray(params.ressource)
    ? params.ressource[0]
    : params.ressource;

  const [categories, resource] = await Promise.all([
    getCategories(),
    rawId ? getEditableResource(rawId) : Promise.resolve(null),
  ]);

  const correcting = Boolean(resource);

  return (
    <>
      <Header currentPath="/partager" />

      <main className="mx-auto max-w-form px-22 py-34 tablet:px-26 tablet:py-44">
        <h1 className="font-display text-h1-mobile tablet:text-h1">
          {correcting ? 'Corriger la ressource' : 'Partager un cours'}
        </h1>

        {submitted ? (
          <>
            <Panel accent="gold" className="mt-26">
              <span className="font-display text-[20px] leading-[1.2]">
                Ressource soumise
              </span>
              <p className="mt-12 text-body text-text-secondary">
                Votre ressource a bien été transmise à l&apos;équipe de Logos.
                Elle sera examinée par un administrateur avant d&apos;être
                publiée dans la bibliothèque.
              </p>
            </Panel>
            <div className="mt-22 flex flex-wrap gap-12">
              <Link
                href="/mes-contributions"
                className={buttonClassName('primary')}
              >
                Voir mes contributions
              </Link>
              <Link href="/partager" className={buttonClassName('secondary')}>
                Soumettre une autre ressource
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-12 text-body text-text-secondary">
              {correcting
                ? 'Corrigez votre ressource, puis resoumettez-la depuis « Mes contributions ».'
                : 'Votre ressource sera relue par un administrateur avant publication.'}
            </p>

            {resource?.adminComment ? (
              <Panel
                accent="burgundy"
                label="Commentaire de l'administrateur"
                className="mt-26"
              >
                {resource.adminComment}
              </Panel>
            ) : null}

            <div className="mt-26">
              <ResourceForm
                categories={categories}
                action={correcting ? updateResource : submitResource}
                submitLabel={
                  correcting
                    ? 'Enregistrer les corrections'
                    : 'Soumettre la ressource'
                }
                note={
                  correcting
                    ? undefined
                    : 'Relu par un administrateur avant publication.'
                }
                resource={resource}
                fileRequired={!correcting}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}
