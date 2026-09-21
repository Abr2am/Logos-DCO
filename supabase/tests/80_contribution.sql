-- Contribution et modération, sous les rôles réels.

do $$
begin
  perform set_config('t.c_alice', t.new_member('c-alice@example.test', 'SERVANT')::text, false);
  perform set_config('t.c_bob',   t.new_member('c-bob@example.test',   'SERVANT')::text, false);
  perform set_config('t.c_admin', t.new_member('c-admin@example.test', 'ADMIN')::text, false);
end;
$$;

/* Le schéma d'aide doit être atteignable depuis le rôle `authenticated`,
   sous lequel les scénarios s'exécutent. */
grant usage on schema t to authenticated;

create or replace function t.submit_as(p_user uuid, p_title text, p_flags text[])
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  perform set_config('app.user_id', p_user::text, true);
  v_id := public.submit_resource(
    p_title, 'Description de test.', 6::smallint, null::smallint,
    'COURS_PRESENTATION', array['ADOLESCENTS'], p_flags,
    p_user || '/' || gen_random_uuid() || '.pdf', 'cours.pdf',
    'PDF', 'application/pdf', 4096, 32, null);
  return v_id;
end $$;

grant execute on all functions in schema t to authenticated;

-- ── 1. Dépôt valide → PENDING ────────────────────────────────────────────────
begin;
set local role authenticated;
do $$
declare v_id uuid; v_status public.resource_status; v_n int;
begin
  v_id := t.submit_as(current_setting('t.c_alice')::uuid, 'Dépôt valide',
                      array['Un','Deux','Trois','Quatre','Cinq']);
  select status into v_status from public.resources where id = v_id;
  if v_status <> 'PENDING' then
    raise exception 'Un dépôt valide doit aboutir en PENDING (vu %).', v_status;
  end if;

  select count(*) into v_n from public.resource_flags where resource_id = v_id;
  if v_n <> 5 then raise exception 'Cinq flags attendus (vu %).', v_n; end if;

  select count(*) into v_n from public.files where resource_id = v_id;
  if v_n <> 1 then raise exception 'Un fichier attendu (vu %).', v_n; end if;

  -- Le dépositaire est celui qui dépose, jamais un identifiant fourni.
  if (select depositor_id from public.resources where id = v_id)
     <> current_setting('t.c_alice')::uuid then
    raise exception 'Le dépositaire doit être l''utilisateur connecté.';
  end if;
end;
$$;
commit;

-- ── 2. Moins de cinq flags → refus ───────────────────────────────────────────
begin;
set local role authenticated;
do $$
begin
  begin
    perform t.submit_as(current_setting('t.c_alice')::uuid, 'Trop peu de flags',
                        array['Un','Deux','Trois','Quatre']);
    raise exception 'Un dépôt à quatre flags doit être refusé.';
  exception when check_violation then null;
  end;
end;
$$;
rollback;

-- ── 3. Fichier de type interdit → refus ──────────────────────────────────────
do $$
declare v_id uuid;
begin
  v_id := t.new_resource(current_setting('t.c_alice')::uuid, 'Fichier interdit');
  begin
    insert into public.files (resource_id, storage_path, filename, format,
      mime_type, size_bytes)
    values (v_id, v_id || '/x.zip', 'x.zip', 'PDF', 'application/zip', 10);
    raise exception 'Un type MIME hors liste blanche doit être refusé.';
  exception when check_violation then null;
  end;

  begin
    insert into public.files (resource_id, storage_path, filename, format,
      mime_type, size_bytes)
    values (v_id, v_id || '/x.pdf', 'x.pdf', 'PDF', 'application/pdf', 0);
    raise exception 'Une taille nulle doit être refusée.';
  exception when check_violation then null;
  end;
end;
$$;

-- ── 5. Un serviteur ne voit que ses contributions ────────────────────────────
begin;
set local role authenticated;
do $$
declare v_n int;
begin
  perform set_config('app.user_id', current_setting('t.c_bob'), true);
  select count(*) into v_n from public.my_contributions();
  if v_n <> 0 then
    raise exception 'Bob ne doit voir aucune contribution (vu %).', v_n;
  end if;

  perform set_config('app.user_id', current_setting('t.c_alice'), true);
  select count(*) into v_n from public.my_contributions();
  if v_n < 1 then
    raise exception 'Alice doit voir ses contributions (vu %).', v_n;
  end if;
end;
$$;
rollback;

-- ── 6. Un serviteur ne publie ni n'archive ───────────────────────────────────
begin;
set local role authenticated;
do $$
declare v_id uuid; v_status public.resource_status;
begin
  perform set_config('app.user_id', current_setting('t.c_alice'), true);
  select id into v_id from public.resources
   where depositor_id = current_setting('t.c_alice')::uuid
     and status = 'PENDING' limit 1;

  perform public.publish_resource(v_id);
  select status into v_status from public.resources where id = v_id;
  if v_status <> 'PENDING' then
    raise exception 'Un serviteur ne doit jamais publier (statut %).', v_status;
  end if;

  perform public.request_changes(v_id, 'auto-correction');
  select status into v_status from public.resources where id = v_id;
  if v_status <> 'PENDING' then
    raise exception 'Un serviteur ne doit pas demander de correction (statut %).', v_status;
  end if;

  -- Ni modifier la ressource d'un autre.
  perform set_config('app.user_id', current_setting('t.c_bob'), true);
  begin
    perform public.update_resource(v_id, 'Détournée', 'x', 6::smallint, null::smallint,
                                   'DOCUMENT', array['ADULTES'],
                                   array['A','B','C','D','E']);
    raise exception 'Bob ne doit pas pouvoir modifier la ressource d''Alice.';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;

-- ── 11. Avant publication, le fichier n'est pas délivrable ───────────────────
do $$
declare v_id uuid; v_n int;
begin
  select id into v_id from public.resources
   where depositor_id = current_setting('t.c_alice')::uuid
     and status = 'PENDING' limit 1;
  perform set_config('t.c_res', v_id::text, false);

  select count(*) into v_n from public.get_published_file(v_id);
  if v_n <> 0 then
    raise exception 'Le fichier d''une ressource PENDING ne doit pas être délivrable.';
  end if;
end;
$$;

-- ── 8. Correction : commentaire obligatoire, puis 4. resoumission ────────────
begin;
set local role authenticated;
do $$
declare v_id uuid := current_setting('t.c_res')::uuid; v_status public.resource_status;
begin
  perform set_config('app.user_id', current_setting('t.c_admin'), true);

  begin
    perform public.request_changes(v_id, '   ');
    raise exception 'Un commentaire vide doit être refusé.';
  exception when check_violation then null;
  end;

  perform public.request_changes(v_id, 'Préciser la tranche d''âge visée.');
  select status into v_status from public.resources where id = v_id;
  if v_status <> 'REJECTED' then
    raise exception 'La demande de correction doit aboutir à REJECTED (vu %).', v_status;
  end if;
end;
$$;
commit;

begin;
set local role authenticated;
do $$
declare v_id uuid := current_setting('t.c_res')::uuid; r record;
begin
  perform set_config('app.user_id', current_setting('t.c_alice'), true);

  -- Le commentaire est visible du dépositaire.
  select * into r from public.my_contributions() where id = v_id;
  if r.admin_comment is null then
    raise exception 'Le commentaire de l''administrateur doit être affiché.';
  end if;

  -- La ressource devient modifiable, et les flags peuvent être réécrits.
  perform public.update_resource(v_id, 'Titre corrigé', 'Description corrigée.',
    6::smallint, null::smallint, 'FICHE_PEDAGOGIQUE', array['ENFANTS'],
    array['Alpha','Beta','Gamma','Delta','Epsilon']);

  if (select count(*) from public.resource_flags where resource_id = v_id) <> 5 then
    raise exception 'Les flags doivent avoir été remplacés.';
  end if;

  -- La correction laisse la ressource en REJECTED tant qu'elle n'est pas
  -- resoumise : « Modifier » et « Resoumettre » sont deux actions distinctes.
  if (select status from public.resources where id = v_id) <> 'REJECTED' then
    raise exception 'La correction ne doit pas changer le statut.';
  end if;

  perform public.resubmit_resource(v_id);
  if (select status from public.resources where id = v_id) <> 'PENDING' then
    raise exception 'La resoumission doit ramener en PENDING.';
  end if;
end;
$$;
commit;

-- ── 7. Publication · 12. téléchargement · 9. archivage · 10. interdits ───────
begin;
set local role authenticated;
do $$
declare v_id uuid := current_setting('t.c_res')::uuid; v_n int;
begin
  perform set_config('app.user_id', current_setting('t.c_admin'), true);

  perform public.publish_resource(v_id);
  if (select status from public.resources where id = v_id) <> 'PUBLISHED' then
    raise exception 'L''administration doit pouvoir publier.';
  end if;
end;
$$;
commit;

do $$
declare v_id uuid := current_setting('t.c_res')::uuid; v_n int;
begin
  -- 12. Publiée : la fiche et le fichier deviennent accessibles.
  select count(*) into v_n from public.get_published_resource(v_id);
  if v_n <> 1 then raise exception 'La fiche publique doit exister après publication.'; end if;

  select count(*) into v_n from public.get_published_file(v_id);
  if v_n <> 1 then raise exception 'Le téléchargement doit être possible après publication.'; end if;
end;
$$;

begin;
set local role authenticated;
do $$
declare v_id uuid := current_setting('t.c_res')::uuid;
begin
  perform set_config('app.user_id', current_setting('t.c_alice'), true);

  -- Une ressource publiée est en consultation seule côté serviteur.
  begin
    perform public.update_resource(v_id, 'Détournée', 'x', 6::smallint, null::smallint,
                                   'DOCUMENT', array['ADULTES'],
                                   array['A','B','C','D','E']);
    raise exception 'Une ressource publiée ne doit pas être modifiable par le serviteur.';
  exception when insufficient_privilege then null;
  end;

  -- 10. Transitions interdites.
  perform set_config('app.user_id', current_setting('t.c_admin'), true);
  begin
    update public.resources set status = 'DRAFT' where id = v_id;
    raise exception 'PUBLISHED → DRAFT doit être interdit.';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;

begin;
set local role authenticated;
do $$
declare v_id uuid := current_setting('t.c_res')::uuid; v_n int;
begin
  perform set_config('app.user_id', current_setting('t.c_admin'), true);

  -- 9. Archivage.
  perform public.archive_resource(v_id);
  if (select status from public.resources where id = v_id) <> 'ARCHIVED' then
    raise exception 'L''administration doit pouvoir archiver.';
  end if;
end;
$$;
commit;

do $$
declare v_id uuid := current_setting('t.c_res')::uuid; v_n int;
begin
  select count(*) into v_n from public.get_published_file(v_id);
  if v_n <> 0 then
    raise exception 'L''archivage doit rendre le téléchargement impossible.';
  end if;
end;
$$;

-- ── Tableau de bord : réservé à l'administration ─────────────────────────────
begin;
set local role authenticated;
do $$
declare r record;
begin
  perform set_config('app.user_id', current_setting('t.c_alice'), true);
  begin
    perform public.admin_counters();
    raise exception 'Un serviteur ne doit pas atteindre les compteurs.';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.admin_queue();
    raise exception 'Un serviteur ne doit pas atteindre la file de modération.';
  exception when insufficient_privilege then null;
  end;

  perform set_config('app.user_id', current_setting('t.c_admin'), true);
  select * into r from public.admin_counters();
  if r.archived < 1 then
    raise exception 'Les compteurs doivent refléter les statuts (archivées : %).', r.archived;
  end if;

  -- L'identité du dépositaire n'est visible que de l'administration.
  select * into r from public.admin_resource(current_setting('t.c_res')::uuid);
  if r.depositor_email <> 'c-alice@example.test' then
    raise exception 'L''administration doit voir le dépositaire (vu %).', r.depositor_email;
  end if;
end;
$$;
rollback;

\echo '  ✓ contribution et modération'
