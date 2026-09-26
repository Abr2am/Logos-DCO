-- =============================================================================
-- Rôles applicatifs et profils utilisateurs.
--
-- `PUBLIC` n'est pas un rôle : c'est l'absence de compte. La table ne connaît
-- donc que SERVANT et ADMIN.
--
-- Il n'existe AUCUNE inscription publique : les comptes sont créés par le
-- diocèse. Cette migration ne met en place que le schéma ; les parcours
-- d'authentification appartiennent à une étape ultérieure.
-- =============================================================================

create type public.user_role as enum ('SERVANT', 'ADMIN');

create table public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  role         public.user_role not null default 'SERVANT',
  display_name text,
  created_at   timestamptz not null default now(),

  constraint users_email_not_blank check (btrim(email) <> '')
);

comment on table public.users is
  'Profil applicatif adossé à auth.users. Le rôle n''est jamais modifiable par le client.';

-- -----------------------------------------------------------------------------
-- Lecture du rôle courant.
--
-- SECURITY DEFINER est indispensable : ces fonctions sont appelées depuis les
-- policies de `public.users` elle-même, et une lecture soumise à la RLS y
-- provoquerait une récursion infinie.
-- -----------------------------------------------------------------------------

create function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role from public.users u where u.id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.auth_role() = 'ADMIN', false);
$$;

/* « Membre » = titulaire d'un compte, quel que soit son rôle. */
create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() is not null;
$$;

-- -----------------------------------------------------------------------------
-- Création du profil à la création du compte d'authentification.
-- Le rôle par défaut est SERVANT ; passer un compte en ADMIN reste une
-- opération d'administration, jamais une action applicative.
-- -----------------------------------------------------------------------------

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- Verrou du rôle — défense en profondeur.
--
-- La RLS interdit déjà toute écriture sur `users` hors administration ; ce
-- déclencheur refuse en plus tout changement de rôle émanant d'un utilisateur
-- authentifié non administrateur, quel que soit le chemin emprunté.
--
-- `auth.uid()` vaut NULL côté serveur (service_role, migrations, scripts
-- d'administration) : ce contexte est privilégié par construction.
-- -----------------------------------------------------------------------------

create function public.enforce_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Le rôle ne peut pas être modifié par cet utilisateur.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger users_enforce_role_change
  before update on public.users
  for each row execute function public.enforce_user_role_change();
