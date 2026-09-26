-- =============================================================================
-- Flags.
--
-- Texte LIBRE propre à chaque ressource. Ce n'est PAS un référentiel : il
-- n'existe aucune table de flags distincts, aucune clé étrangère vers une
-- taxonomie, aucun cycle de vie propre, aucun écran de gestion et aucun
-- workflow de validation.
--
-- Minimum cinq flags à la soumission — contrainte appliquée en base, pas
-- seulement dans l'interface (voir 20260921100700_resource_workflow.sql).
-- =============================================================================

create table public.resource_flags (
  resource_id uuid not null references public.resources (id) on delete cascade,
  flag        text not null,
  sort_order  smallint not null default 0,

  primary key (resource_id, flag),

  constraint resource_flags_not_blank check (btrim(flag) <> ''),
  /* Garde-fou technique contre l'abus, pas une règle produit : le cahier des
     charges ne borne pas la longueur d'un flag. */
  constraint resource_flags_length check (char_length(flag) <= 80)
);

comment on table public.resource_flags is
  'Mots-clés libres attachés à une ressource. Aucun référentiel central.';

/* Recherche et filtre par flag, insensibles à la casse. */
create index resource_flags_flag_idx
  on public.resource_flags (lower(flag));
