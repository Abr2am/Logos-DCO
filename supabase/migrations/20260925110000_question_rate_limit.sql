-- =============================================================================
-- Limitation de débit des questions — point ouvert « R », tranché le
-- 25/09/2026.
--
-- Le formulaire est public et sans compte. Deux pièges applicatifs — leurre et
-- jeton horodaté — écartent les robots qui passent par la PAGE, mais ils ne
-- protègent rien à eux seuls : la clé anonyme est publique par nature, et un
-- appel direct à `rpc/ask_question` ne les verrait jamais.
--
-- La borne vit donc ICI, dans un déclencheur, et s'applique quel que soit le
-- chemin d'appel.
--
--   · 10 questions par heure et par RESSOURCE — l'acharnement sur une fiche ;
--   ·  5 questions par 24 h et par ADRESSE     — le robot à adresse fixe ;
--   · 100 questions par heure, toutes ressources — le filet global.
--
-- Ces plafonds ne stockent aucune donnée nouvelle : tout se compte dans
-- `public.questions`, qui porte déjà l'adresse et l'horodatage. Aucune table,
-- aucune colonne, aucune policy, aucun `grant` ne changent.
--
-- ⚠️ SECURITY DEFINER : le rôle anonyme n'a aucun SELECT sur `questions` et
-- ne peut donc pas compter lui-même. Même patron que `assert_min_flags`.
--
-- ⚠️ Le déclencheur s'appelle `questions_rate_limit` : « r » précède « w »,
-- il s'exécute donc AVANT `questions_workflow`, qui normalise l'adresse. La
-- comparaison ci-dessous applique elle-même `lower(btrim(…))`.
-- =============================================================================

create function public.enforce_question_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  /* Plafonds validés le 25/09/2026. Les changer est une décision produit. */
  c_per_resource constant integer  := 10;
  c_per_email    constant integer  := 5;
  c_global       constant integer  := 100;
  c_resource_win constant interval := interval '1 hour';
  c_email_win    constant interval := interval '24 hours';
  c_global_win   constant interval := interval '1 hour';
  v_n integer;
begin
  select count(*) into v_n
    from public.questions
   where resource_id = new.resource_id
     and created_at > now() - c_resource_win;

  if v_n >= c_per_resource then
    raise exception 'Trop de questions sur cette ressource pour le moment.'
      using errcode = '54000';
  end if;

  select count(*) into v_n
    from public.questions
   where questioner_email = lower(btrim(new.questioner_email))
     and created_at > now() - c_email_win;

  if v_n >= c_per_email then
    raise exception 'Trop de questions envoyées depuis cette adresse.'
      using errcode = '54000';
  end if;

  select count(*) into v_n
    from public.questions
   where created_at > now() - c_global_win;

  if v_n >= c_global then
    raise exception 'Trop de questions reçues pour le moment.'
      using errcode = '54000';
  end if;

  return new;
end;
$$;

comment on function public.enforce_question_rate_limit is
  'Borne le débit des questions : par ressource, par adresse, et globalement. Seule garde anti-spam qui résiste à un appel direct de l''API.';

create trigger questions_rate_limit
  before insert on public.questions
  for each row execute function public.enforce_question_rate_limit();

/* Les comptages doivent rester instantanés quand la table grossit.
   `questions_resource_idx` couvre déjà le premier ; voici les deux autres. */
create index questions_email_recent_idx
  on public.questions (questioner_email, created_at desc);

create index questions_created_idx
  on public.questions (created_at desc);
