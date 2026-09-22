import type { Metadata } from 'next';
import Link from 'next/link';

import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Status } from '@/components/ui/Status';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminCounters, getAdminQueue } from '@/lib/contributions/queries';

/*
 * Tableau de bord d'administration.
 *
 * Quatre compteurs DYNAMIQUES — aucune statistique fictive — puis la liste
 * des ressources à traiter. « Mêmes tokens, aucune esthétique dashboard. »
 *
 * L'identité du dépositaire n'apparaît qu'ici et sur l'écran de modération.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administration — Logos',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdmin('/admin');

  const [counters, queue] = await Promise.all([
    getAdminCounters(),
    getAdminQueue(),
  ]);

  const tiles = [
    { label: 'En attente', value: counters.pending },
    { label: 'Publiées', value: counters.published },
    { label: 'À corriger', value: counters.rejected },
    { label: 'Archivées', value: counters.archived },
  ];

  return (
    <>
      <Header />

      <main className="mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <div className="flex items-baseline gap-16">
          <h1 className="font-display text-h1-mobile tablet:text-h1">
            Ressources
          </h1>
          <span className="rounded-status bg-walnut-900 px-[10px] py-[4px] font-mono text-mono font-medium uppercase tracking-[0.13em] text-on-dark">
            Admin
          </span>
        </div>

        <dl className="mt-26 grid grid-cols-2 gap-12 desktop:grid-cols-4">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded-panel border border-line bg-surface px-[20px] py-16"
            >
              <dt className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-burgundy">
                {tile.label}
              </dt>
              <dd className="mt-[6px] font-display text-[34px] leading-none">
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>

        {queue.length === 0 ? (
          <div className="mt-34">
            <EmptyState title="Aucune ressource déposée" />
          </div>
        ) : (
          <>
            {/* Desktop : tableau de quatre colonnes.
                Sous 1024 px, l'adresse du dépositaire déborderait ; la file
                bascule alors en cartes empilées, comme « Mes contributions ». */}
            <table className="mt-34 hidden w-full desktop:table">
              <thead>
                <tr>
                  {['Titre', 'Dépositaire', 'Statut', 'Soumise le'].map((h) => (
                    <th
                      key={h}
                      className="border-b border-line pb-12 pr-[14px] text-left font-mono text-mono font-medium uppercase tracking-[0.13em] text-help"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-line-hairline py-[14px] pr-[14px]">
                      <Link
                        href={`/admin/ressources/${item.id}`}
                        className="font-medium underline-offset-4 hover:text-burgundy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
                      >
                        {item.title}
                      </Link>
                      <span className="block text-small text-help">
                        {item.categoryName}
                      </span>
                    </td>
                    <td className="border-b border-line-hairline py-[14px] pr-[14px] text-[13px]">
                      {item.depositorEmail}
                    </td>
                    <td className="border-b border-line-hairline py-[14px] pr-[14px]">
                      <Status status={item.status} />
                    </td>
                    <td className="border-b border-line-hairline py-[14px] text-[13px] text-help">
                      {new Date(
                        item.submittedAt ?? item.createdAt,
                      ).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="mt-26 grid gap-12 desktop:hidden">
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="rounded-panel border border-line bg-surface p-16"
                >
                  <Link
                    href={`/admin/ressources/${item.id}`}
                    className="font-medium underline-offset-4 hover:text-burgundy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-[3px] text-small text-help">
                    {item.categoryName}
                  </p>
                  <p className="mt-12 break-all text-small text-help">
                    {item.depositorEmail}
                  </p>
                  <div className="mt-12 flex items-center justify-between gap-12">
                    <Status status={item.status} />
                    <span className="text-small text-help">
                      {new Date(
                        item.submittedAt ?? item.createdAt,
                      ).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
