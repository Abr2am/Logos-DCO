-- =============================================================================
-- Ressources.
--
-- Une ressource possède UN SEUL emplacement dans la bibliothèque : une
-- catégorie, et une sous-catégorie uniquement si la catégorie en propose.
-- Aucune duplication entre catégories : les autres chemins de découverte
-- passent uniquement par les flags.
-- =============================================================================

create type public.resource_status as enum (
  'DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED'
);

create type public.resource_type as enum (
  'COURS_PRESENTATION',
  'FICHE_PEDAGOGIQUE',
  'ACTIVITE',
  'JEU',
  'SUPPORT_DE_SEANCE',
  'DOCUMENT',
  'AUTRE'
);

create type public.audience as enum (
  'PETITE_ENFANCE',
  'ENFANTS',
  'ADOLESCENTS',
  'JEUNES_ADULTES',
  'ADULTES',
  'FAMILLES',
  'SERVITEURS',
  'TOUS_PUBLICS'
);

/* Utilitaire de contrainte : une contrainte CHECK n'accepte pas de
   sous-requête, mais accepte l'appel d'une fonction immuable. */
create function public.array_has_duplicates(a anyarray)
returns boolean
language sql
immutable
as $$
  select cardinality(a) <> (select count(distinct x) from unnest(a) x);
$$;

create table public.resources (
  id             uuid primary key default gen_random_uuid(),

  title          text not null,
  description    text not null,

  category_id    smallint not null references public.categories (id),
  subcategory_id smallint,

  resource_type  public.resource_type not null,
  audiences      public.audience[] not null,

  status         public.resource_status not null default 'DRAFT',
  depositor_id   uuid not null references public.users (id),

  /* Commentaire de l'administrateur, obligatoire pour demander une
     correction. Affiché au serviteur dans « Mes contributions ». */
  admin_comment  text,

  search_vector  tsvector,

  created_at     timestamptz not null default now(),
  submitted_at   timestamptz,
  published_at   timestamptz,
  archived_at    timestamptz,
  updated_at     timestamptz not null default now(),

  constraint resources_title_not_blank
    check (btrim(title) <> ''),
  constraint resources_description_not_blank
    check (btrim(description) <> ''),
  constraint resources_audiences_not_empty
    check (cardinality(audiences) >= 1),
  constraint resources_audiences_distinct
    check (not public.array_has_duplicates(audiences)),

  /* Clé étrangère composite : garantit que la sous-catégorie appartient bien
     à la catégorie déclarée. En MATCH SIMPLE, une sous-catégorie NULL n'est
     pas contrainte — c'est le cas des huit catégories sans sous-catégorie. */
  constraint resources_subcategory_belongs_to_category
    foreign key (subcategory_id, category_id)
    references public.subcategories (id, category_id)
);

comment on column public.resources.depositor_id is
  'Dépositaire d''origine. Reste inchangé même après modification par un administrateur, et n''est jamais exposé publiquement.';

-- -----------------------------------------------------------------------------
-- Index
-- -----------------------------------------------------------------------------

create index resources_status_idx
  on public.resources (status);

create index resources_branch_idx
  on public.resources (category_id, subcategory_id);

create index resources_depositor_idx
  on public.resources (depositor_id);

/* Listing public : seules les ressources publiées y figurent.
   L'index est non ordonné — l'ordre de tri par défaut n'est pas tranché. */
create index resources_published_idx
  on public.resources (published_at)
  where status = 'PUBLISHED';

-- -----------------------------------------------------------------------------
-- updated_at
-- -----------------------------------------------------------------------------

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger resources_touch_updated_at
  before update on public.resources
  for each row execute function public.touch_updated_at();
