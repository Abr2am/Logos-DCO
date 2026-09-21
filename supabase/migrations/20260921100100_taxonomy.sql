-- =============================================================================
-- Taxonomie de la bibliothèque — NEUF catégories, et trois sous-catégories
-- sous « Vie chrétienne » uniquement.
--
-- C'est une donnée de référence, pas du contenu éditable : aucune policy
-- d'écriture n'existe, pour personne, administrateur compris. La taxonomie ne
-- change que par migration. C'est le verrou technique de la règle
-- « ne jamais créer de catégorie supplémentaire ».
-- =============================================================================

create table public.categories (
  id         smallint primary key,
  slug       text not null unique,
  name       text not null unique,
  sort_order smallint not null unique,

  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.subcategories (
  id          smallint primary key,
  category_id smallint not null references public.categories (id),
  slug        text not null,
  name        text not null,
  sort_order  smallint not null,

  constraint subcategories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  unique (category_id, slug),
  unique (category_id, sort_order),
  --支 Cible de la clé étrangère composite des ressources : elle garantit
  -- qu'une sous-catégorie appartient bien à la catégorie déclarée.
  unique (id, category_id)
);

comment on table public.categories is
  'Neuf catégories, figées. Aucune policy d''écriture : modification par migration uniquement.';
comment on table public.subcategories is
  'Sous-catégories — uniquement sous « Vie chrétienne ». Mêmes règles que les catégories.';
