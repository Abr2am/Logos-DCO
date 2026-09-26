-- =============================================================================
-- Workflow de publication — appliqué EN BASE.
--
--   DRAFT → PENDING → PUBLISHED → ARCHIVED
--   PENDING → REJECTED (« À corriger ») → PENDING
--
-- « Le serviteur ne publie jamais directement. » Cette règle n'est pas une
-- règle d'interface : un serviteur qui appellerait l'API directement doit être
-- rejeté par la base.
--
-- `auth.uid()` vaut NULL côté serveur (service_role, migrations, scripts
-- d'administration) : ce contexte est privilégié par construction et n'est pas
-- soumis au contrôle de rôle ci-dessous. Les transitions elles-mêmes restent
-- vérifiées dans tous les cas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Minimum cinq flags — exigé dès que la ressource quitte l'état DRAFT.
-- -----------------------------------------------------------------------------

create function public.assert_min_flags(p_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
    from public.resource_flags
   where resource_id = p_resource_id;

  if v_count < 5 then
    raise exception
      'Cinq flags au minimum sont nécessaires pour référencer la ressource (actuellement %).',
      v_count
      using errcode = '23514';
  end if;
end;
$$;

create function public.assert_file_present(p_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.files where resource_id = p_resource_id) then
    raise exception 'Un fichier est obligatoire pour soumettre une ressource.'
      using errcode = '23514';
  end if;
end;
$$;

/* Empêche de repasser sous le seuil de cinq flags par suppression, tant que la
   ressource n'est pas à l'état DRAFT. Lors d'une suppression en cascade, la
   ressource n'existe plus : le contrôle est alors sans objet. */
create function public.resource_flags_guard_minimum()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resource_id uuid := coalesce(new.resource_id, old.resource_id);
  v_status public.resource_status;
begin
  select status into v_status
    from public.resources where id = v_resource_id;

  if v_status is not null and v_status <> 'DRAFT' then
    perform public.assert_min_flags(v_resource_id);
  end if;

  return null;
end;
$$;

create trigger resource_flags_guard_minimum
  after delete or update on public.resource_flags
  for each row execute function public.resource_flags_guard_minimum();

-- -----------------------------------------------------------------------------
-- Matrice de transitions.
-- -----------------------------------------------------------------------------

create function public.enforce_resource_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor    uuid    := auth.uid();
  v_is_admin boolean := (v_actor is null) or public.is_admin();
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

create trigger resources_enforce_workflow
  before insert or update on public.resources
  for each row execute function public.enforce_resource_workflow();
