import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Header } from '@/components/layout/Header';
import { ResourceCover } from '@/components/library/ResourceCover';
import { Shelf } from '@/components/library/Shelf';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { buttonClassName } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import { MetadataBlock } from '@/components/ui/Panel';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { coverFamilyFromKey } from '@/lib/cover/families';
import {
  AUDIENCES,
  RESOURCE_TYPES,
  fileFormatLine,
} from '@/lib/domain/resource';
import { getPublishedResource } from '@/lib/library/queries';
import { libraryHref } from '@/lib/library/url';
import { issueFormToken } from '@/lib/questions/antispam';

import { QuestionForm } from './QuestionForm';

/*
 * Fiche ressource.
 *
 * Contenu imposé : breadcrumb · couverture · titre · description · catégorie ·
 * sous-catégorie si applicable · publics · type · flags · format ·
 * pagination · bouton « Télécharger la ressource ».
 *
 * PAS d'auteur public. Pas de likes, pas de favoris, pas de notes, pas de
 * commentaires.
 *
 * Le bloc Questions ne montre QUE le formulaire : les questions reçues ne
 * s'affichent nulle part publiquement, elles n'existent que pour le
 * dépositaire et pour l'administration.
 *
 * Une ressource inexistante et une ressource non publiée donnent la même
 * réponse : `notFound()`. Rien ne doit permettre de les distinguer.
 */

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = { params: Promise<{ id: string }> };

async function load(params: PageProps['params']) {
  const { id } = await params;
  if (!UUID.test(id)) return null;
  return getPublishedResource(id);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resource = await load(params);
  return { title: resource ? `${resource.title} — Logos` : 'Logos' };
}

export default async function RessourcePage({ params }: PageProps) {
  const resource = await load(params);
  if (!resource) notFound();

  const formatLine = fileFormatLine(resource);
  const location = resource.subcategoryName
    ? `${resource.categoryName} · ${resource.subcategoryName}`
    : resource.categoryName;

  return (
    <>
      <Header currentPath="/bibliotheque" />

      <main className="mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Bibliothèque', href: '/bibliotheque' },
            {
              label: resource.categoryName,
              href: libraryHref({ categorySlug: resource.categorySlug }),
            },
            ...(resource.subcategoryName && resource.subcategorySlug
              ? [
                  {
                    label: resource.subcategoryName,
                    href: libraryHref({
                      categorySlug: resource.categorySlug,
                      subcategorySlug: resource.subcategorySlug,
                    }),
                  },
                ]
              : []),
            { label: resource.title },
          ]}
        />

        <div className="mt-26 desktop:grid desktop:grid-cols-[var(--container-cover-detail)_1fr] desktop:gap-56">
          {/* Couverture, tablette, téléchargement, ligne de format. */}
          <div className="mx-auto w-[186px] tablet:w-[260px] desktop:mx-0 desktop:w-full">
            <ResourceCover
              variant="detail"
              family={coverFamilyFromKey(resource.id)}
              category={resource.subcategoryName ?? resource.categoryName}
              title={resource.title}
            />
            <Shelf className="mt-[18px]" />

            {/* Desktop : le téléchargement se place sous la couverture. */}
            <div className="mt-22 hidden desktop:block">
              <DownloadButton id={resource.id} formatLine={formatLine} />
            </div>
          </div>

          <div className="mt-26 desktop:mt-0">
            <h1 className="font-display text-h1-mobile tablet:text-h1">
              {resource.title}
            </h1>
            <p className="mt-16 max-w-reading text-body-lg-mobile text-text-secondary tablet:text-body-lg">
              {resource.description}
            </p>

            <div className="mt-26 desktop:hidden">
              <DownloadButton id={resource.id} formatLine={formatLine} />
            </div>

            <div className="mt-26">
              <MetadataBlock
                items={[
                  { label: 'Catégorie', value: location },
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
                  { label: 'Format', value: formatLine },
                ]}
              />
            </div>

            {resource.flags.length > 0 ? (
              <div className="mt-26">
                <p className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-walnut-900">
                  Flags
                </p>
                <div className="mt-12 flex flex-wrap gap-[7px]">
                  {resource.flags.map((flag) => (
                    <Flag key={flag}>{flag}</Flag>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Poser une question — aucun compte requis, aucune question affichée. */}
        <section className="mt-56 max-w-reading">
          <SectionHeading title="Poser une question" />
          <p className="mt-12 text-body text-text-secondary">
            Votre question est transmise au dépositaire de cette ressource, qui
            vous répondra par e-mail. Ce n&apos;est pas un espace de
            commentaires : rien de ce que vous écrivez ici n&apos;est publié.
          </p>
          <div className="mt-22">
            <QuestionForm
              resourceId={resource.id}
              formToken={issueFormToken()}
            />
          </div>
        </section>
      </main>
    </>
  );
}

function DownloadButton({
  id,
  formatLine,
}: {
  id: string;
  formatLine: string;
}) {
  return (
    <div>
      <a
        href={`/api/telechargement/${id}`}
        className={buttonClassName('primary', false, 'w-full')}
      >
        Télécharger la ressource
      </a>
      <p className="mt-12 text-small text-help">{formatLine}</p>
    </div>
  );
}
