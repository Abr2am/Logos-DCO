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

-- ── Limitation de débit : les trois plafonds ────────────────────────────────
--
-- Ces bornes sont la SEULE garde anti-spam qui résiste à un appel direct de
-- l'API : le leurre et le jeton horodaté vivent dans l'application, et la clé
-- anonyme est publique. On les éprouve donc sous le rôle `anon`, exactement
-- comme le ferait un robot qui ignore le formulaire.

begin;

-- Treize ressources publiées fraîches : douze pour remplir, une pour la
-- question de trop.
do $$
declare
  v_alice uuid := current_setting('t.q_alice')::uuid;
  v_ids   text := '';
  v_r     uuid;
  i       int;
begin
  for i in 1 .. 13 loop
    v_r := t.new_resource(v_alice, 'Ressource de débit ' || i);
    perform t.add_flags(v_r);
    perform t.add_file(v_r);
    update public.resources set status = 'PENDING'   where id = v_r;
    update public.resources set status = 'PUBLISHED' where id = v_r;
    v_ids := v_ids || case when i = 1 then '' else ',' end || v_r::text;
  end loop;
  perform set_config('t.q_rate', v_ids, true);
end;
$$;

set local role anon;

do $$
declare
  v_ids uuid[] := string_to_array(current_setting('t.q_rate'), ',')::uuid[];
  i     int;
begin
  -- a. Dix questions passent sur une même ressource ; la onzième est refusée.
  for i in 1 .. 10 loop
    perform public.ask_question(v_ids[1], 'visiteur-' || i || '@example.test',
      'Une question parfaitement légitime, numéro ' || i || '.');
  end loop;

  begin
    perform public.ask_question(v_ids[1], 'visiteur-onze@example.test',
      'La onzième question de l''heure sur cette même ressource.');
    raise exception 'La onzième question sur une ressource doit être refusée.';
  exception when program_limit_exceeded then null;
  end;

  -- b. La limite est PAR ressource : une autre fiche accepte toujours.
  perform public.ask_question(v_ids[2], 'visiteur-douze@example.test',
    'Une question sur une autre ressource, qui doit passer.');

  -- c. Cinq questions depuis une même adresse, réparties sur cinq fiches ;
  --    la sixième est refusée — la casse et les espaces n'y changent rien.
  for i in 3 .. 7 loop
    perform public.ask_question(v_ids[i], 'repete@example.test',
      'Une question de plus depuis la même adresse, numéro ' || i || '.');
  end loop;

  begin
    perform public.ask_question(v_ids[8], '  REPETE@Example.TEST  ',
      'La sixième question de la journée depuis cette adresse.');
    raise exception 'La sixième question d''une même adresse doit être refusée.';
  exception when program_limit_exceeded then null;
  end;

end;
$$;

/* Le remplissage exige de COMPTER, ce que le rôle anonyme ne peut pas faire —
   c'est précisément l'invariant n° 7. On reprend donc la main pour amener la
   fenêtre à cent questions, puis on rend la parole à `anon` pour la question
   de trop. */
reset role;

do $$
declare
  v_ids   uuid[] := string_to_array(current_setting('t.q_rate'), ',')::uuid[];
  v_total int;
  v_used  int;
  v_res   int := 2;
  v_k     int := 0;
begin
  select count(*) into v_total
    from public.questions where created_at > now() - interval '1 hour';

  while v_total < 100 loop
    select count(*) into v_used
      from public.questions
     where resource_id = v_ids[v_res]
       and created_at > now() - interval '1 hour';

    if v_used >= 10 then
      v_res := v_res + 1;
      if v_res > 12 then
        raise exception 'Le banc manque de ressources pour atteindre le plafond global.';
      end if;
      continue;
    end if;

    v_k := v_k + 1;
    perform public.ask_question(v_ids[v_res],
      'flot-' || (v_k / 5) || '@example.test',
      'Question de remplissage numéro ' || v_k || '.');
    v_total := v_total + 1;
  end loop;
end;
$$;

-- d. Le filet global : cent questions dans l'heure, et plus rien ne passe,
--    sur aucune ressource — y compris une fiche restée vierge.
set local role anon;

do $$
declare v_ids uuid[] := string_to_array(current_setting('t.q_rate'), ',')::uuid[];
begin
  begin
    perform public.ask_question(v_ids[13], 'ultime@example.test',
      'La question de trop, toutes ressources confondues.');
    raise exception 'Au-delà de cent questions dans l''heure, tout doit être refusé.';
  exception when program_limit_exceeded then null;
  end;
end;
$$;
rollback;

-- Le plafond ne laisse aucune trace : la transaction annulée, une question
-- passe de nouveau.
begin;
set local role anon;
do $$
begin
  perform public.ask_question(current_setting('t.q_pub')::uuid,
    'apres-le-plafond@example.test',
    'Une question posée une fois la fenêtre revenue à la normale.');
end;
$$;
rollback;

\echo '  ✓ questions'
