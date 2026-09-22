-- =============================================================================
-- Questions — MVP.
--
-- Workflow arrêté pour le MVP (décision produit du 22/09/2026) :
--
--   visiteur (sans compte) → pose une question depuis une ressource PUBLIÉE
--                          → la question est stockée dans Logos
--   serviteur              → retrouve SES questions dans « Mes questions »
--                          → voit l'adresse e-mail du visiteur
--                          → répond depuis SA PROPRE messagerie (mailto:)
--                          → passe la question au statut « Répondue »
--
-- Ce que ce MVP n'a PAS, volontairement : aucun service d'envoi d'e-mail,
-- aucune notification automatique, aucune messagerie interne, aucun lien
-- signé, aucun fil de discussion, aucune réponse stockée en base.
--
-- ⚠️ DETTE TECHNIQUE ASSUMÉE — ANONYMAT PARTIEL.
-- Le cahier des charges (§12) pose « anonymat entre utilisateurs ». Ici,
-- l'adresse du questionneur est visible par le dépositaire de la ressource,
-- parce que c'est le seul canal de réponse possible sans service d'envoi.
-- L'inverse reste vrai : le questionneur n'apprend RIEN du dépositaire, et le
-- public n'a aucun accès aux questions. À reprendre le jour où un service
-- d'e-mail entre dans la pile (point ouvert M).
-- =============================================================================

/* Deux statuts, et deux seulement — tranche le point ouvert « L ». */
create type public.question_status as enum ('PENDING', 'ANSWERED');

create table public.questions (
  id               uuid primary key default gen_random_uuid(),
  resource_id      uuid not null references public.resources (id) on delete cascade,
  questioner_email text not null,
  question_text    text not null,
  status           public.question_status not null default 'PENDING',
  created_at       timestamptz not null default now(),
  answered_at      timestamptz,

  /* Contrôle de forme, pas de validité : seul un envoi prouve qu'une adresse
     existe, et ce MVP n'en envoie aucun. */
  constraint questions_email_shape check (
    questioner_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and length(questioner_email) <= 254
  ),
  constraint questions_text_length check (
    char_length(btrim(question_text)) between 10 and 1000
  ),
  /* `answered_at` est renseigné si et seulement si la question est répondue. */
  constraint questions_answered_at check (
    (status = 'ANSWERED') = (answered_at is not null)
  )
);

comment on table public.questions is
  'Questions posées sur une ressource publiée. La réponse est envoyée hors application, par la messagerie du dépositaire.';
comment on column public.questions.questioner_email is
  'Visible par le dépositaire de la ressource et par l''administration. JAMAIS par le rôle anonyme.';

create index questions_resource_idx on public.questions (resource_id);
create index questions_open_idx on public.questions (status, created_at desc);

-- -----------------------------------------------------------------------------
-- Déclencheur de workflow.
--
-- Une question ne se modifie pas : seul son statut évolue, et dans un seul
-- sens. La règle vit en base, pas dans l'interface.
-- -----------------------------------------------------------------------------

create function public.enforce_question_workflow()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    /* Une question naît toujours en attente, quoi qu'ait envoyé l'appelant. */
    new.status           := 'PENDING';
    new.answered_at      := null;
    new.created_at       := now();
    new.questioner_email := lower(btrim(new.questioner_email));
    new.question_text    := btrim(new.question_text);
    return new;
  end if;

  if new.id is distinct from old.id
     or new.resource_id is distinct from old.resource_id
     or new.questioner_email is distinct from old.questioner_email
     or new.question_text is distinct from old.question_text
     or new.created_at is distinct from old.created_at then
    raise exception 'Une question ne se modifie pas : seul son statut évolue.'
      using errcode = '23514';
  end if;

  if new.status is distinct from old.status then
    if not (old.status = 'PENDING' and new.status = 'ANSWERED') then
      raise exception 'Transition de question interdite : % → %.',
        old.status, new.status using errcode = '23514';
    end if;
    new.answered_at := now();
  end if;

  return new;
end;
$$;

create trigger questions_workflow
  before insert or update on public.questions
  for each row execute function public.enforce_question_workflow();

-- -----------------------------------------------------------------------------
-- Une question ne peut viser qu'une ressource PUBLIÉE.
--
-- SECURITY DEFINER : le rôle anonyme n'a aucun accès à `public.resources`, il
-- ne peut donc pas évaluer cette condition lui-même. La fonction ne révèle
-- rien de plus que `get_published_resource`, qui est déjà publique — une
-- ressource ARCHIVÉE y est indistinguable d'une ressource inexistante.
-- -----------------------------------------------------------------------------

create function public.is_published_resource(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.resources
     where id = p_id and status = 'PUBLISHED'
  );
$$;

revoke execute on function public.is_published_resource(uuid) from public;
grant execute on function public.is_published_resource(uuid) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════ RLS ═════
--
-- Le rôle anonyme peut ÉCRIRE une question, et rien d'autre : aucun SELECT,
-- donc aucune lecture de `questioner_email`, ni de la sienne ni d'une autre.
-- Les questions ne figurent dans AUCUNE vue publique.

alter table public.questions enable row level security;
revoke all on public.questions from anon, authenticated;

grant insert on public.questions to anon, authenticated;

create policy questions_insert_public on public.questions
  for insert to anon, authenticated
  with check (public.is_published_resource(resource_id));

grant select, update on public.questions to authenticated;

/* Le dépositaire voit les questions posées sur SES ressources. */
create policy questions_select_depositor on public.questions
  for select to authenticated
  using (exists (
    select 1 from public.resources r
     where r.id = questions.resource_id
       and r.depositor_id = auth.uid()
  ));

create policy questions_select_admin on public.questions
  for select to authenticated
  using (public.is_admin());

/* Le seul changement possible est le passage en « Répondue ». Le déclencheur
   borne la transition ; la policy borne qui peut la tenter. */
create policy questions_update_depositor on public.questions
  for update to authenticated
  using (exists (
    select 1 from public.resources r
     where r.id = questions.resource_id
       and r.depositor_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.resources r
     where r.id = questions.resource_id
       and r.depositor_id = auth.uid()
  ));

create policy questions_update_admin on public.questions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

/* Aucune policy DELETE, pour personne — comme pour les ressources. */

-- ══════════════════════════════════════════════════════════════════ API ══════

/**
 * Dépôt d'une question par un visiteur, avec ou sans compte.
 *
 * SECURITY INVOKER : la policy d'insertion s'applique intégralement. Ne
 * retourne rien — le rôle anonyme n'a aucun droit de lecture sur la table.
 */
create function public.ask_question(
  p_resource_id uuid,
  p_email       text,
  p_question    text
)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.questions (resource_id, questioner_email, question_text)
  values (p_resource_id, p_email, p_question);
exception
  when insufficient_privilege then
    /* Ressource inexistante, en attente, à corriger ou archivée : un seul et
       même message, pour ne rien laisser deviner. */
    raise exception 'Ressource introuvable.' using errcode = '42501';
end;
$$;

grant execute on function public.ask_question(uuid, text, text) to anon, authenticated;

/**
 * Questions reçues par le serviteur connecté. La RLS ne lui montre que celles
 * posées sur ses propres ressources.
 *
 * Les questions en attente d'abord, puis les plus récentes.
 */
create function public.my_questions()
returns table (
  id               uuid,
  resource_id      uuid,
  resource_title   text,
  questioner_email text,
  question_text    text,
  status           public.question_status,
  created_at       timestamptz,
  answered_at      timestamptz
)
language sql
stable
set search_path = public
as $$
  select q.id, q.resource_id, r.title, q.questioner_email, q.question_text,
         q.status, q.created_at, q.answered_at
    from public.questions q
    join public.resources r on r.id = q.resource_id
   where r.depositor_id = auth.uid()
   order by (q.status = 'ANSWERED'), q.created_at desc, q.id;
$$;

grant execute on function public.my_questions() to authenticated;

/** Passage en « Répondue », une fois la réponse envoyée par messagerie. */
create function public.mark_question_answered(p_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.questions
     set status = 'ANSWERED'
   where id = p_id and status = 'PENDING';

  if not found then
    raise exception 'Question introuvable ou déjà répondue.'
      using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.mark_question_answered(uuid) to authenticated;
