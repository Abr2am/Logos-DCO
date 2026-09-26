-- =============================================================================
-- Téléchargement par l'administration.
--
-- La modération se faisait jusqu'ici sur les seules métadonnées : l'écran
-- `/admin/ressources/[id]` montrait le nom du fichier, jamais son contenu.
-- Or on ne publie pas une ressource sans l'avoir ouverte.
--
-- `get_published_file` ne peut pas servir : elle filtre `status = 'PUBLISHED'`,
-- et ce filtre est la garde du téléchargement PUBLIC — l'élargir ouvrirait le
-- fichier d'une ressource en attente à n'importe quel visiteur. Cette
-- fonction-ci est son exacte contrepartie interne : aucun filtre de statut,
-- mais une garde de rôle.
--
-- ⚠️ SECURITY INVOKER, volontairement : la RLS de `public.files` s'applique
-- par-dessus (`files_select_admin`), et la policy Storage
-- `resources_objects_select_own` revérifiera `is_admin()` au moment de signer
-- l'URL. La garde ci-dessous n'est que la première des trois.
--
-- Le chemin de stockage sort donc de la base pour l'administration — mais
-- UNIQUEMENT vers du code serveur. Il n'entre dans aucune vue publique, et
-- `admin_resource`, qui alimente le HTML de l'écran de modération, continue de
-- ne pas le renvoyer.
-- =============================================================================

create function public.admin_resource_file(p_id uuid)
returns table (
  storage_path text,
  filename     text,
  mime_type    text
)
language plpgsql
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''administration.' using errcode = '42501';
  end if;

  return query
    select f.storage_path, f.filename, f.mime_type
      from public.files f
     where f.resource_id = p_id;
end;
$$;

comment on function public.admin_resource_file is
  'Chemin de stockage d''une ressource, TOUS STATUTS, pour l''administration seule. Appelée par la route serveur de téléchargement administrateur ; ne jamais rendre son résultat dans une page.';

/* `execute` est accordé à PUBLIC par défaut : on le retire, comme pour
   `get_published_file`. Toute fonction qui porte un chemin de stockage est
   nominativement accordée, jamais ouverte par omission. */
revoke execute on function public.admin_resource_file(uuid) from public;
grant execute on function public.admin_resource_file(uuid) to authenticated;
