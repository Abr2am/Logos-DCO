-- =============================================================================
-- API de la bibliothèque publique.
--
-- Deux fonctions, posées SUR les vues publiques : le filtre
-- `status = 'PUBLISHED'` reste structurel, et aucune colonne sensible ne peut
-- remonter, quelle que soit la façon dont l'application les appelle.
--
-- Recherche : PostgreSQL seul, sur titre · description · catégorie ·
-- sous-catégorie · flags. Aucune recherche dans le contenu des fichiers,
-- aucune recherche sémantique, aucun moteur vectoriel.
--
-- Tri — décision validée (point « B », tranché le 21/09/2026) : les ressources
-- sont présentées par DATE DE PUBLICATION DÉCROISSANTE, de la plus récente à
-- la plus ancienne. Lorsqu'une requête textuelle est présente, la pertinence
-- prime et la date départage les résultats de même rang.
--
-- Pagination — décision validée (point « A », tranché le 21/09/2026) : aucune
-- pagination n'est nécessaire. Aucune limite n'est imposée, et aucun mécanisme
-- de pagination n'est introduit.
-- =============================================================================

create function public.search_published_resources(
  p_query           text   default null,
  p_category_slug   text   default null,
  p_subcategory_slug text  default null,
  p_flags           text[] default null
)
returns table (
  id                uuid,
  title             text,
  category_slug     text,
  category_name     text,
  subcategory_slug  text,
  subcategory_name  text,
  resource_type     public.resource_type,
  format            public.file_format,
  page_count        integer,
  slide_count       integer,
  published_at      timestamptz
)
language sql
stable
set search_path = public
as $$
  with params as (
    select nullif(btrim(coalesce(p_query, '')), '')          as q,
           nullif(btrim(coalesce(p_category_slug, '')), '')   as category_slug,
           nullif(btrim(coalesce(p_subcategory_slug, '')), '') as subcategory_slug,
           coalesce(p_flags, '{}'::text[])                    as flags
  ),
  matched as (
    select r.*,
           p.q as query_text,
           case
             when p.q is null then null
             else websearch_to_tsquery('public.logos_french', p.q)
           end as query
      from public.published_resources r
     cross join params p
     where (p.category_slug is null or exists (
             select 1 from public.categories c
              where c.id = r.category_id and c.slug = p.category_slug))
       and (p.subcategory_slug is null or exists (
             select 1 from public.subcategories s
              where s.id = r.subcategory_id and s.slug = p.subcategory_slug))
       /* Plusieurs flags sélectionnés : logique OU. */
       and (cardinality(p.flags) = 0 or exists (
             select 1
               from public.published_resource_flags pf
              where pf.resource_id = r.id
                and public.normalize_text(pf.flag) in (
                      select public.normalize_text(x) from unnest(p.flags) x)))
  )
  select m.id,
         m.title,
         c.slug,
         c.name,
         s.slug,
         s.name,
         m.resource_type,
         f.format,
         f.page_count,
         f.slide_count,
         m.published_at
    from matched m
    join public.categories c on c.id = m.category_id
    left join public.subcategories s on s.id = m.subcategory_id
    left join public.published_resource_files f on f.resource_id = m.id
   where m.query is null or m.search_vector @@ m.query
   order by
     case when m.query is null then 0
          else ts_rank(m.search_vector, m.query) end desc,
     -- Tri validé : date de publication décroissante.
     m.published_at desc nulls last,
     m.id;
$$;

comment on function public.search_published_resources is
  'Recherche et filtrage des ressources publiées. Posée sur les vues publiques : ne peut structurellement rien exposer d''autre.';

-- -----------------------------------------------------------------------------
-- Flags proposés en filtre.
--
-- Ce n'est PAS un référentiel : c'est l'agrégation des mots-clés réellement
-- présents sur les ressources publiées de la branche consultée. Aucun écran de
-- gestion, aucun cycle de vie, aucune validation.
-- -----------------------------------------------------------------------------

create function public.published_flags(
  p_category_slug    text default null,
  p_subcategory_slug text default null
)
returns table (flag text)
language sql
stable
set search_path = public
as $$
  /* Le tri passe par la forme normalisée : un `order by` direct dépendrait de
     la collation de la base, et « Église » se retrouverait après « Veillée »
     sur un cluster en collation C. */
  select t.flag
    from (
      select distinct pf.flag, public.normalize_text(pf.flag) as sort_key
        from public.published_resource_flags pf
        join public.published_resources r on r.id = pf.resource_id
       where (nullif(btrim(coalesce(p_category_slug, '')), '') is null or exists (
               select 1 from public.categories c
                where c.id = r.category_id and c.slug = p_category_slug))
         and (nullif(btrim(coalesce(p_subcategory_slug, '')), '') is null or exists (
               select 1 from public.subcategories s
                where s.id = r.subcategory_id and s.slug = p_subcategory_slug))
    ) t
   order by t.sort_key, t.flag;
$$;

grant execute on function public.search_published_resources(text, text, text, text[])
  to anon, authenticated;
grant execute on function public.published_flags(text, text)
  to anon, authenticated;
