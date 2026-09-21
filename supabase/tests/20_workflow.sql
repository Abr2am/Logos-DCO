-- Workflow de publication : la matrice de transitions est appliquée en base.

create schema if not exists t;

create or replace function t.new_member(p_email text, p_role public.user_role)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into auth.users (email) values (p_email) returning id into v_id;
  update public.users set role = p_role where id = v_id;
  return v_id;
end $$;

create or replace function t.new_resource(p_depositor uuid, p_title text)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.resources
    (title, description, category_id, resource_type, audiences, depositor_id)
  values (p_title, 'Description de test.', 6, 'COURS_PRESENTATION',
          array['ADOLESCENTS']::public.audience[], p_depositor)
  returning id into v_id;
  return v_id;
end $$;

create or replace function t.add_flags(p_resource uuid, p_count int default 5)
returns void language plpgsql as $$
begin
  insert into public.resource_flags (resource_id, flag, sort_order)
  select p_resource, 'flag-' || i, i from generate_series(1, p_count) i;
end $$;

create or replace function t.add_file(p_resource uuid)
returns void language plpgsql as $$
begin
  insert into public.files
    (resource_id, storage_path, filename, format, mime_type, size_bytes, page_count)
  values (p_resource, p_resource || '/fichier.pdf', 'fichier.pdf',
          'PDF', 'application/pdf', 1024, 32);
end $$;

do $$
declare
  v_servant uuid := t.new_member('servant-wf@example.test', 'SERVANT');
  v_res uuid;
begin
  -- Création : jamais directement publiée.
  begin
    insert into public.resources
      (title, description, category_id, resource_type, audiences, depositor_id, status)
    values ('X', 'D', 6, 'DOCUMENT', array['ADULTES']::public.audience[], v_servant, 'PUBLISHED');
    raise exception 'Une ressource ne doit pas pouvoir naître PUBLISHED.';
  exception when insufficient_privilege then null;
  end;

  v_res := t.new_resource(v_servant, 'Ressource de test');

  -- Soumission refusée sans les cinq flags.
  begin
    update public.resources set status = 'PENDING' where id = v_res;
    raise exception 'La soumission doit exiger cinq flags.';
  exception when check_violation then null;
  end;

  -- Soumission refusée sans fichier.
  perform t.add_flags(v_res, 5);
  begin
    update public.resources set status = 'PENDING' where id = v_res;
    raise exception 'La soumission doit exiger un fichier.';
  exception when check_violation then null;
  end;

  perform t.add_file(v_res);
  update public.resources set status = 'PENDING' where id = v_res;

  if (select submitted_at from public.resources where id = v_res) is null then
    raise exception 'submitted_at doit être renseigné à la soumission.';
  end if;

  -- Retirer un flag sous le seuil est refusé hors DRAFT.
  begin
    delete from public.resource_flags
     where resource_id = v_res and flag = 'flag-1';
    raise exception 'Descendre sous cinq flags doit être refusé hors DRAFT.';
  exception when check_violation then null;
  end;

  -- Demande de correction : commentaire obligatoire.
  begin
    update public.resources set status = 'REJECTED' where id = v_res;
    raise exception 'Une demande de correction exige un commentaire.';
  exception when check_violation then null;
  end;

  update public.resources
     set status = 'REJECTED', admin_comment = 'Préciser la tranche d''âge.'
   where id = v_res;

  -- Resoumission, puis publication, puis archivage.
  update public.resources set status = 'PENDING' where id = v_res;

  if (select admin_comment from public.resources where id = v_res) is not null then
    raise exception 'Le commentaire doit être effacé à la resoumission.';
  end if;

  update public.resources set status = 'PUBLISHED' where id = v_res;
  if (select published_at from public.resources where id = v_res) is null then
    raise exception 'published_at doit être renseigné à la publication.';
  end if;

  -- Transitions interdites.
  begin
    update public.resources set status = 'PENDING' where id = v_res;
    raise exception 'PUBLISHED → PENDING doit être interdit.';
  exception when insufficient_privilege then null;
  end;

  update public.resources set status = 'ARCHIVED' where id = v_res;
  if (select archived_at from public.resources where id = v_res) is null then
    raise exception 'archived_at doit être renseigné à l''archivage.';
  end if;

  begin
    update public.resources set status = 'PUBLISHED' where id = v_res;
    raise exception 'ARCHIVED → PUBLISHED doit être interdit.';
  exception when insufficient_privilege then null;
  end;

  -- Le dépositaire d'origine ne change jamais.
  begin
    update public.resources
       set depositor_id = t.new_member('autre-wf@example.test', 'SERVANT')
     where id = v_res;
    raise exception 'Le dépositaire ne doit pas pouvoir être modifié.';
  exception when insufficient_privilege then null;
  end;
end;
$$;

\echo '  ✓ workflow'
