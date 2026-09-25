'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin, requireMember } from '@/lib/auth/session';
import { AUDIENCES, RESOURCE_TYPES } from '@/lib/domain/resource';
import { ACCEPTED_FORMATS } from '@/lib/files/formats';
import {
  detectPaginationFromStorage,
  type Pagination,
} from '@/lib/files/pagination';
import {
  STORAGE_BUCKET,
  buildStoragePath,
  isOwnedBy,
} from '@/lib/files/storage-path';
import { storageReader } from '@/lib/files/storage-reader';
import {
  isValidationError,
  validateStoredFile,
  validateUploadRequest,
  type ValidatedFile,
} from '@/lib/files/validate';
import { createSessionClient } from '@/lib/supabase/server-client';

import { logDatabaseError, userMessage } from './errors';
import { readUploadedFileRef } from './uploaded-file';

import type { FormState } from './types';

/*
 * Dépôt, correction et modération.
 *
 * Rien n'est cru sur parole côté client : chaque champ est revalidé ici, et
 * les règles structurantes — cinq flags, fichier obligatoire, transitions de
 * statut, dépositaire immuable — sont de toute façon appliquées par la base.
 * Cette couche produit des messages lisibles ; elle n'est pas la garde.
 *
 * ⚠️ Un refus de la base ne s'affiche JAMAIS tel quel (25/09/2026) : son
 * message nomme des tables, des colonnes et des policies. `userMessage` rend
 * une phrase écrite pour le serviteur, `logDatabaseError` garde le détail
 * dans le journal du serveur — voir `errors.ts`.
 *
 * ── Le fichier ne passe plus par ici (24/09/2026) ───────────────────────────
 * Le navigateur dépose directement dans Storage, par URL signée. Ces actions
 * ne voient donc qu'un CHEMIN, jamais des octets. Deux gardes le rendent sûr :
 *
 *   · `isOwnedBy` — le chemin revendiqué doit commencer par l'identifiant du
 *     demandeur. La même règle est répétée en base, dans `submit_resource` et
 *     `replace_resource_file` : c'est elle qui fait foi ;
 *   · `validateStoredFile` — taille, type et signature sont relus DEPUIS
 *     STORAGE, pas depuis le formulaire.
 */

const BUCKET = STORAGE_BUCKET;
const MIN_FLAGS = 5;

function fail(fieldErrors: Record<string, string>, error?: string): FormState {
  return { error: error ?? null, fieldErrors };
}

type Metadata = {
  title: string;
  description: string;
  categoryId: number;
  subcategoryId: number | null;
  resourceType: string;
  audiences: string[];
  flags: string[];
};

/** Revalide intégralement les métadonnées reçues du formulaire. */
function readMetadata(
  formData: FormData,
): { data: Metadata } | { errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const title = String(formData.get('title') ?? '').trim();
  if (!title) errors['title'] = 'Le titre est obligatoire.';

  const description = String(formData.get('description') ?? '').trim();
  if (!description) errors['description'] = 'La description est obligatoire.';

  const categoryId = Number(formData.get('categoryId'));
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    errors['categoryId'] = 'Choisissez une catégorie.';
  }

  const rawSubcategory = String(formData.get('subcategoryId') ?? '');
  const subcategoryId = rawSubcategory ? Number(rawSubcategory) : null;
  if (subcategoryId !== null && !Number.isInteger(subcategoryId)) {
    errors['subcategoryId'] = 'Sous-catégorie invalide.';
  }

  const resourceType = String(formData.get('resourceType') ?? '');
  if (!(resourceType in RESOURCE_TYPES)) {
    errors['resourceType'] = 'Choisissez un type.';
  }

  const audiences = formData.getAll('audiences').map(String);
  if (audiences.length === 0) {
    errors['audiences'] = 'Choisissez au moins un public.';
  } else if (audiences.some((audience) => !(audience in AUDIENCES))) {
    errors['audiences'] = 'Public invalide.';
  }

  const flags = [
    ...new Set(
      formData
        .getAll('flags')
        .map((flag) => String(flag).trim())
        .filter(Boolean),
    ),
  ];
  if (flags.length < MIN_FLAGS) {
    errors['flags'] =
      'Cinq flags au minimum sont nécessaires pour référencer la ressource.';
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      title,
      description,
      categoryId,
      subcategoryId,
      resourceType,
      audiences,
      flags,
    },
  };
}

async function removeFile(path: string): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

export type PreparedUpload =
  { path: string; signedUrl: string; mimeType: string } | { error: string };

/**
 * Temps 1 du dépôt : signer une URL d'écriture, pour UN chemin précis.
 *
 * Le chemin est construit par le serveur sous le préfixe du demandeur — le
 * client ne le choisit jamais. La signature passe par le client de session,
 * donc la policy `resources_objects_insert_own` s'applique ici : un visiteur
 * sans compte n'obtient rien. Le jeton expire, et `upsert: false` interdit
 * d'écraser un objet existant.
 */
export async function prepareUpload(request: {
  filename: string;
  sizeBytes: number;
  mimeType?: string;
}): Promise<PreparedUpload> {
  const user = await requireMember('/partager');

  const declared = validateUploadRequest(request);
  if (isValidationError(declared)) return { error: declared.error };

  const path = buildStoragePath(user.id, declared.format);
  const supabase = await createSessionClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    logDatabaseError('prepareUpload', error);
    return {
      error: "Le dépôt n'a pas pu être préparé. Réessayez dans un instant.",
    };
  }

  /* Le type renvoyé est celui du FORMAT retenu, pas celui qu'annonce le
     système du visiteur : c'est lui que Storage enregistrera, et que la
     validation d'après dépôt comparera. */
  return { path, signedUrl: data.signedUrl, mimeType: declared.mimeType };
}

/**
 * Temps 2 : l'objet est en place, la ressource n'existe pas encore.
 *
 * Renvoie les métadonnées du fichier RÉELLEMENT stocké, ou une erreur — et
 * dans ce cas l'objet est retiré, pour ne pas laisser d'orphelin de plus.
 */
type ClaimedFile =
  { error: string } | { file: ValidatedFile; pagination: Pagination };

async function claimUploadedFile(
  userId: string,
  storagePath: string,
  declaredFilename: string,
): Promise<ClaimedFile> {
  if (!storagePath || !isOwnedBy(storagePath, userId)) {
    return { error: 'Fichier introuvable : reprenez le dépôt.' };
  }

  const supabase = await createSessionClient();
  const reader = storageReader(supabase);

  const file = await validateStoredFile(reader, {
    path: storagePath,
    filename: declaredFilename,
  });
  if (isValidationError(file)) {
    await removeFile(storagePath);
    return { error: file.error };
  }

  const pagination = await detectPaginationFromStorage(reader, {
    path: storagePath,
    format: file.format,
    sizeBytes: file.sizeBytes,
  });

  return { file, pagination };
}

/**
 * Remplace le fichier d'une ressource — et seulement si un nouveau a été
 * déposé. Renvoie `null` quand il n'y a rien à faire ou que le remplacement a
 * réussi, un état d'erreur sinon.
 *
 * Les deux formulaires de modification passent par ici, celui du dépositaire
 * comme celui de l'administration : c'est ce qui garantit qu'un fichier
 * téléversé est réellement attaché, et que l'ancien ne survit pas à son
 * remplaçant. `replace_resource_file` retire l'ancienne ligne avant d'écrire
 * la nouvelle, et la RLS décide si l'appelant en a le droit.
 *
 * `userId` est celui de l'appelant — dépositaire ou administrateur : le chemin
 * a été construit sous SON préfixe par `prepareUpload`, et `isOwnedBy` comme
 * `owns_storage_path` le revérifient.
 */
async function replaceUploadedFile(
  supabase: Awaited<ReturnType<typeof createSessionClient>>,
  userId: string,
  resourceId: string,
  formData: FormData,
): Promise<FormState | null> {
  const uploaded = readUploadedFileRef(formData);
  if (!uploaded) return null;

  const claimed = await claimUploadedFile(
    userId,
    uploaded.storagePath,
    uploaded.filename,
  );
  if ('error' in claimed) return fail({ file: claimed.error });
  const { file, pagination } = claimed;

  const { error } = await supabase.rpc('replace_resource_file', {
    p_id: resourceId,
    p_storage_path: uploaded.storagePath,
    p_filename: file.filename,
    p_format: file.format,
    p_mime_type: ACCEPTED_FORMATS[file.format].mimeType,
    p_size_bytes: file.sizeBytes,
    p_page_count: pagination.pageCount,
    p_slide_count: pagination.slideCount,
  });

  if (error) {
    logDatabaseError('replace_resource_file', error);
    /* Le fichier n'a pas été attaché : il ne doit pas rester dans le bucket. */
    await removeFile(uploaded.storagePath);
    return fail(
      {},
      userMessage(
        error,
        "Le fichier n'a pas pu être remplacé. Réessayez dans un instant.",
      ),
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════ SERVITEUR ══════

export async function submitResource(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireMember('/partager');

  const metadata = readMetadata(formData);
  if ('errors' in metadata) return fail(metadata.errors);

  const storagePath = String(formData.get('storagePath') ?? '');
  const claimed = await claimUploadedFile(
    user.id,
    storagePath,
    String(formData.get('filename') ?? ''),
  );
  if ('error' in claimed) return fail({ file: claimed.error });
  const { file, pagination } = claimed;

  const supabase = await createSessionClient();

  const { data, error } = await supabase.rpc('submit_resource', {
    p_title: metadata.data.title,
    p_description: metadata.data.description,
    p_category_id: metadata.data.categoryId,
    p_subcategory_id: metadata.data.subcategoryId,
    p_resource_type: metadata.data.resourceType,
    p_audiences: metadata.data.audiences,
    p_flags: metadata.data.flags,
    p_storage_path: storagePath,
    p_filename: file.filename,
    p_format: file.format,
    p_mime_type: ACCEPTED_FORMATS[file.format].mimeType,
    p_size_bytes: file.sizeBytes,
    p_page_count: pagination.pageCount,
    p_slide_count: pagination.slideCount,
  });

  if (error || !data) {
    logDatabaseError('submit_resource', error);
    /* Le dépôt a échoué : l'objet téléversé ne doit pas rester orphelin. */
    await removeFile(storagePath);
    return fail(
      {},
      userMessage(
        error,
        "La ressource n'a pas pu être soumise. Réessayez dans un instant.",
      ),
    );
  }

  revalidatePath('/mes-contributions');
  redirect('/partager?soumise=1');
}

export async function updateResource(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireMember('/mes-contributions');
  const id = String(formData.get('id') ?? '');
  if (!id) return fail({}, 'Ressource introuvable.');

  const metadata = readMetadata(formData);
  if ('errors' in metadata) return fail(metadata.errors);

  const supabase = await createSessionClient();

  const { error } = await supabase.rpc('update_resource', {
    p_id: id,
    p_title: metadata.data.title,
    p_description: metadata.data.description,
    p_category_id: metadata.data.categoryId,
    p_subcategory_id: metadata.data.subcategoryId,
    p_resource_type: metadata.data.resourceType,
    p_audiences: metadata.data.audiences,
    p_flags: metadata.data.flags,
  });
  if (error) {
    logDatabaseError('update_resource', error);
    return fail(
      {},
      userMessage(error, "La modification n'a pas pu être enregistrée."),
    );
  }

  const failure = await replaceUploadedFile(supabase, user.id, id, formData);
  if (failure) return failure;

  revalidatePath('/mes-contributions');
  redirect('/mes-contributions?corrigee=1');
}

export async function resubmitResource(formData: FormData) {
  await requireMember('/mes-contributions');
  const id = String(formData.get('id') ?? '');

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc('resubmit_resource', { p_id: id });
  if (error) throw new Error(`Resoumission : ${error.message}`);

  revalidatePath('/mes-contributions');
  redirect('/mes-contributions?resoumise=1');
}

// ═══════════════════════════════════════════════════════════════ ADMIN ══════

/**
 * Transition de statut demandée par l'administration.
 *
 * La fonction SQL appelée n'a aucun pouvoir propre : c'est la matrice du
 * déclencheur qui accepte ou refuse, et la RLS qui décide si la ligne est
 * seulement visible.
 */
async function moderate(id: string, rpc: string) {
  await requireAdmin(`/admin/ressources/${id}`);

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc(rpc, { p_id: id });
  if (error) throw new Error(`${rpc} : ${error.message}`);

  revalidatePath('/admin');
  revalidatePath(`/admin/ressources/${id}`);
}

export async function publishResource(formData: FormData) {
  await moderate(String(formData.get('id') ?? ''), 'publish_resource');
  redirect('/admin?publiee=1');
}

export async function archiveResource(formData: FormData) {
  await moderate(String(formData.get('id') ?? ''), 'archive_resource');
  redirect('/admin?archivee=1');
}

export async function requestChanges(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  const comment = String(formData.get('comment') ?? '').trim();

  if (!comment) {
    return fail({
      comment: 'Un commentaire est obligatoire pour demander des corrections.',
    });
  }

  await requireAdmin(`/admin/ressources/${id}`);
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc('request_changes', {
    p_id: id,
    p_comment: comment,
  });
  if (error) {
    logDatabaseError('request_changes', error);
    return fail(
      {},
      userMessage(
        error,
        "La demande de correction n'a pas pu être enregistrée.",
      ),
    );
  }

  revalidatePath('/admin');
  redirect('/admin?corrections=1');
}

export async function updateResourceAsAdmin(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  const admin = await requireAdmin(`/admin/ressources/${id}`);

  const metadata = readMetadata(formData);
  if ('errors' in metadata) return fail(metadata.errors);

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc('update_resource', {
    p_id: id,
    p_title: metadata.data.title,
    p_description: metadata.data.description,
    p_category_id: metadata.data.categoryId,
    p_subcategory_id: metadata.data.subcategoryId,
    p_resource_type: metadata.data.resourceType,
    p_audiences: metadata.data.audiences,
    p_flags: metadata.data.flags,
  });
  if (error) {
    logDatabaseError('update_resource', error);
    return fail(
      {},
      userMessage(error, "La modification n'a pas pu être enregistrée."),
    );
  }

  /* Le formulaire de modération porte le même champ « Fichier » que celui du
     dépositaire : il doit produire le même effet. Sans cette étape, l'objet
     était bien téléversé mais jamais attaché — l'ancien fichier restait en
     place, et l'écran annonçait pourtant une modification réussie. */
  const failure = await replaceUploadedFile(supabase, admin.id, id, formData);
  if (failure) return failure;

  revalidatePath(`/admin/ressources/${id}`);
  redirect(`/admin/ressources/${id}?modifiee=1`);
}
