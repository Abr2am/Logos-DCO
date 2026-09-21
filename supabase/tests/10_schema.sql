-- Cohérence du schéma et de la taxonomie.

do $$
declare
  v_expected text[] := array[
    'Bible', 'Dogme', 'Histoire de l''Église', 'Rites & Liturgie',
    'Spiritualité', 'Saints', 'Vie chrétienne', 'Formation des serviteurs',
    'Divers'
  ];
  v_actual text[];
begin
  select array_agg(name order by sort_order) into v_actual from public.categories;

  if v_actual is distinct from v_expected then
    raise exception 'Taxonomie incorrecte : %', v_actual;
  end if;

  if (select count(*) from public.categories) <> 9 then
    raise exception 'Il doit exister exactement neuf catégories.';
  end if;
end;
$$;

do $$
begin
  -- Les sous-catégories n'existent que sous « Vie chrétienne ».
  if exists (
    select 1 from public.subcategories s
      join public.categories c on c.id = s.category_id
     where c.slug <> 'vie-chretienne'
  ) then
    raise exception 'Une sous-catégorie est rattachée à une autre catégorie que « Vie chrétienne ».';
  end if;

  if (select count(*) from public.subcategories) <> 3 then
    raise exception 'Il doit exister exactement trois sous-catégories.';
  end if;
end;
$$;

-- Énumérations : valeurs exactes du cahier des charges.
do $$
declare
  v text[];
begin
  select array_agg(e.enumlabel order by e.enumsortorder) into v
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'resource_status';
  if v <> array['DRAFT','PENDING','PUBLISHED','REJECTED','ARCHIVED'] then
    raise exception 'Statuts incorrects : %', v;
  end if;

  select array_agg(e.enumlabel order by e.enumsortorder) into v
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'audience';
  if cardinality(v) <> 8 then
    raise exception 'Il doit exister exactement huit publics : %', v;
  end if;

  select array_agg(e.enumlabel order by e.enumsortorder) into v
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'resource_type';
  if cardinality(v) <> 7 then
    raise exception 'Il doit exister exactement sept types : %', v;
  end if;

  select array_agg(e.enumlabel order by e.enumsortorder) into v
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'file_format';
  if v <> array['PDF','DOC','DOCX','PPT','PPTX','XLS','XLSX'] then
    raise exception 'Formats incorrects : %', v;
  end if;
end;
$$;

-- RLS active sur toutes les tables applicatives, sans exception.
do $$
declare
  v text;
begin
  select string_agg(c.relname, ', ') into v
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if v is not null then
    raise exception 'RLS absente sur : %', v;
  end if;
end;
$$;

-- Aucune policy de suppression de ressource, et aucune écriture sur la taxonomie.
do $$
begin
  if exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'resources'
       and cmd = 'DELETE'
  ) then
    raise exception 'Une policy DELETE existe sur resources : le cahier des charges prévoit l''archivage.';
  end if;

  if exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename in ('categories', 'subcategories')
       and cmd <> 'SELECT'
  ) then
    raise exception 'La taxonomie ne doit être modifiable par personne.';
  end if;
end;
$$;

-- Index de recherche et index de branche présents.
do $$
begin
  if not exists (select 1 from pg_indexes where indexname = 'resources_search_vector_idx') then
    raise exception 'Index GIN de recherche manquant.';
  end if;
  if not exists (select 1 from pg_indexes where indexname = 'resources_branch_idx') then
    raise exception 'Index de branche manquant.';
  end if;
end;
$$;

-- La clé étrangère composite interdit une sous-catégorie d'une autre catégorie.
do $$
declare
  v_user uuid;
begin
  insert into auth.users (email) values ('schema-test@example.test') returning id into v_user;

  begin
    insert into public.resources
      (title, description, category_id, subcategory_id, resource_type, audiences, depositor_id)
    values ('T', 'D', 6, 1, 'DOCUMENT', array['ADULTES']::public.audience[], v_user);
    raise exception 'La sous-catégorie « Jeunesse » ne devrait pas être acceptée sous « Saints ».';
  exception
    when foreign_key_violation then null;
  end;
end;
$$;

\echo '  ✓ schéma'
