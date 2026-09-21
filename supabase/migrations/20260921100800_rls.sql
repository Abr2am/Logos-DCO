-- =============================================================================
-- Row Level Security et surface publique.
--
-- La sécurité vit dans PostgreSQL, jamais dans un composant React : toute
-- règle ci-dessous doit rester vraie pour quelqu'un qui appelle l'API
-- directement, sans passer par l'interface.
--
-- Principe : le rôle anonyme n'a AUCUN accès aux tables. Il ne voit que trois
-- VUES, dont le filtre `status = 'PUBLISHED'` et la liste de colonnes sont
-- internes.
--
-- Pourquoi des vues et pas des policies : la RLS de PostgreSQL est au niveau
-- de la LIGNE, pas de la COLONNE. Autoriser la ligne d'une ressource publiée
-- exposerait aussi `depositor_id` et `admin_comment` — l'identité du
-- dépositaire et une note d'administration, qui ne sont jamais publiques.
-- Le masquage est donc structurel, et ne dépend d'aucune requête prudente
-- côté application.
-- =============================================================================

alter table public.users          enable row level security;
alter table public.categories     enable row level security;
alter table public.subcategories  enable row level security;
alter table public.resources      enable row level security;
alter table public.resource_flags enable row level security;
alter table public.files          enable row level security;

/* On repart de zéro : les privilèges par défaut accordés aux rôles Supabase
   sont révoqués, puis réaccordés sur la seule surface utile. */
revoke all on public.users          from anon, authenticated;
revoke all on public.categories     from anon, authenticated;
revoke all on public.subcategories  from anon, authenticated;
revoke all on public.resources      from anon, authenticated;
revoke all on public.resource_flags from anon, authenticated;
revoke all on public.files          from anon, authenticated;

-- ═══════════════════════════════════════════════════════════════ users ══════
-- Un serviteur ne voit que sa propre ligne. L'identité d'un dépositaire n'est
-- donc atteignable par aucune jointure, depuis aucun rôle client.

grant select, update on public.users to authenticated;

create policy users_select_self_or_admin on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

/* Seule l'administration écrit ; le rôle reste en outre verrouillé par
   déclencheur (voir 20260921100000_users_and_roles.sql). */
create policy users_update_admin on public.users
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════ taxonomie ══════
-- Lisible par tous, écrite par personne : modification par migration
-- uniquement. Aucune policy d'écriture n'est créée, administration comprise.

grant select on public.categories    to anon, authenticated;
grant select on public.subcategories to anon, authenticated;

create policy categories_select_all on public.categories
  for select to anon, authenticated using (true);

create policy subcategories_select_all on public.subcategories
  for select to anon, authenticated using (true);

-- ═════════════════════════════════════════════════════════════ resources ═════
-- Aucun accès anonyme à la table : le public passe par `published_resources`.

grant select, insert, update on public.resources to authenticated;

create policy resources_select_own on public.resources
  for select to authenticated
  using (depositor_id = auth.uid());

create policy resources_select_admin on public.resources
  for select to authenticated
  using (public.is_admin());

/* Un membre dépose pour lui-même, et jamais directement en PUBLISHED : la
   matrice de transitions le refuserait de toute façon. */
create policy resources_insert_own on public.resources
  for insert to authenticated
  with check (
    public.is_member()
    and depositor_id = auth.uid()
    and status in ('DRAFT', 'PENDING')
  );

/* Le serviteur corrige ses propres ressources tant qu'elles ne sont pas
   publiées. Une ressource publiée est en consultation seule de son côté. */
create policy resources_update_own on public.resources
  for update to authenticated
  using (depositor_id = auth.uid() and status in ('DRAFT', 'REJECTED'))
  with check (depositor_id = auth.uid() and status in ('DRAFT', 'PENDING'));

create policy resources_update_admin on public.resources
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

/* Aucune suppression : le cahier des charges prévoit l'archivage, pas la
   suppression. Aucune policy DELETE n'est donc créée, pour personne. */

-- ════════════════════════════════════════════════════════ resource_flags ═════

grant select, insert, update, delete on public.resource_flags to authenticated;

create policy resource_flags_select_own on public.resource_flags
  for select to authenticated
  using (exists (
    select 1 from public.resources r
     where r.id = resource_flags.resource_id
       and r.depositor_id = auth.uid()
  ));

create policy resource_flags_select_admin on public.resource_flags
  for select to authenticated
  using (public.is_admin());

create policy resource_flags_write_own on public.resource_flags
  for all to authenticated
  using (exists (
    select 1 from public.resources r
     where r.id = resource_flags.resource_id
       and r.depositor_id = auth.uid()
       and r.status in ('DRAFT', 'REJECTED')
  ))
  with check (exists (
    select 1 from public.resources r
     where r.id = resource_flags.resource_id
       and r.depositor_id = auth.uid()
       and r.status in ('DRAFT', 'REJECTED')
  ));

/* L'administrateur peut ajouter, corriger ou supprimer des flags pendant la
   modération. */
create policy resource_flags_write_admin on public.resource_flags
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═════════════════════════════════════════════════════════════════ files ═════
-- Aucun rôle client ne lit `storage_path` hors dépositaire et administration.

grant select, insert, update, delete on public.files to authenticated;

create policy files_select_own on public.files
  for select to authenticated
  using (exists (
    select 1 from public.resources r
     where r.id = files.resource_id
       and r.depositor_id = auth.uid()
  ));

create policy files_select_admin on public.files
  for select to authenticated
  using (public.is_admin());

create policy files_write_own on public.files
  for all to authenticated
  using (exists (
    select 1 from public.resources r
     where r.id = files.resource_id
       and r.depositor_id = auth.uid()
       and r.status in ('DRAFT', 'REJECTED')
  ))
  with check (exists (
    select 1 from public.resources r
     where r.id = files.resource_id
       and r.depositor_id = auth.uid()
       and r.status in ('DRAFT', 'REJECTED')
  ));

create policy files_write_admin on public.files
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════ surface publique ═══════
-- Trois vues, et rien d'autre. Chacune porte son filtre en interne.
--
-- Ne figurent PAS dans cette surface : `depositor_id`, `admin_comment`,
-- `status`, `storage_path`, `filename`, les horodatages de workflow, ni
-- aucune colonne de `users`.

create view public.published_resources
with (security_invoker = false) as
  select r.id,
         r.title,
         r.description,
         r.category_id,
         r.subcategory_id,
         r.resource_type,
         r.audiences,
         r.published_at,
         r.search_vector
    from public.resources r
   where r.status = 'PUBLISHED';

create view public.published_resource_flags
with (security_invoker = false) as
  select f.resource_id, f.flag, f.sort_order
    from public.resource_flags f
    join public.resources r on r.id = f.resource_id
   where r.status = 'PUBLISHED';

/* La fiche ressource affiche « format · nombre de pages ». Rien de plus :
   ni chemin de stockage, ni nom de fichier, ni taille. */
create view public.published_resource_files
with (security_invoker = false) as
  select f.resource_id, f.format, f.page_count, f.slide_count
    from public.files f
    join public.resources r on r.id = f.resource_id
   where r.status = 'PUBLISHED';

revoke all on public.published_resources      from anon, authenticated;
revoke all on public.published_resource_flags from anon, authenticated;
revoke all on public.published_resource_files from anon, authenticated;

grant select on public.published_resources      to anon, authenticated;
grant select on public.published_resource_flags to anon, authenticated;
grant select on public.published_resource_files to anon, authenticated;

comment on view public.published_resources is
  'Seule surface publique des ressources. N''expose ni dépositaire, ni commentaire d''administration, ni statut.';
comment on view public.published_resource_flags is
  'Flags des ressources publiées.';
comment on view public.published_resource_files is
  'Format et pagination des ressources publiées. N''expose ni chemin de stockage, ni nom de fichier.';
