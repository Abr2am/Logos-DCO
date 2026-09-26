-- =============================================================================
-- Recherche textuelle — PostgreSQL seul.
--
-- Porte sur : titre · description · catégorie · sous-catégorie · flags.
-- Aucune recherche dans le contenu des fichiers, aucune recherche sémantique,
-- aucun moteur vectoriel, aucun Elasticsearch.
--
-- Le vecteur agrège des données de PLUSIEURS tables (catégorie, flags) : une
-- colonne strictement générée ne le permet pas, elle est donc maintenue par
-- déclencheur. Le volume attendu (quelques centaines de ressources) rend
-- cette approche plus simple qu'une vue matérialisée.
--
-- ⚠️ POINT OUVERT « Q » — l'insensibilité aux accents n'est PAS tranchée.
-- La configuration `french` retenue ici ne retire pas les accents :
-- « eglise » ne trouve pas « Église ». L'activer suppose l'extension
-- `unaccent` et une configuration de recherche dédiée ; ce sera une migration
-- ultérieure, une fois la décision prise. Rien ici ne la préempte.
-- =============================================================================

create function public.build_resource_search_vector(
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
  select setweight(to_tsvector('french', coalesce(p_title, '')), 'A')
      || setweight(
           to_tsvector('french', coalesce(
             (select string_agg(f.flag, ' ')
                from public.resource_flags f
               where f.resource_id = p_resource_id), '')), 'B')
      || setweight(
           to_tsvector('french',
             coalesce((select c.name from public.categories c
                        where c.id = p_category_id), '')
             || ' ' ||
             coalesce((select s.name from public.subcategories s
                        where s.id = p_subcategory_id), '')), 'C')
      || setweight(to_tsvector('french', coalesce(p_description, '')), 'D');
$$;

/* Sur `resources` : déclencheur BEFORE, pour écrire la colonne sans
   réécriture de la ligne et sans récursion. */
create function public.resources_set_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := public.build_resource_search_vector(
    new.title, new.description, new.category_id, new.subcategory_id, new.id
  );
  return new;
end;
$$;

create trigger resources_search_vector
  before insert or update of title, description, category_id, subcategory_id
  on public.resources
  for each row execute function public.resources_set_search_vector();

/* Sur `resource_flags` : déclencheur AFTER, qui rafraîchit la ressource
   parente. La mise à jour ne touche que `search_vector`, donc le déclencheur
   ci-dessus — restreint à une liste de colonnes — ne se redéclenche pas. */
create function public.resource_flags_refresh_search_vector()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resource_id uuid := coalesce(new.resource_id, old.resource_id);
begin
  update public.resources r
     set search_vector = public.build_resource_search_vector(
           r.title, r.description, r.category_id, r.subcategory_id, r.id)
   where r.id = v_resource_id;
  return null;
end;
$$;

create trigger resource_flags_refresh_search_vector
  after insert or update or delete on public.resource_flags
  for each row execute function public.resource_flags_refresh_search_vector();

create index resources_search_vector_idx
  on public.resources using gin (search_vector);
