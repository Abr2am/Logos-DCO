import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ResourceForm } from '@/components/contribution/ResourceForm';
import { Header } from '@/components/layout/Header';
import { ResourceCover } from '@/components/library/ResourceCover';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button, buttonClassName } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import { MetadataBlock, Panel } from '@/components/ui/Panel';
import { Status } from '@/components/ui/Status';
import { requireAdmin } from '@/lib/auth/session';
import {
  archiveResource,
  publishResource,
  updateResourceAsAdmin,
} from '@/lib/contributions/actions';
import { getAdminResource } from '@/lib/contributions/queries';
import { coverFamilyFromKey } from '@/lib/cover/families';
import {
  AUDIENCES,
  RESOURCE_TYPES,
  fileFormatLine,
} from '@/lib/domain/resource';
import { getCategories } from '@/lib/library/queries';

import { RequestChangesForm } from './RequestChangesForm';

/*
 * Modération d'une ressource.
 *
 * Seul écran où l'identité et l'e-mail du dépositaire sont visibles — ces
 * informations ne sont jamais publiques.
 *
 * Quatre actions, et rien d'autre : modifier, publier, demander des
 * corrections, archiver. Chacune n'est proposée que si la matrice de
 * transitions l'autorise — et la base le revérifie de toute façon.
 *
 * Le dépositaire d'origine reste le dépositaire, même après modification.
 */

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: 'Modération — Logos',
  robots: { index: false, follow: false },
};

export default async function ModerationPage({ params }: PageProps) {
  const { id } = await params;
  await requireAdmin(`/admin/ressources/${id}`);
  if (!UUID.test(id)) notFound();

  const [resource, categories] = await Promise.all([
    getAdminResource(id),
    getCategories(),
  ]);
  if (!resource) notFound();

  const formatLine = fileFormatLine(resource);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <Breadcrumb
          items={[
            { label: 'Administration', href: '/admin' },
            { label: resource.title },
          ]}
        />

        <div className="mt-16 flex flex-wrap items-baseline gap-16">
          <h1 className="font-display text-h1-mobile tablet:text-h1">
            {resource.title}
          </h1>
          <Status status={resource.status} />
        </div>

        <div className="mt-26 desktop:grid desktop:grid-cols-[var(--container-cover-detail)_1fr] desktop:gap-56">
          <div className="mx-auto w-[186px] desktop:mx-0 desktop:w-full">
            <ResourceCover
              variant="detail"
              family={coverFamilyFromKey(resource.id)}
              category={resource.subcategoryName ?? resource.categoryName}
              title={resource.title}
            />
          </div>

          <div className="mt-26 desktop:mt-0">
            <p className="max-w-reading text-body text-text-secondary">
              {resource.description}
            </p>

            <div className="mt-26">
              <MetadataBlock
                items={[
                  {
                    label: 'Catégorie',
                    value: resource.subcategoryName
                      ? `${resource.categoryName} · ${resource.subcategoryName}`
                      : resource.categoryName,
                  },
                  {
                    label: 'Type',
                    value: RESOURCE_TYPES[resource.resourceType],
                  },
                  {
                    label: 'Public',
                    value: resource.audiences
                      .map((audience) => AUDIENCES[audience])
                      .join(' · '),
                  },
                  { label: 'Format', value: formatLine || '—' },
                ]}
              />
            </div>

            {/* Informations administratives — jamais publiques. */}
            <div className="mt-16">
              <MetadataBlock
                items={[
                  { label: 'Dépositaire', value: resource.depositorEmail },
                  {
                    label: 'Nom',
                    value: resource.depositorName ?? '—',
                  },
                  { label: 'Fichier', value: resource.filename ?? '—' },
                  {
                    label: 'Soumise le',
                    value: resource.submittedAt
                      ? new Date(resource.submittedAt).toLocaleDateString(
                          'fr-FR',
                        )
                      : '—',
                  },
                ]}
              />
            </div>

            {resource.flags.length > 0 ? (
              <div className="mt-26">
                <p className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-burgundy">
                  Flags
                </p>
                <div className="mt-12 flex flex-wrap gap-[7px]">
                  {resource.flags.map((flag) => (
                    <Flag key={flag}>{flag}</Flag>
                  ))}
                </div>
              </div>
            ) : null}

            {resource.adminComment ? (
              <Panel
                accent="burgundy"
                label="Commentaire de l'administrateur"
                className="mt-26"
              >
                {resource.adminComment}
              </Panel>
            ) : null}
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <section className="mt-56 border-t border-line pt-34">
          <h2 className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-burgundy">
            Actions
          </h2>

          <div className="mt-16 flex flex-wrap items-start gap-12">
            {resource.status === 'PENDING' ? (
              <form action={publishResource}>
                <input type="hidden" name="id" value={resource.id} />
                <Button type="submit">Publier</Button>
              </form>
            ) : null}

            {resource.status === 'PUBLISHED' ? (
              <>
                <form action={archiveResource}>
                  <input type="hidden" name="id" value={resource.id} />
                  <Button type="submit" variant="secondary">
                    Archiver
                  </Button>
                </form>
                <Link
                  href={`/ressource/${resource.id}`}
                  className={buttonClassName('tertiary')}
                >
                  Voir la fiche publique
                </Link>
              </>
            ) : null}
          </div>

          {resource.status === 'PENDING' ? (
            <div className="mt-26 max-w-form">
              <RequestChangesForm id={resource.id} />
            </div>
          ) : null}
        </section>

        {/* ── Modification ────────────────────────────────────────────── */}
        <section className="mt-56 border-t border-line pt-34">
          <h2 className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-burgundy">
            Modifier
          </h2>
          <p className="mt-12 max-w-reading text-small text-help">
            Le dépositaire d&apos;origine reste enregistré comme dépositaire.
          </p>
          <div className="mt-26 max-w-form">
            <ResourceForm
              categories={categories}
              action={updateResourceAsAdmin}
              submitLabel="Enregistrer les modifications"
              resource={resource}
              fileRequired={false}
            />
          </div>
        </section>
      </main>
    </>
  );
}
