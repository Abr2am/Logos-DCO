-- =============================================================================
-- Doublure Supabase — POUR LES TESTS UNIQUEMENT.
--
-- Ce fichier n'est PAS une migration et n'est jamais appliqué à un
-- environnement Supabase : la plateforme fournit déjà les rôles `anon`,
-- `authenticated` et `service_role`, le schéma `auth` et le schéma `storage`.
--
-- Il reproduit le strict minimum permettant d'exécuter les migrations et les
-- tests sur un PostgreSQL nu.
-- =============================================================================

/* Les rôles sont globaux au cluster, pas à la base : la création doit être
   idempotente pour qu'une base jetable puisse être recréée à volonté. */
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I nologin', r);
    end if;
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;

-- ── auth ─────────────────────────────────────────────────────────────────────

create schema auth;

create table auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text not null
);

/* Supabase lit l'identité dans les revendications du JWT. Ici, un paramètre
   de session tient le même rôle : `set local app.user_id = '<uuid>'`. */
create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- ── storage ──────────────────────────────────────────────────────────────────

create schema storage;

create table storage.buckets (
  id     text primary key,
  name   text not null,
  public boolean not null default false
);

create table storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets (id),
  name      text not null,
  owner     uuid
);

alter table storage.objects enable row level security;

/* Renvoie les segments de dossier d'un chemin, sans le nom de fichier. */
create function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select (string_to_array(name, '/'))[
           1 : greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)
         ];
$$;

grant usage on schema storage to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated;
