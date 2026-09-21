-- =============================================================================
-- Contribution et modération.
--
-- Toutes les mutations passent par des fonctions SECURITY INVOKER : la RLS et
-- les déclencheurs de workflow de l'étape 3 s'appliquent intégralement. Ces
-- fonctions ne contournent rien — elles rendent les opérations atomiques et
-- vérifiables, sans déplacer une seule règle depuis la base vers
-- l'application.
--
-- Les paramètres d'énumération sont des `text` castés à l'intérieur : un
-- tableau de type énuméré n'a pas d'OID stable et sa sérialisation dépend du
-- client.
-- =============================================================================

-- ═══════════════════════════════════════════════════════ LECTURES ═══════════

/** Contributions du serviteur connecté. La RLS ne lui montre que les siennes. */
create function public.my_contributions()
returns table (
  id            uuid,
  title         text,
  category_name text,
  resource_type public.resource_type,
  status        public.resource_status,
  admin_comment text,
  submitted_at  timestamptz,
  created_at    timestamptz
)
language sql
stable
set search_path = public
as $$
  select r.id, r.title, c.name, r.resource_type, r.status,
         r.admin_comment, r.submitted_at, r.created_at
    from public.resources r
    join public.categories c on c.id = r.category_id
   where r.depositor_id = auth.uid()
   order by coalesce(r.submitted_at, r.created_at) desc, r.id;
$$;

/** Détail d'une ressource en vue de sa correction par son dépositaire. */
create function public.editable_resource(p_id uuid)
returns table (
  id             uuid,
  title          text,
  description    text,
  category_id    smallint,
  subcategory_id smallint,
  resource_type  public.resource_type,
  audiences      text[],
  flags          text[],
  status         public.resource_status,
  admin_comment  text,
  filename       text,
  format         public.file_format,
  page_count     integer,
  slide_count    integer
)
language sql
stable
set search_path = public
as $$
  select r.id, r.title, r.description, r.category_id, r.subcategory_id,
         r.resource_type, r.audiences::text[],
         coalesce((select array_agg(f.flag order by f.sort_order, f.flag)
                     from public.resource_flags f where f.resource_id = r.id),
                  '{}'::text[]),
         r.status, r.admin_comment, fi.filename, fi.format,
         fi.page_count, fi.slide_count
    from public.resources r
    left join public.files fi on fi.resource_id = r.id
   where r.id = p_id
     and r.depositor_id = auth.uid()
     and r.status in ('DRAFT', 'REJECTED');
$$;

/** Compteurs du tableau de bord. Administration uniquement. */
create function public.admin_counters()
returns table (
  pending   bigint,
  published bigint,
  rejected  bigint,
  archived  bigint
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
    select count(*) filter (where status = 'PENDING'),
           count(*) filter (where status = 'PUBLISHED'),
           count(*) filter (where status = 'REJECTED'),
           count(*) filter (where status = 'ARCHIVED')
      from public.resources;
end;
$$;

/** File de modération. Administration uniquement. */
create function public.admin_queue(p_status text default null)
returns table (
  id              uuid,
  title           text,
  category_name   text,
  status          public.resource_status,
  depositor_email text,
  submitted_at    timestamptz,
  created_at      timestamptz
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
    select r.id, r.title, c.name, r.status, u.email,
           r.submitted_at, r.created_at
      from public.resources r
      join public.categories c on c.id = r.category_id
      join public.users u on u.id = r.depositor_id
     where p_status is null or r.status = p_status::public.resource_status
     order by coalesce(r.submitted_at, r.created_at) desc, r.id;
end;
$$;

/**
 * Vue de modération complète — y compris l'identité et l'e-mail du
 * dépositaire, qui ne sont JAMAIS publics.
 */
create function public.admin_resource(p_id uuid)
returns table (
  id               uuid,
  title            text,
  description      text,
  category_id      smallint,
  category_name    text,
  subcategory_id   smallint,
  subcategory_name text,
  resource_type    public.resource_type,
  audiences        text[],
  flags            text[],
  status           public.resource_status,
  admin_comment    text,
  depositor_email  text,
  depositor_name   text,
  filename         text,
  format           public.file_format,
  page_count       integer,
  slide_count      integer,
  submitted_at     timestamptz,
  published_at     timestamptz
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
    select r.id, r.title, r.description, r.category_id, c.name,
           r.subcategory_id, s.name, r.resource_type, r.audiences::text[],
           coalesce((select array_agg(f.flag order by f.sort_order, f.flag)
                       from public.resource_flags f where f.resource_id = r.id),
                    '{}'::text[]),
           r.status, r.admin_comment, u.email, u.display_name,
           fi.filename, fi.format, fi.page_count, fi.slide_count,
           r.submitted_at, r.published_at
      from public.resources r
      join public.categories c on c.id = r.category_id
      left join public.subcategories s on s.id = r.subcategory_id
      join public.users u on u.id = r.depositor_id
      left join public.files fi on fi.resource_id = r.id
     where r.id = p_id;
end;
$$;

-- ═══════════════════════════════════════════════════════ MUTATIONS ══════════

/**
 * Dépôt d'une ressource, en une transaction.
 *
 * La ressource naît DRAFT, reçoit ses flags et son fichier, puis passe en
 * PENDING — la seule transition que le déclencheur autorise à un serviteur.
 * C'est lui, et non cette fonction, qui exige les cinq flags et le fichier.
 */
create function public.submit_resource(
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

/**
 * Correction d'une ressource par son dépositaire, ou modification par
 * l'administration. La RLS décide qui peut écrire quoi ; le statut n'est pas
 * touché ici.
 *
 * Les flags sont réécrits par insertion PUIS suppression : l'ordre importe,
 * car le déclencheur interdit de descendre sous cinq flags hors DRAFT.
 */
create function public.update_resource(
  p_id             uuid,
  p_title          text,
  p_description    text,
  p_category_id    smallint,
  p_subcategory_id smallint,
  p_resource_type  text,
  p_audiences      text[],
  p_flags          text[]
)
returns void
language plpgsql
set search_path = public
as $$
declare
  i integer;
begin
  for i in 1 .. cardinality(p_flags) loop
    insert into public.resource_flags (resource_id, flag, sort_order)
    values (p_id, p_flags[i], i)
    on conflict (resource_id, flag) do update set sort_order = excluded.sort_order;
  end loop;

  delete from public.resource_flags
   where resource_id = p_id and flag <> all (p_flags);

  update public.resources
     set title = p_title,
         description = p_description,
         category_id = p_category_id,
         subcategory_id = p_subcategory_id,
         resource_type = p_resource_type::public.resource_type,
         audiences = p_audiences::public.audience[]
   where id = p_id;

  if not found then
    raise exception 'Ressource introuvable ou non modifiable.'
      using errcode = '42501';
  end if;
end;
$$;

/** Remplace le fichier d'une ressource. */
create function public.replace_resource_file(
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
  delete from public.files where resource_id = p_id;

  insert into public.files
    (resource_id, storage_path, filename, format, mime_type, size_bytes,
     page_count, slide_count)
  values (p_id, p_storage_path, p_filename, p_format::public.file_format,
          p_mime_type, p_size_bytes, p_page_count, p_slide_count);
end;
$$;

/* Transitions. Chacune n'est qu'un UPDATE : la matrice du déclencheur décide
   si elle est permise, et pour qui. */

create function public.resubmit_resource(p_id uuid)
returns void language sql set search_path = public as $$
  update public.resources set status = 'PENDING'
   where id = p_id and status = 'REJECTED';
$$;

create function public.publish_resource(p_id uuid)
returns void language sql set search_path = public as $$
  update public.resources set status = 'PUBLISHED'
   where id = p_id and status = 'PENDING';
$$;

create function public.request_changes(p_id uuid, p_comment text)
returns void language sql set search_path = public as $$
  update public.resources set status = 'REJECTED', admin_comment = p_comment
   where id = p_id and status = 'PENDING';
$$;

create function public.archive_resource(p_id uuid)
returns void language sql set search_path = public as $$
  update public.resources set status = 'ARCHIVED'
   where id = p_id and status = 'PUBLISHED';
$$;

-- ═══════════════════════════════════════════════════════ PRIVILÈGES ═════════
-- Rien pour `anon` : la contribution et la modération exigent un compte.

grant execute on function public.my_contributions() to authenticated;
grant execute on function public.editable_resource(uuid) to authenticated;
grant execute on function public.admin_counters() to authenticated;
grant execute on function public.admin_queue(text) to authenticated;
grant execute on function public.admin_resource(uuid) to authenticated;
grant execute on function public.submit_resource(
  text, text, smallint, smallint, text, text[], text[], text, text, text,
  text, bigint, integer, integer) to authenticated;
grant execute on function public.update_resource(
  uuid, text, text, smallint, smallint, text, text[], text[]) to authenticated;
grant execute on function public.replace_resource_file(
  uuid, text, text, text, text, bigint, integer, integer) to authenticated;
grant execute on function public.resubmit_resource(uuid) to authenticated;
grant execute on function public.publish_resource(uuid) to authenticated;
grant execute on function public.request_changes(uuid, text) to authenticated;
grant execute on function public.archive_resource(uuid) to authenticated;
