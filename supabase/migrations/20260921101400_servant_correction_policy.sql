-- =============================================================================
-- Correction d'une policy : un serviteur doit pouvoir CORRIGER une ressource
-- « À corriger ».
--
-- Le `with check` posé à l'étape 3 n'admettait que les statuts DRAFT et
-- PENDING pour la ligne résultante. Corriger une ressource REJECTED sans la
-- resoumettre la laisse en REJECTED — la policy la refusait donc, alors que
-- le cahier des charges prévoit explicitement « Modifier la ressource » puis
-- « Resoumettre la ressource » comme deux actions distinctes.
--
-- REJECTED est ajouté à l'ensemble autorisé. La sécurité ne repose pas sur
-- cette liste seule : la RLS borne les statuts qu'un serviteur peut écrire, et
-- le déclencheur de workflow borne les TRANSITIONS. Un serviteur ne peut
-- toujours pas se placer en REJECTED depuis DRAFT — cette transition n'est pas
-- dans la matrice — ni atteindre PUBLISHED ou ARCHIVED.
-- =============================================================================

drop policy resources_update_own on public.resources;

create policy resources_update_own on public.resources
  for update to authenticated
  using (depositor_id = auth.uid() and status in ('DRAFT', 'REJECTED'))
  with check (
    depositor_id = auth.uid()
    and status in ('DRAFT', 'PENDING', 'REJECTED')
  );
