-- =============================================================================
-- Stockage des fichiers — bucket PRIVÉ.
--
-- « Les fichiers privés doivent être protégés côté stockage, et pas seulement
--   masqués dans l'interface. »
--
-- Le bucket est privé pour TOUS les statuts, y compris PUBLISHED. C'est plus
-- simple (une seule règle au lieu de deux, aucun déplacement d'objet au
-- changement de statut) et plus sûr : l'archivage rend l'accès immédiatement
-- caduc, alors qu'une URL publique resterait valide une fois diffusée.
--
-- Le téléchargement public passe par une route serveur qui vérifie le statut
-- puis délivre une URL signée de courte durée. Cette route appartient à une
-- étape ultérieure ; seules les règles d'accès sont posées ici.
--
-- Convention de chemin : <depositor_id>/<resource_id>/<nom-généré>
-- Le premier segment permet d'autoriser le dépôt AVANT que la ligne `files`
-- n'existe — l'objet est téléversé, puis la ligne est créée.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Aucune policy pour `anon` : le rôle anonyme n'atteint jamais le stockage.
-- -----------------------------------------------------------------------------

/* Lecture : l'administration, et le dépositaire pour ses propres fichiers. */
create policy "resources_objects_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resources'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

/* Dépôt : un membre écrit uniquement sous son propre préfixe. */
create policy "resources_objects_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resources'
    and public.is_member()
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

/* Remplacement et retrait : le dépositaire tant que la ressource n'est pas
   publiée, l'administration en tout temps (modification pendant la
   modération). */
create policy "resources_objects_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'resources'
    and (
      public.is_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and not exists (
          select 1
            from public.files f
            join public.resources r on r.id = f.resource_id
           where f.storage_path = storage.objects.name
             and r.status not in ('DRAFT', 'REJECTED')
        )
      )
    )
  )
  with check (bucket_id = 'resources');

create policy "resources_objects_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resources'
    and (
      public.is_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and not exists (
          select 1
            from public.files f
            join public.resources r on r.id = f.resource_id
           where f.storage_path = storage.objects.name
             and r.status not in ('DRAFT', 'REJECTED')
        )
      )
    )
  );
