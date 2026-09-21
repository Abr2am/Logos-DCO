import { notFound } from 'next/navigation';

import { BrandMark } from '@/components/brand/BrandMark';
import { RosaceHero, RosacePastille } from '@/components/brand/Rosace';
import { TopBanner } from '@/components/brand/TopBanner';
import { Header } from '@/components/layout/Header';
import { ResourceCard } from '@/components/library/ResourceCard';
import { ResourceCover } from '@/components/library/ResourceCover';
import { Shelf } from '@/components/library/Shelf';
import { ThemeCard } from '@/components/library/ThemeCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Flag, FlagAdd, FlagFilter, FlagRemovable } from '@/components/ui/Flag';
import { Input } from '@/components/ui/Input';
import { MetadataBlock, Panel } from '@/components/ui/Panel';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Select } from '@/components/ui/Select';
import { Status } from '@/components/ui/Status';
import { Textarea } from '@/components/ui/Textarea';
import { COVER_FAMILIES } from '@/lib/cover/families';

/*
 * Planche de vérification des fondations visuelles.
 *
 * Ce n'est PAS une page produit : elle ne figure pas dans la liste fermée des
 * routes du cahier des charges et n'est servie qu'en développement. En
 * production, elle répond 404 — la liste des routes publiques reste fermée.
 *
 * Elle existe pour confronter chaque primitive à sa spécification du Design
 * System sans avoir à construire une page réelle.
 */

export const metadata = { robots: { index: false, follow: false } };

function Sheet({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-panel border border-line bg-surface">
      <h2 className="bg-walnut-900 px-[18px] py-[9px] font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-[rgb(247_243_234/0.72)]">
        {title}
      </h2>
      <div className="px-26 py-34">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-12 mt-22 font-mono text-mono first:mt-0 font-medium uppercase tracking-[0.13em] text-burgundy">
      {children}
    </p>
  );
}

const SAMPLE_COVERS = [
  { category: 'Dogme', title: 'Le Credo, phrase par phrase' },
  { category: 'Rites & Liturgie', title: 'Comprendre la Divine Liturgie' },
  {
    category: 'Formation des serviteurs',
    title: 'Accompagner les jeunes serviteurs',
  },
  { category: 'Saints', title: 'Saint Antoine, père des moines' },
  { category: 'Spiritualité', title: 'Prier avec les Psaumes' },
] as const;

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="min-h-screen bg-ivory">
      <Header currentPath="/bibliotheque" />

      <main className="mx-auto max-w-content space-y-34 px-20 py-44 tablet:px-26 desktop:px-44">
        <div>
          <h1 className="font-display text-h1-mobile tablet:text-h1">
            Fondations visuelles
          </h1>
          <p className="mt-12 max-w-reading text-body text-text-secondary">
            Planche de vérification des primitives, confrontée au Design System
            V1.1. Développement uniquement — cette route répond 404 en
            production.
          </p>
        </div>

        <Sheet title="Marque · bandeau · rosace">
          <div className="grid gap-34 tablet:grid-cols-2">
            <div>
              <Label>Brand mark — fond clair</Label>
              <div className="flex flex-wrap items-end gap-[30px] rounded-panel border border-line bg-surface p-22">
                <BrandMark size="sm" />
                <BrandMark size="md" />
              </div>
              <Label>Brand mark — fond noyer</Label>
              <div className="rounded-panel bg-walnut-900 p-22">
                <BrandMark size="md" tone="dark" />
              </div>
            </div>
            <div>
              <Label>Bandeau — signature de toutes les pages</Label>
              <div className="overflow-hidden rounded-panel border border-line">
                <TopBanner />
                <div className="h-[44px] bg-surface" />
              </div>
              <Label>Pastilles — 22 · 26 · 34 (état vide)</Label>
              <div className="flex items-center gap-16 rounded-panel border border-line bg-surface p-22">
                <RosacePastille size={22} />
                <RosacePastille size={26} />
                <RosacePastille size={34} tone="gold" />
              </div>
            </div>
          </div>

          <Label>
            Hero — filigrane desktop (multiply 11 %) · mobile (luminosity 30 %)
          </Label>
          <div className="grid gap-16 tablet:grid-cols-2">
            <div className="relative h-[220px] overflow-hidden rounded-panel border border-line bg-ivory">
              <RosaceHero
                variant="desktop"
                className="absolute left-1/2 top-[30%] w-[560px] -translate-x-1/2"
              />
            </div>
            <div className="relative h-[220px] overflow-hidden rounded-panel bg-walnut-900">
              <RosaceHero
                variant="mobile"
                className="absolute left-1/2 top-[-60px] w-[300px] -translate-x-1/2"
              />
            </div>
          </div>
        </Sheet>

        <Sheet title="Boutons">
          <div className="flex flex-wrap items-center gap-16">
            <Button>Explorer la bibliothèque</Button>
            <Button variant="secondary">Partager un cours</Button>
            <Button variant="tertiary">Voir mes contributions</Button>
            <Button disabled>Désactivé</Button>
          </div>
          <div className="mt-16 flex flex-wrap items-center gap-16 rounded-panel bg-walnut-900 p-22">
            <Button variant="primaryOnWalnut">Partager un cours</Button>
            <Button variant="secondaryOnWalnut">Sur noyer</Button>
          </div>
          <Label>Mobile — pleine largeur, empilés, gap 9, min. 48 px</Label>
          <div className="grid w-[300px] gap-[9px]">
            <Button fullWidth>Explorer la bibliothèque</Button>
            <Button variant="secondary" fullWidth>
              Partager un cours
            </Button>
          </div>
        </Sheet>

        <Sheet title="Recherche">
          <Label>Portée globale — max 860</Label>
          <SearchBar className="max-w-search" />
          <Label>Portée limitée à une branche — sur noyer</Label>
          <div className="rounded-control bg-walnut-900 p-16">
            <SearchBar
              scope="branch"
              branchLabel="Saints"
              className="max-w-[420px]"
            />
          </div>
        </Sheet>

        <Sheet title="Formulaires">
          <div className="grid max-w-form gap-22">
            <Input
              id="ds-titre"
              label="Titre"
              required
              placeholder="Saint Marc, apôtre de l'Égypte"
              help="Le titre affiché dans la bibliothèque."
            />
            <Textarea
              id="ds-description"
              label="Description"
              required
              placeholder="Un parcours en quatre séances sur la vie de saint Marc."
              help="1 à 3 phrases"
            />
            <Select id="ds-type" label="Type" required defaultValue="cours">
              <option value="cours">Cours / présentation</option>
              <option value="fiche">Fiche pédagogique</option>
            </Select>
            <Input
              id="ds-desactive"
              label="Champ désactivé"
              disabled
              placeholder="Sans objet"
            />
            <Input
              id="ds-erreur"
              label="Flags"
              required
              placeholder="Ajouter un mot-clé…"
              error="Cinq flags au minimum sont nécessaires pour référencer la ressource."
            />
          </div>
        </Sheet>

        <Sheet title="Flags · statuts · fil d'Ariane">
          <div className="grid gap-34 tablet:grid-cols-2">
            <div>
              <Label>Flags</Label>
              <div className="flex flex-wrap gap-[7px]">
                <Flag>Évangiles</Flag>
                <FlagFilter label="Jeunesse" />
                <FlagFilter label="Apôtres" selected />
                <FlagRemovable label="Saint Marc" />
                <FlagAdd />
              </div>
              <Label>Statuts — jamais dans la bibliothèque publique</Label>
              <div className="flex flex-wrap gap-[9px]">
                <Status status="PENDING" />
                <Status status="PUBLISHED" />
                <Status status="REJECTED" />
                <Status status="ARCHIVED" />
              </div>
            </div>
            <div>
              <Label>Fil d&apos;Ariane</Label>
              <Breadcrumb
                items={[
                  { label: 'Accueil', href: '/' },
                  { label: 'Bibliothèque', href: '/bibliotheque' },
                  { label: 'Saints', href: '/bibliotheque/saints' },
                  { label: "Saint Marc, apôtre de l'Égypte" },
                ]}
              />
              <div className="mt-12 rounded-control bg-walnut-900 px-[14px] py-12">
                <Breadcrumb
                  tone="dark"
                  items={[
                    { label: 'Accueil', href: '/' },
                    { label: 'Bibliothèque', href: '/bibliotheque' },
                    { label: 'Saints' },
                  ]}
                />
              </div>
              <Label>Titre de section</Label>
              <SectionHeading
                title="Explorer par thème"
                action={{
                  label: 'Voir la bibliothèque',
                  href: '/bibliotheque',
                }}
              />
            </div>
          </div>
        </Sheet>

        <Sheet title="Couvertures — cinq familles, aucune sémantique de catégorie">
          <div className="grid grid-cols-2 gap-16 tablet:grid-cols-5 tablet:gap-22">
            {COVER_FAMILIES.map((family, index) => {
              const sample = SAMPLE_COVERS[index] ?? SAMPLE_COVERS[0];
              return (
                <div key={family}>
                  <ResourceCover
                    family={family}
                    category={sample.category}
                    title={sample.title}
                  />
                  <p className="mt-[10px] font-mono text-[9px] uppercase tracking-[0.12em] text-help">
                    {String(index + 1).padStart(2, '0')} · {family}
                  </p>
                </div>
              );
            })}
          </div>
          <Label>Couverture de fiche — 330 px, tranche 9 px</Label>
          <ResourceCover
            variant="detail"
            family="burgundy"
            category="Saints"
            title="Saint Marc, apôtre de l'Égypte"
            className="w-[330px]"
          />
        </Sheet>

        <Sheet title="Cartes · tablette">
          <Label>Rangée de couvertures close par une tablette</Label>
          <div className="grid grid-cols-2 gap-16 tablet:grid-cols-4 tablet:gap-26">
            {SAMPLE_COVERS.slice(0, 4).map((sample, index) => (
              <ResourceCard
                key={sample.title}
                href="/design-system"
                family={COVER_FAMILIES[index] ?? 'burgundy'}
                category={sample.category}
                title={sample.title}
                meta="Cours · PDF · 32 pages"
              />
            ))}
          </div>
          <Shelf className="mt-[18px]" />

          <Label>Cartes de thème — aucun compteur</Label>
          <div className="grid gap-[10px] tablet:grid-cols-2">
            <ThemeCard name="Bible" href="/bibliotheque/bible" />
            <ThemeCard name="Saints" href="/bibliotheque/saints" selected />
            <ThemeCard
              name="Vie chrétienne"
              href="/bibliotheque/vie-chretienne"
              subthemes={['Petite enfance', 'Jeunesse', 'Famille']}
            />
          </div>
        </Sheet>

        <Sheet title="Panneaux · métadonnées · états vides">
          <Label>Bloc de métadonnées — 2 × 2</Label>
          <MetadataBlock
            items={[
              { label: 'Catégorie', value: 'Saints' },
              { label: 'Type', value: 'Cours / présentation' },
              { label: 'Public', value: 'Adolescents · Jeunes adultes' },
              { label: 'Format', value: 'PDF · 32 pages' },
            ]}
          />
          <div className="mt-16 grid gap-12 tablet:grid-cols-2">
            <Panel accent="burgundy" label="Commentaire de l'administrateur">
              Il manque la tranche d&apos;âge visée dans la description.
            </Panel>
            <Panel accent="gold" label="Ressource soumise">
              Votre ressource a bien été transmise à l&apos;équipe de Logos.
            </Panel>
          </div>
          <Label>États vides</Label>
          <div className="grid gap-16 tablet:grid-cols-2">
            <EmptyState
              title="Aucune ressource ne correspond"
              description="Essayez un autre mot, ou retirez un filtre."
              action={<Button variant="secondary">Retirer les filtres</Button>}
            />
            <Panel accent="burgundy">
              <span className="font-display text-[20px]">
                Cette ressource n&apos;est pas disponible
              </span>
            </Panel>
          </div>
        </Sheet>
      </main>
    </div>
  );
}
