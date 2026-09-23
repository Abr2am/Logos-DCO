import type { Metadata } from 'next';
import Link from 'next/link';

import { Header } from '@/components/layout/Header';
import { buttonClassName } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { Status } from '@/components/ui/Status';
import { requireMember } from '@/lib/auth/session';
import { resubmitResource } from '@/lib/contributions/actions';
import { getMyContributions } from '@/lib/contributions/queries';
import type { Contribution } from '@/lib/contributions/types';
import { RESOURCE_TYPES } from '@/lib/domain/resource';

/*
 * Mes contributions.
 *
 * Le serviteur ne voit QUE ses propres ressources — la RLS s'en charge, la
 * page n'a rien à filtrer.
 *
 * Une ressource « À corriger » affiche le commentaire de l'administrateur et
 * les deux actions prévues : modifier, resoumettre. Une ressource publiée est
 * en consultation seule.
 *
 * Desktop : tableau. Mobile : cartes empilées.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mes contributions — Logos',
  robots: { index: false, follow: false },
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export default async function MesContributionsPage() {
  await requireMember('/mes-contributions');
  const contributions = await getMyContributions();

  return (
    <>
      <Header currentPath="/mes-contributions" />

      <main className="mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <h1 className="font-display text-h1-mobile tablet:text-h1">
          Mes contributions
        </h1>
        <p className="mt-12 text-body text-text-secondary">
          Le suivi de vos dépôts et de leur validation.
        </p>
        <p className="mt-12">
          <Link
            href="/mes-questions"
            className="text-[13px] font-semibold text-walnut-900 underline-offset-4 hover:text-walnut-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900"
          >
            Mes questions →
          </Link>
        </p>

        {contributions.length === 0 ? (
          <div className="mt-34">
            <EmptyState
              title="Aucune contribution pour le moment"
              description="Partagez un cours pour enrichir la bibliothèque."
              action={
                <Link href="/partager" className={buttonClassName('primary')}>
                  Partager un cours
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop : tableau de cinq colonnes. */}
            <table className="mt-34 hidden w-full desktop:table">
              <thead>
                <tr>
                  {['Titre', 'Catégorie', 'Type', 'Statut', 'Soumise le'].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="border-b border-line pb-12 pr-[14px] text-left font-mono text-mono font-medium uppercase tracking-[0.13em] text-help"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {contributions.map((item) => (
                  <Row key={item.id} contribution={item} />
                ))}
              </tbody>
            </table>

            {/* Mobile et tablette : cartes empilées. */}
            <ul className="mt-26 grid gap-12 desktop:hidden">
              {contributions.map((item) => (
                <li
                  key={item.id}
                  className="rounded-panel border border-line bg-surface p-16"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-[3px] text-small text-help">
                    {item.categoryName} · {RESOURCE_TYPES[item.resourceType]}
                  </p>
                  <div className="mt-12 flex items-center justify-between gap-12">
                    <Status status={item.status} />
                    <span className="text-small text-help">
                      {formatDate(item.submittedAt ?? item.createdAt)}
                    </span>
                  </div>
                  <Correction contribution={item} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

function Row({ contribution }: { contribution: Contribution }) {
  return (
    <>
      <tr>
        <td className="border-b border-line-hairline py-[14px] pr-[14px] font-medium">
          {contribution.title}
        </td>
        <td className="border-b border-line-hairline py-[14px] pr-[14px] text-[13px]">
          {contribution.categoryName}
        </td>
        <td className="border-b border-line-hairline py-[14px] pr-[14px] text-[13px]">
          {RESOURCE_TYPES[contribution.resourceType]}
        </td>
        <td className="border-b border-line-hairline py-[14px] pr-[14px]">
          <Status status={contribution.status} />
        </td>
        <td className="border-b border-line-hairline py-[14px] text-[13px] text-help">
          {formatDate(contribution.submittedAt ?? contribution.createdAt)}
        </td>
      </tr>
      {contribution.status === 'REJECTED' ? (
        <tr>
          <td colSpan={5} className="pb-16">
            <Correction contribution={contribution} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** Zone dépliée d'une ressource à corriger : commentaire et deux actions. */
function Correction({ contribution }: { contribution: Contribution }) {
  if (contribution.status !== 'REJECTED') return null;

  return (
    <div className="mt-12">
      <Panel accent="walnut" label="Commentaire de l'administrateur">
        {contribution.adminComment ?? '—'}
      </Panel>
      <div className="mt-12 flex flex-wrap gap-12">
        <Link
          href={`/partager?ressource=${contribution.id}`}
          className={buttonClassName('secondary')}
        >
          Modifier la ressource
        </Link>
        <form action={resubmitResource}>
          <input type="hidden" name="id" value={contribution.id} />
          <button type="submit" className={buttonClassName('primary')}>
            Resoumettre la ressource
          </button>
        </form>
      </div>
    </div>
  );
}
