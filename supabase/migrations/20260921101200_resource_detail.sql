-- =============================================================================
-- Fiche ressource et téléchargement.
--
-- Deux fonctions, aux surfaces volontairement disjointes :
--
--   get_published_resource  → PUBLIC. Ce que la fiche affiche, et rien de plus.
--   get_published_file      → SERVEUR UNIQUEMENT. Le chemin de stockage, qui
--                             ne doit jamais atteindre un rôle client.
--
-- Dans les deux cas, la règle « seulement PUBLISHED » vit EN BASE : une route
-- applicative ne peut pas l'oublier, et un appel direct à l'API ne peut pas la
-- contourner.
-- =============================================================================

create function public.get_published_resource(p_id uuid)
returns table (
  id               uuid,
  title            text,
  description      text,
  category_slug    text,
  category_name    text,
  subcategory_slug text,
  subcategory_name text,
  resource_type    public.resource_type,
  /* `text[]` et non `public.audience[]` : un tableau de type énuméré n'a pas
     d'OID stable et sa sérialisation dépend du client. Un `text[]` est un type
     standard, rendu de la même façon partout. Les valeurs restent celles de
     l'énumération, et le typage applicatif les contraint. */
  audiences        text[],
  format           public.file_format,
  page_count       integer,
  slide_count      integer,
  flags            text[],
  published_at     timestamptz
)
language sql
stable
set search_path = public
as $$
  select r.id,
         r.title,
         r.description,
         c.slug,
         c.name,
         s.slug,
         s.name,
         r.resource_type,
         r.audiences::text[],
         f.format,
         f.page_count,
         f.slide_count,
         coalesce(
           (select array_agg(pf.flag order by pf.sort_order, pf.flag)
              from public.published_resource_flags pf
             where pf.resource_id = r.id),
           '{}'::text[]
         ),
         r.published_at
    from public.published_resources r
    join public.categories c on c.id = r.category_id
    left join public.subcategories s on s.id = r.subcategory_id
    left join public.published_resource_files f on f.resource_id = r.id
   where r.id = p_id;
$$;

comment on function public.get_published_resource is
  'Détail public d''une ressource publiée. Posée sur les vues publiques : n''expose ni dépositaire, ni statut, ni chemin de stockage.';

grant execute on function public.get_published_resource(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Téléchargement.
--
-- Renvoie le chemin de stockage UNIQUEMENT pour une ressource publiée. Une
-- ressource PENDING, REJECTED ou ARCHIVED ne renvoie aucune ligne — l'archivage
-- rend donc le téléchargement immédiatement impossible.
--
-- SECURITY DEFINER pour lire `public.files`, qui n'est accessible ni au rôle
-- anonyme ni au dépositaire d'une autre ressource.
--
-- ⚠️ Cette fonction n'est accordée QU'À `service_role` : elle est appelée par
-- la route serveur de téléchargement, jamais par un client. L'accorder à `anon`
-- exposerait `storage_path`.
-- -----------------------------------------------------------------------------

create function public.get_published_file(p_id uuid)
returns table (
  storage_path text,
  filename     text,
  mime_type    text
)
language sql
stable
security definer
set search_path = public
as $$
  select f.storage_path, f.filename, f.mime_type
    from public.files f
    join public.resources r on r.id = f.resource_id
   where f.resource_id = p_id
     and r.status = 'PUBLISHED';
$$;

comment on function public.get_published_file is
  'Chemin de stockage d''une ressource PUBLIÉE. Réservée au rôle serveur : ne jamais accorder à anon.';

revoke execute on function public.get_published_file(uuid) from public;
grant execute on function public.get_published_file(uuid) to service_role;
