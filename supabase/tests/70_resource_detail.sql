-- Fiche ressource et téléchargement : ce qui est public, ce qui ne l'est pas.

do $$
declare
  v_dep uuid := t.new_member('detail@example.test', 'SERVANT');
  v_pub uuid;
  v_pending uuid;
  v_archived uuid;
begin
  -- Publiée, avec sous-catégorie et flags.
  insert into public.resources
    (title, description, category_id, subcategory_id, resource_type, audiences, depositor_id)
  values ('Fiche publiée', 'Description de la fiche.', 7, 3, 'FICHE_PEDAGOGIQUE',
          array['FAMILLES', 'ADULTES']::public.audience[], v_dep)
  returning id into v_pub;
  insert into public.resource_flags (resource_id, flag, sort_order)
  values (v_pub, 'Zèle', 3), (v_pub, 'Famille', 1), (v_pub, 'Accueil', 2),
         (v_pub, 'Partage', 4), (v_pub, 'Écoute', 5);
  perform t.add_file(v_pub);
  update public.resources set status = 'PENDING'   where id = v_pub;
  update public.resources set status = 'PUBLISHED' where id = v_pub;

  -- En attente.
  v_pending := t.new_resource(v_dep, 'Fiche en attente');
  perform t.add_flags(v_pending);
  perform t.add_file(v_pending);
  update public.resources set status = 'PENDING' where id = v_pending;

  -- Archivée : elle a été publiée, puis retirée.
  v_archived := t.new_resource(v_dep, 'Fiche archivée');
  perform t.add_flags(v_archived);
  perform t.add_file(v_archived);
  update public.resources set status = 'PENDING'   where id = v_archived;
  update public.resources set status = 'PUBLISHED' where id = v_archived;
  update public.resources set status = 'ARCHIVED'  where id = v_archived;

  perform set_config('t.d_pub', v_pub::text, false);
  perform set_config('t.d_pending', v_pending::text, false);
  perform set_config('t.d_archived', v_archived::text, false);
end;
$$;

-- Le détail public expose exactement ce que la fiche affiche.
do $$
declare r record;
begin
  select * into r
    from public.get_published_resource(current_setting('t.d_pub')::uuid);

  if r.id is null then
    raise exception 'La ressource publiée doit être consultable.';
  end if;
  if r.title <> 'Fiche publiée' or r.description <> 'Description de la fiche.' then
    raise exception 'Titre ou description incorrects.';
  end if;
  if r.category_slug <> 'vie-chretienne' or r.subcategory_slug <> 'famille' then
    raise exception 'Emplacement incorrect : % / %', r.category_slug, r.subcategory_slug;
  end if;
  if r.audiences <> array['FAMILLES', 'ADULTES'] then
    raise exception 'Publics incorrects : %', r.audiences;
  end if;
  if r.format <> 'PDF' or r.page_count <> 32 then
    raise exception 'Format ou pagination incorrects.';
  end if;
  -- Les flags remontent dans l'ordre de saisie.
  if r.flags <> array['Famille', 'Accueil', 'Zèle', 'Partage', 'Écoute'] then
    raise exception 'Flags incorrects : %', r.flags;
  end if;
end;
$$;

-- Une ressource non publiée est introuvable, comme une ressource inexistante.
do $$
declare v_n int;
begin
  select count(*) into v_n
    from public.get_published_resource(current_setting('t.d_pending')::uuid);
  if v_n <> 0 then
    raise exception 'Une ressource en attente ne doit pas être consultable.';
  end if;

  select count(*) into v_n
    from public.get_published_resource(current_setting('t.d_archived')::uuid);
  if v_n <> 0 then
    raise exception 'Une ressource archivée ne doit plus être consultable.';
  end if;

  select count(*) into v_n
    from public.get_published_resource('00000000-0000-0000-0000-000000000000');
  if v_n <> 0 then
    raise exception 'Une ressource inexistante ne doit rien renvoyer.';
  end if;
end;
$$;

-- Le chemin de stockage n'est délivré que pour une ressource publiée.
do $$
declare v_n int; v_path text;
begin
  select storage_path into v_path
    from public.get_published_file(current_setting('t.d_pub')::uuid);
  if v_path is null then
    raise exception 'Le fichier d''une ressource publiée doit être délivrable.';
  end if;

  select count(*) into v_n
    from public.get_published_file(current_setting('t.d_pending')::uuid);
  if v_n <> 0 then
    raise exception 'Le fichier d''une ressource en attente ne doit jamais être délivré.';
  end if;

  select count(*) into v_n
    from public.get_published_file(current_setting('t.d_archived')::uuid);
  if v_n <> 0 then
    raise exception 'L''archivage doit rendre le téléchargement impossible.';
  end if;
end;
$$;

-- ── Sous le rôle anonyme ─────────────────────────────────────────────────────

begin;
set local role anon;

do $$
declare v_n int;
begin
  -- La fiche publique est lisible.
  select count(*) into v_n
    from public.get_published_resource(current_setting('t.d_pub')::uuid);
  if v_n <> 1 then
    raise exception 'Le public doit pouvoir consulter une fiche publiée (vu %).', v_n;
  end if;

  -- Le chemin de stockage, lui, est hors d'atteinte.
  begin
    perform public.get_published_file(current_setting('t.d_pub')::uuid);
    raise exception 'Le rôle anonyme ne doit jamais atteindre get_published_file.';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;

-- Aucune colonne sensible dans la signature de la fonction publique.
do $$
declare v_cols text;
begin
  select string_agg(p.proargnames[i], ', ') into v_cols
    from pg_proc p,
         lateral generate_subscripts(p.proargnames, 1) i
   where p.proname = 'get_published_resource'
     and p.proargnames[i] in ('depositor_id', 'status', 'storage_path',
                              'filename', 'admin_comment');
  if v_cols is not null then
    raise exception 'Colonne sensible exposée par la fiche publique : %', v_cols;
  end if;
end;
$$;

\echo '  ✓ fiche ressource'
