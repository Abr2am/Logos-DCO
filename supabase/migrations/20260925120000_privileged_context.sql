-- =============================================================================
-- Contexte privilégié — point `I10` de l'audit du 25/09/2026.
--
-- Deux gardes tenaient le même raisonnement : « pas d'identité, donc contexte
-- serveur, donc administration ». C'était vrai des migrations et de `psql`,
-- faux des rôles clients de PostgREST, qui n'ont pas d'identité non plus
-- lorsqu'aucun jeton utilisateur n'accompagne la requête :
--
--   · `anon`           — clé anonyme seule ;
--   · `authenticated`  — jeton sans `sub` ;
--   · `service_role`   — clé de service.
--
-- Aucun de ces trois n'atteint ces déclencheurs aujourd'hui : la RLS les
-- arrête avant. C'est donc une faiblesse EN PROFONDEUR — le jour où une
-- policy s'élargit, l'escalade s'active sans bruit, et rien ne la signale.
--
-- La règle devient explicite : une identité absente n'est privilégiée QUE
-- hors des trois rôles clients. Migrations, `psql` et éditeur SQL gardent
-- donc le contexte privilégié « par construction » — c'est ce dont dépendent
-- les fixtures de tests, qui publient en superutilisateur.
--
-- ⚠️ Conséquence VOULUE : la clé de service ne publie, ne rejette, n'archive
-- ni ne change un rôle sans identité. Rien ne l'utilise pour écrire ; une
-- tâche serveur qui le ferait un jour devra porter une identité.
--
-- Le prédicat est répété dans les deux fonctions plutôt que factorisé : une
-- fonction d'aide serait un objet public de plus dans une migration de
-- sécurité, pour trois lignes.
--
-- Aucune policy, aucun `grant`, aucune règle métier ne change ici : seules
-- deux fonctions de déclencheur sont remplacées.
-- =============================================================================

create or replace function public.enforce_resource_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor    uuid    := auth.uid();
  /* Une identité absente n'est privilégiée QUE sur une connexion directe.
     `set role` nomme les rôles clients de PostgREST dans le GUC `role`, et ce
     GUC survit à l'entrée dans une fonction SECURITY DEFINER — contrairement
     à `current_user`, qui devient le propriétaire. */
  v_is_admin boolean := public.is_admin()
    or (v_actor is null
        and coalesce(current_setting('role', true), 'none')
            not in ('anon', 'authenticated', 'service_role'));
begin
  if tg_op = 'INSERT' then
    -- Une ressource naît brouillon, ou directement soumise. Jamais publiée.
    if new.status not in ('DRAFT', 'PENDING') then
      raise exception 'Une ressource ne peut être créée qu''en DRAFT ou PENDING (reçu %).',
        new.status using errcode = '42501';
    end if;

    if new.status = 'PENDING' then
      new.submitted_at := coalesce(new.submitted_at, now());
    end if;

    return new;
  end if;

  -- ---------------------------------------------------------------- UPDATE --

  /* Le dépositaire d'origine reste le dépositaire, même après modification
     par un administrateur. */
  if new.depositor_id is distinct from old.depositor_id then
    raise exception 'Le dépositaire d''une ressource ne peut pas être modifié.'
      using errcode = '42501';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  case
    -- Soumission initiale, et resoumission après correction.
    when old.status in ('DRAFT', 'REJECTED') and new.status = 'PENDING' then
      perform public.assert_min_flags(new.id);
      perform public.assert_file_present(new.id);
      new.submitted_at := now();
      new.admin_comment := null;

    -- Publication : administration uniquement.
    when old.status = 'PENDING' and new.status = 'PUBLISHED' then
      if not v_is_admin then
        raise exception 'Seule l''administration peut publier une ressource.'
          using errcode = '42501';
      end if;
      new.published_at := coalesce(new.published_at, now());

    -- Demande de correction : administration uniquement, commentaire requis.
    when old.status = 'PENDING' and new.status = 'REJECTED' then
      if not v_is_admin then
        raise exception 'Seule l''administration peut demander des corrections.'
          using errcode = '42501';
      end if;
      if new.admin_comment is null or btrim(new.admin_comment) = '' then
        raise exception 'Un commentaire est obligatoire pour demander des corrections.'
          using errcode = '23514';
      end if;

    -- Archivage : administration uniquement.
    when old.status = 'PUBLISHED' and new.status = 'ARCHIVED' then
      if not v_is_admin then
        raise exception 'Seule l''administration peut archiver une ressource.'
          using errcode = '42501';
      end if;
      new.archived_at := coalesce(new.archived_at, now());

    else
      raise exception 'Transition de statut interdite : % → %.',
        old.status, new.status using errcode = '42501';
  end case;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------

create or replace function public.enforce_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  /* Une identité absente n'est privilégiée QUE sur une connexion directe.
     `set role` nomme les rôles clients de PostgREST dans le GUC `role`, et ce
     GUC survit à l'entrée dans une fonction SECURITY DEFINER — contrairement
     à `current_user`, qui devient le propriétaire. */
  if new.role is distinct from old.role
     and not public.is_admin()
     and not (auth.uid() is null
              and coalesce(current_setting('role', true), 'none')
                  not in ('anon', 'authenticated', 'service_role')) then
    raise exception 'Le rôle ne peut pas être modifié par cet utilisateur.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
