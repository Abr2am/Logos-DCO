-- =============================================================================
-- Recherche insensible aux accents — point ouvert « Q », tranché.
--
-- « eglise » doit trouver « Église ». La configuration `french` ne retire pas
-- les accents ; on en dérive donc une configuration dédiée qui enchaîne le
-- dictionnaire `unaccent` avant `french_stem`.
--
-- `unaccent()` n'est pas IMMUTABLE : le vecteur ne peut pas être une colonne
-- générée, ce qui est déjà le cas — il est maintenu par déclencheur.
-- =============================================================================

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

create text search configuration public.logos_french (copy = french);

/* Le schéma d'installation d'`unaccent` varie selon l'environnement
   (`extensions` sur Supabase, `public` sur un PostgreSQL nu) : le nom du
   dictionnaire est donc résolu, pas supposé. */
do $$
declare
  v_schema text;
begin
  select n.nspname into v_schema
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
   where e.extname = 'unaccent';

  if v_schema is null then
    raise exception 'Extension unaccent introuvable.';
  end if;

  execute format(
    'alter text search configuration public.logos_french
       alter mapping for hword, hword_part, word
       with %I.unaccent, french_stem',
    v_schema
  );
end;
$$;

/* Normalisation partagée — utilisée pour comparer les flags saisis dans une
   URL aux flags stockés. STABLE et non IMMUTABLE : ne peut pas servir d'index,
   ce qui est sans conséquence au volume attendu.
   
   SECURITY DEFINER : `unaccent` vit dans le schéma `extensions`, sur lequel
   les rôles clients n'ont pas forcément USAGE. Sans cela, l'appel échoue pour
   le rôle anonyme avec « function unaccent(text) does not exist ». La fonction
   ne lit aucune donnée — c'est une transformation de texte pure. */
create function public.normalize_text(p_text text)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  return lower(unaccent(coalesce(p_text, '')));
end;
$$;

grant execute on function public.normalize_text(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Le vecteur passe sur la nouvelle configuration.
-- -----------------------------------------------------------------------------

create or replace function public.build_resource_search_vector(
  p_title          text,
  p_description    text,
  p_category_id    smallint,
  p_subcategory_id smallint,
  p_resource_id    uuid
)
returns tsvector
language sql
stable
security definer
set search_path = public
as $$
  select setweight(to_tsvector('public.logos_french', coalesce(p_title, '')), 'A')
      || setweight(
           to_tsvector('public.logos_french', coalesce(
             (select string_agg(f.flag, ' ')
                from public.resource_flags f
               where f.resource_id = p_resource_id), '')), 'B')
      || setweight(
           to_tsvector('public.logos_french',
             coalesce((select c.name from public.categories c
                        where c.id = p_category_id), '')
             || ' ' ||
             coalesce((select s.name from public.subcategories s
                        where s.id = p_subcategory_id), '')), 'C')
      || setweight(to_tsvector('public.logos_french', coalesce(p_description, '')), 'D');
$$;

/* Reconstruction des vecteurs existants, sans toucher aux horodatages. */
alter table public.resources disable trigger resources_touch_updated_at;

update public.resources r
   set search_vector = public.build_resource_search_vector(
         r.title, r.description, r.category_id, r.subcategory_id, r.id);

alter table public.resources enable trigger resources_touch_updated_at;
