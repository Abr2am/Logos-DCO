-- =============================================================================
-- Fichiers.
--
-- Relation 1-1 avec la ressource, portée par `files.resource_id` seul : la
-- référence croisée `resources.file_id` ↔ `files.resource_id` prévue à
-- l'origine rendait l'insertion impossible sans contrainte différée et
-- autorisait des états incohérents.
--
-- Le contenu vit dans un bucket PRIVÉ (voir 20260921100900_storage.sql).
-- Cette table ne stocke qu'un chemin ; elle n'est jamais lisible par le
-- public, qui ne voit que la vue `published_resource_files`.
-- =============================================================================

create type public.file_format as enum (
  'PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX'
);

create table public.files (
  id           uuid primary key default gen_random_uuid(),
  resource_id  uuid not null unique references public.resources (id) on delete cascade,

  storage_path text not null unique,
  filename     text not null,

  format       public.file_format not null,
  mime_type    text not null,
  size_bytes   bigint not null,

  /* Détectés automatiquement lorsque c'est possible ; NULL sinon, et
     l'interface omet alors la pagination. */
  page_count   integer,
  slide_count  integer,

  created_at   timestamptz not null default now(),

  constraint files_filename_not_blank check (btrim(filename) <> ''),
  constraint files_storage_path_not_blank check (btrim(storage_path) <> ''),
  constraint files_size_positive check (size_bytes > 0),
  constraint files_page_count_positive check (page_count is null or page_count > 0),
  constraint files_slide_count_positive check (slide_count is null or slide_count > 0),

  /* Liste blanche stricte : les sept formats du MVP, et la correspondance
     exacte entre le format déclaré et le type MIME. Aucun exécutable,
     aucune archive.

     ⚠️ PPTX, DOCX et XLSX SONT des conteneurs ZIP : la validation porte sur
     le couple (format, type MIME), jamais sur une détection générique
     « c'est une archive ». */
  constraint files_format_mime_allowed check (
    (format, mime_type) in (
      ('PDF',  'application/pdf'),
      ('DOC',  'application/msword'),
      ('DOCX', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      ('PPT',  'application/vnd.ms-powerpoint'),
      ('PPTX', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
      ('XLS',  'application/vnd.ms-excel'),
      ('XLSX', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    )
  ),

  /* Une pagination n'a de sens que pour le format qui la porte. */
  constraint files_page_count_pdf_only
    check (page_count is null or format = 'PDF'),
  constraint files_slide_count_slides_only
    check (slide_count is null or format in ('PPT', 'PPTX'))
);

comment on table public.files is
  'Fichier d''une ressource. Jamais lisible par le public : le téléchargement passe par une URL signée délivrée côté serveur après vérification du statut.';
