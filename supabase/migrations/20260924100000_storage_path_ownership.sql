-- =============================================================================
-- Un chemin de stockage ne peut être revendiqué que par son propriétaire.
--
-- Depuis l'upload direct (24/09/2026), le fichier ne transite plus par le
-- serveur applicatif : le navigateur dépose l'objet dans Storage, puis le
-- serveur revendique ce CHEMIN pour créer la ressource.
--
-- Tant que le chemin était forgé par le serveur, rien ne pouvait mentir.
-- Désormais il fait l'aller-retour par le client : `submit_resource` et
-- `replace_resource_file` doivent donc refuser tout chemin qui ne commence pas
-- par l'identifiant de l'appelant.
--
-- Sans cette garde, un serviteur pourrait revendiquer l'objet d'un AUTRE
-- serviteur — la policy Storage l'empêche d'écrire hors de son préfixe, mais
-- pas de citer le préfixe d'autrui dans un appel RPC.
--
-- ⚠️ Ces fonctions restent SECURITY INVOKER : la RLS s'applique par-dessus.
-- La règle ci-dessous ne remplace aucune policy, elle en ferme le dernier
-- angle mort.
-- =============================================================================

/* Le chemin appartient-il au demandeur ? Miroir exact de `isOwnedBy`
   (`lib/files/storage-path.ts`) : préfixe `<uid>/`, un nom non vide, aucune
   traversée. */
create function public.owns_storage_path(p_path text)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_path is not null
     and auth.uid() is not null
     and p_path like auth.uid()::text || '/%'
     and length(p_path) > length(auth.uid()::text) + 1
     and position('..' in p_path) = 0
     and position('//' in p_path) = 0;
$$;

create or replace function public.submit_resource(
  p_title          text,
  p_description    text,
  p_category_id    smallint,
  p_subcategory_id smallint,
  p_resource_type  text,
  p_audiences      text[],
  p_flags          text[],
  p_storage_path   text,
  p_filename       text,
  p_format         text,
  p_mime_type      text,
  p_size_bytes     bigint,
  p_page_count     integer default null,
  p_slide_count    integer default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
  i    integer;
begin
  if not public.owns_storage_path(p_storage_path) then
    raise exception 'storage_path n''appartient pas au dépositaire'
      using errcode = '42501';
  end if;

  insert into public.resources
    (title, description, category_id, subcategory_id, resource_type,
     audiences, depositor_id, status)
  values (p_title, p_description, p_category_id, p_subcategory_id,
          p_resource_type::public.resource_type,
          p_audiences::public.audience[], auth.uid(), 'DRAFT')
  returning id into v_id;

  for i in 1 .. cardinality(p_flags) loop
    insert into public.resource_flags (resource_id, flag, sort_order)
    values (v_id, p_flags[i], i)
    on conflict (resource_id, flag) do nothing;
  end loop;

  insert into public.files
    (resource_id, storage_path, filename, format, mime_type, size_bytes,
     page_count, slide_count)
  values (v_id, p_storage_path, p_filename, p_format::public.file_format,
          p_mime_type, p_size_bytes, p_page_count, p_slide_count);

  update public.resources set status = 'PENDING' where id = v_id;

  return v_id;
end;
$$;

/* Même garde au remplacement. L'administration écrit sous son propre préfixe :
   elle n'est pas exemptée, elle n'en a pas besoin. */
create or replace function public.replace_resource_file(
  p_id           uuid,
  p_storage_path text,
  p_filename     text,
  p_format       text,
  p_mime_type    text,
  p_size_bytes   bigint,
  p_page_count   integer default null,
  p_slide_count  integer default null
)
returns void
language plpgsql
set search_path = public
as $$
begin
  if not public.owns_storage_path(p_storage_path) then
    raise exception 'storage_path n''appartient pas au dépositaire'
      using errcode = '42501';
  end if;

  delete from public.files where resource_id = p_id;

  insert into public.files
    (resource_id, storage_path, filename, format, mime_type, size_bytes,
     page_count, slide_count)
  values (p_id, p_storage_path, p_filename, p_format::public.file_format,
          p_mime_type, p_size_bytes, p_page_count, p_slide_count);
end;
$$;

grant execute on function public.owns_storage_path(text) to authenticated;
