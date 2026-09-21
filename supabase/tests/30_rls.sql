-- Tests de sécurité NÉGATIFS : ce que chaque rôle ne doit jamais pouvoir faire.

do $$
declare
  v_a uuid := t.new_member('alice-rls@example.test', 'SERVANT');
  v_b uuid := t.new_member('bob-rls@example.test',   'SERVANT');
  v_admin uuid := t.new_member('admin-rls@example.test', 'ADMIN');
  v_pub uuid;
  v_pending uuid;
begin
  v_pub := t.new_resource(v_a, 'Ressource publiée');
  perform t.add_flags(v_pub);
  perform t.add_file(v_pub);
  update public.resources set status = 'PENDING'   where id = v_pub;
  update public.resources set status = 'PUBLISHED' where id = v_pub;

  v_pending := t.new_resource(v_a, 'Ressource en attente');
  perform t.add_flags(v_pending);
  perform t.add_file(v_pending);
  update public.resources set status = 'PENDING' where id = v_pending;

  perform set_config('t.alice',   v_a::text,     false);
  perform set_config('t.bob',     v_b::text,     false);
  perform set_config('t.admin',   v_admin::text, false);
  perform set_config('t.pub',     v_pub::text,   false);
  perform set_config('t.pending', v_pending::text, false);
end;
$$;

-- ── Rôle anonyme ─────────────────────────────────────────────────────────────

begin;
set local role anon;

do $$
declare v_n int;
begin
  -- Aucun accès aux tables applicatives.
  begin
    perform 1 from public.resources limit 1;
    raise exception 'Le rôle anonyme ne doit avoir aucun accès à public.resources.';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.files limit 1;
    raise exception 'Le rôle anonyme ne doit avoir aucun accès à public.files.';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.users limit 1;
    raise exception 'Le rôle anonyme ne doit avoir aucun accès à public.users.';
  exception when insufficient_privilege then null;
  end;

  -- La surface publique ne montre que les ressources publiées.
  select count(*) into v_n from public.published_resources;
  if v_n <> 1 then
    raise exception 'La surface publique doit exposer la seule ressource publiée (vu %).', v_n;
  end if;

  select count(*) into v_n from public.published_resource_files;
  if v_n <> 1 then
    raise exception 'Les métadonnées de fichier publiques sont incorrectes (vu %).', v_n;
  end if;

  -- La taxonomie reste lisible.
  select count(*) into v_n from public.categories;
  if v_n <> 9 then
    raise exception 'La taxonomie doit rester lisible par le public.';
  end if;
end;
$$;
rollback;

-- Aucune colonne sensible dans la surface publique.
do $$
declare v_leak text;
begin
  select string_agg(table_name || '.' || column_name, ', ') into v_leak
    from information_schema.columns
   where table_schema = 'public'
     and table_name like 'published\_%'
     and column_name in ('depositor_id', 'admin_comment', 'status',
                         'storage_path', 'filename', 'email');
  if v_leak is not null then
    raise exception 'Colonne sensible exposée publiquement : %', v_leak;
  end if;
end;
$$;

-- ── Serviteur ────────────────────────────────────────────────────────────────

begin;
set local role authenticated;
set local app.user_id = '00000000-0000-0000-0000-000000000000';

do $$
declare v_n int;
begin
  perform set_config('app.user_id', current_setting('t.bob'), true);

  -- Bob ne voit pas les ressources d'Alice non publiées.
  select count(*) into v_n
    from public.resources where id = current_setting('t.pending')::uuid;
  if v_n <> 0 then
    raise exception 'Un serviteur ne doit pas voir les ressources d''un autre.';
  end if;

  -- Ni ses flags, ni son fichier.
  select count(*) into v_n
    from public.resource_flags where resource_id = current_setting('t.pending')::uuid;
  if v_n <> 0 then
    raise exception 'Un serviteur ne doit pas voir les flags d''un autre.';
  end if;

  select count(*) into v_n
    from public.files where resource_id = current_setting('t.pending')::uuid;
  if v_n <> 0 then
    raise exception 'Un serviteur ne doit pas voir le fichier d''un autre.';
  end if;

  -- Ni l'identité d'un autre compte.
  select count(*) into v_n
    from public.users where id = current_setting('t.alice')::uuid;
  if v_n <> 0 then
    raise exception 'Un serviteur ne doit pas voir le profil d''un autre.';
  end if;
end;
$$;
rollback;

begin;
set local role authenticated;

do $$
declare v_rows int;
begin
  perform set_config('app.user_id', current_setting('t.alice'), true);

  /* La RLS ne lève pas : elle rend la ligne invisible à l'écriture. Le
     contrôle porte donc sur l'EFFET — zéro ligne touchée — et non sur une
     exception. */

  -- Alice ne publie pas, même sur sa propre ressource.
  update public.resources set status = 'PUBLISHED'
   where id = current_setting('t.pending')::uuid;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Un serviteur ne doit jamais pouvoir publier.';
  end if;

  -- Ni archiver.
  update public.resources set status = 'ARCHIVED'
   where id = current_setting('t.pub')::uuid;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Un serviteur ne doit jamais pouvoir archiver.';
  end if;

  -- Ni modifier une ressource déjà publiée.
  update public.resources set title = 'Titre détourné'
   where id = current_setting('t.pub')::uuid;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Une ressource publiée est en consultation seule côté serviteur.';
  end if;

  -- Ni s'élever au rang d'administrateur.
  update public.users set role = 'ADMIN' where id = current_setting('t.alice')::uuid;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Un serviteur ne doit jamais pouvoir changer son rôle.';
  end if;

  -- Déposer au nom d'un autre viole le WITH CHECK : là, la base lève.
  begin
    insert into public.resources
      (title, description, category_id, resource_type, audiences, depositor_id)
    values ('Usurpation', 'D', 6, 'DOCUMENT', array['ADULTES']::public.audience[],
            current_setting('t.bob')::uuid);
    raise exception 'Un serviteur ne doit pas pouvoir déposer au nom d''un autre.';
  exception when insufficient_privilege then null;
  end;

  -- Aucun privilège DELETE sur les ressources : le cahier des charges prévoit
  -- l'archivage, pas la suppression.
  begin
    delete from public.resources where id = current_setting('t.pending')::uuid;
    raise exception 'La suppression d''une ressource ne doit pas être possible.';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;

-- ── Administration — contrôle positif ────────────────────────────────────────
-- Les policies ci-dessus doivent restreindre, pas tout interdire.

begin;
set local role authenticated;

do $$
declare v_n int;
begin
  perform set_config('app.user_id', current_setting('t.admin'), true);

  -- L'administration voit toutes les ressources, tous statuts confondus.
  select count(*) into v_n from public.resources;
  if v_n < 2 then
    raise exception 'L''administration doit voir toutes les ressources (vu %).', v_n;
  end if;

  -- Et l'identité du dépositaire.
  select count(*) into v_n
    from public.users where id = current_setting('t.alice')::uuid;
  if v_n <> 1 then
    raise exception 'L''administration doit voir l''identité des dépositaires.';
  end if;

  -- Et le fichier.
  select count(*) into v_n
    from public.files where resource_id = current_setting('t.pending')::uuid;
  if v_n <> 1 then
    raise exception 'L''administration doit voir les fichiers.';
  end if;

  -- Et peut corriger les flags pendant la modération.
  insert into public.resource_flags (resource_id, flag, sort_order)
  values (current_setting('t.pending')::uuid, 'flag-ajoute-par-admin', 99);

  -- Et peut publier.
  update public.resources set status = 'PUBLISHED'
   where id = current_setting('t.pending')::uuid;
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'L''administration doit pouvoir publier.';
  end if;
end;
$$;
rollback;

-- La ressource en attente existe toujours : aucune suppression n'a eu lieu.
do $$
begin
  if not exists (select 1 from public.resources where id = current_setting('t.pending')::uuid) then
    raise exception 'La ressource ne devait pas être supprimée.';
  end if;
end;
$$;

\echo '  ✓ sécurité'
