-- Questions : qui peut écrire, qui peut lire, et surtout qui ne peut pas.
--
-- Le point sensible est `questioner_email`. Le MVP l'expose volontairement au
-- dépositaire de la ressource — c'est son seul canal de réponse. Il ne doit
-- l'être à personne d'autre : ni au rôle anonyme, ni à un autre serviteur.

do $$
declare
  v_alice   uuid := t.new_member('alice-q@example.test', 'SERVANT');
  v_bob     uuid := t.new_member('bob-q@example.test',   'SERVANT');
  v_admin   uuid := t.new_member('admin-q@example.test', 'ADMIN');
  v_pub     uuid;
  v_pending uuid;
  v_arch    uuid;
begin
  v_pub := t.new_resource(v_alice, 'Ressource publiée d''Alice');
  perform t.add_flags(v_pub);
  perform t.add_file(v_pub);
  update public.resources set status = 'PENDING'   where id = v_pub;
  update public.resources set status = 'PUBLISHED' where id = v_pub;

  v_pending := t.new_resource(v_alice, 'Ressource en attente d''Alice');
  perform t.add_flags(v_pending);
  perform t.add_file(v_pending);
  update public.resources set status = 'PENDING' where id = v_pending;

  v_arch := t.new_resource(v_alice, 'Ressource archivée d''Alice');
  perform t.add_flags(v_arch);
  perform t.add_file(v_arch);
  update public.resources set status = 'PENDING'   where id = v_arch;
  update public.resources set status = 'PUBLISHED' where id = v_arch;
  update public.resources set status = 'ARCHIVED'  where id = v_arch;

  perform set_config('t.q_alice',   v_alice::text,   false);
  perform set_config('t.q_bob',     v_bob::text,     false);
  perform set_config('t.q_admin',   v_admin::text,   false);
  perform set_config('t.q_pub',     v_pub::text,     false);
  perform set_config('t.q_pending', v_pending::text, false);
  perform set_config('t.q_arch',    v_arch::text,    false);
end;
$$;

-- ── La surface publique reste fermée ─────────────────────────────────────────
-- Les questions n'entrent ni dans une table ni dans une vue lisible par le
-- rôle anonyme. Cette assertion vaut pour tout ce qui serait ajouté plus tard.

do $$
declare v_leak text;
begin
  if has_table_privilege('anon', 'public.questions', 'select') then
    raise exception 'Le rôle anonyme ne doit avoir aucun SELECT sur public.questions.';
  end if;

  select string_agg(table_name, ', ') into v_leak
    from information_schema.table_privileges
   where grantee = 'anon'
     and table_schema = 'public'
     and privilege_type = 'SELECT'
     and table_name not in ('categories', 'subcategories',
                            'published_resources', 'published_resource_flags',
                            'published_resource_files');
  if v_leak is not null then
    raise exception 'La surface publique est fermée : % n''a rien à y faire.', v_leak;
  end if;
end;
$$;

-- ── Rôle anonyme : il pose une question, sans compte ─────────────────────────

begin;
set local role anon;

do $$
begin
  perform public.ask_question(
    current_setting('t.q_pub')::uuid,
    '  Visiteur@Example.TEST  ',
    '  La quatrième séance suppose-t-elle une lecture préalable ?  ');
end;
$$;
commit;

-- ── Rôle anonyme : tout le reste lui est refusé ──────────────────────────────

begin;
set local role anon;

do $$
begin
  -- Une ressource non publiée n'accepte aucune question, et ne se distingue
  -- pas d'une ressource inexistante.
  begin
    perform public.ask_question(current_setting('t.q_pending')::uuid,
      'visiteur@example.test', 'Une question sur une ressource en attente.');
    raise exception 'Une ressource PENDING ne doit accepter aucune question.';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.ask_question(current_setting('t.q_arch')::uuid,
      'visiteur@example.test', 'Une question sur une ressource archivée.');
    raise exception 'Une ressource ARCHIVED ne doit accepter aucune question.';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.ask_question(gen_random_uuid(),
      'visiteur@example.test', 'Une question sur une ressource inexistante.');
    raise exception 'Une ressource inexistante ne doit accepter aucune question.';
  exception when insufficient_privilege then null;
  end;

  -- Aucune lecture : `questioner_email` est hors de portée du rôle anonyme.
  begin
    perform 1 from public.questions limit 1;
    raise exception 'Le rôle anonyme ne doit avoir aucun accès à public.questions.';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.my_questions();
    raise exception 'Le rôle anonyme ne doit pas atteindre my_questions().';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.mark_question_answered(gen_random_uuid());
    raise exception 'Le rôle anonyme ne doit pas atteindre mark_question_answered().';
  exception when insufficient_privilege then null;
  end;

  -- Contraintes de forme.
  begin
    perform public.ask_question(current_setting('t.q_pub')::uuid,
      'pas-une-adresse', 'Une question parfaitement valide, elle.');
    raise exception 'Une adresse mal formée doit être refusée.';
  exception when check_violation then null;
  end;

  begin
    perform public.ask_question(current_setting('t.q_pub')::uuid,
      'visiteur@example.test', '   court   ');
    raise exception 'Une question trop courte doit être refusée.';
  exception when check_violation then null;
  end;

  begin
    perform public.ask_question(current_setting('t.q_pub')::uuid,
      'visiteur@example.test', repeat('a', 1001));
    raise exception 'Une question trop longue doit être refusée.';
  exception when check_violation then null;
  end;
end;
$$;
rollback;

-- ── Serviteurs : chacun ne voit que les questions de ses ressources ──────────

begin;
set local role authenticated;

do $$
declare
  v_q  record;
  v_n  int;
  v_id uuid;
begin
  -- Bob, qui n'a déposé aucune ressource, ne voit rien.
  perform set_config('app.user_id', current_setting('t.q_bob'), true);

  select count(*) into v_n from public.my_questions();
  if v_n <> 0 then
    raise exception 'Un serviteur ne doit voir que ses propres questions (vu %).', v_n;
  end if;

  select count(*) into v_n from public.questions;
  if v_n <> 0 then
    raise exception 'La RLS doit masquer à Bob les questions d''Alice (vu %).', v_n;
  end if;

  -- Alice, dépositaire, voit la question ET l'adresse — c'est son seul canal.
  perform set_config('app.user_id', current_setting('t.q_alice'), true);

  select * into v_q from public.my_questions();
  if v_q.questioner_email <> 'visiteur@example.test' then
    raise exception 'Le dépositaire doit voir l''adresse normalisée (vu %).',
      v_q.questioner_email;
  end if;
  if v_q.question_text <> 'La quatrième séance suppose-t-elle une lecture préalable ?' then
    raise exception 'Le texte de la question doit être conservé, détouré (vu %).',
      v_q.question_text;
  end if;
  if v_q.status <> 'PENDING' or v_q.answered_at is not null then
    raise exception 'Une question naît en attente de réponse (vu %).', v_q.status;
  end if;
  if v_q.resource_title <> 'Ressource publiée d''Alice' then
    raise exception 'La question doit porter le titre de sa ressource (vu %).',
      v_q.resource_title;
  end if;

  v_id := v_q.id;

  -- Bob ne peut pas clore une question qui n'est pas la sienne.
  perform set_config('app.user_id', current_setting('t.q_bob'), true);
  begin
    perform public.mark_question_answered(v_id);
    raise exception 'Bob ne doit pas pouvoir clore une question d''Alice.';
  exception when insufficient_privilege then null;
  end;

  -- Alice elle-même ne peut pas en réécrire le contenu.
  perform set_config('app.user_id', current_setting('t.q_alice'), true);
  begin
    update public.questions set question_text = 'Texte réécrit par le dépositaire.'
     where id = v_id;
    raise exception 'Le texte d''une question ne doit pas être modifiable.';
  exception when check_violation then null;
  end;

  begin
    update public.questions set questioner_email = 'autre@example.test'
     where id = v_id;
    raise exception 'L''adresse d''une question ne doit pas être modifiable.';
  exception when check_violation then null;
  end;

  -- Personne ne supprime une question — pas même son dépositaire.
  begin
    delete from public.questions where id = v_id;
    raise exception 'Aucun rôle client ne doit pouvoir supprimer une question.';
  exception when insufficient_privilege then null;
  end;

  -- Alice clôt sa question : PENDING → ANSWERED, et rien d'autre.
  perform public.mark_question_answered(v_id);

  select * into v_q from public.my_questions();
  if v_q.status <> 'ANSWERED' or v_q.answered_at is null then
    raise exception 'La question doit passer en « Répondue » et être horodatée.';
  end if;

  begin
    update public.questions set status = 'PENDING' where id = v_id;
    raise exception 'Une question répondue ne doit pas revenir en attente.';
  exception when check_violation then null;
  end;

  begin
    perform public.mark_question_answered(v_id);
    raise exception 'Une question déjà répondue ne doit pas être clôturée deux fois.';
  exception when insufficient_privilege then null;
  end;

  -- L'administration voit tout.
  perform set_config('app.user_id', current_setting('t.q_admin'), true);
  select count(*) into v_n from public.questions;
  if v_n <> 1 then
    raise exception 'L''administration doit voir toutes les questions (vu %).', v_n;
  end if;
end;
$$;
rollback;

\echo '  ✓ questions'
