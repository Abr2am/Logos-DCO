'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin, requireMember } from '@/lib/auth/session';
import { AUDIENCES, RESOURCE_TYPES } from '@/lib/domain/resource';
import { ACCEPTED_FORMATS } from '@/lib/files/formats';
import { detectPagination } from '@/lib/files/pagination';
import { isValidationError, validateUpload } from '@/lib/files/validate';
import { createSessionClient } from '@/lib/supabase/server-client';

import type { FormState } from './types';

/*
 * Dépôt, correction et modération.
 *
 * Rien n'est cru sur parole côté client : chaque champ est revalidé ici, et
 * les règles structurantes — cinq flags, fichier obligatoire, transitions de
 * statut, dépositaire immuable — sont de toute façon appliquées par la base.
 * Cette couche produit des messages lisibles ; elle n'est pas la garde.
 */

const BUCKET = 'resources';
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

/** Dépose l'objet dans le bucket privé, sous le préfixe du dépositaire. */
async function uploadFile(
  userId: string,
  file: { filename: string; mimeType: string; bytes: Uint8Array },
): Promise<{ path: string } | { error: string }> {
  const supabase = await createSessionClient();
  const extension = file.filename.split('.').pop()?.toLowerCase() ?? 'bin';

  /* Nom généré : le nom d'origine n'est conservé que comme métadonnée. */
  const path = `${userId}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.bytes, { contentType: file.mimeType, upsert: false });

  if (error) return { error: `Téléversement : ${error.message}` };
  return { path };
}

async function removeFile(path: string): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

// ═══════════════════════════════════════════════════════════ SERVITEUR ══════

export async function submitResource(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireMember('/partager');

  const metadata = readMetadata(formData);
  if ('errors' in metadata) return fail(metadata.errors);

  const file = await validateUpload(formData.get('file') as File | null);
  if (isValidationError(file)) return fail({ file: file.error });

  const uploaded = await uploadFile(user.id, file);
  if ('error' in uploaded) return fail({}, uploaded.error);

  const pagination = await detectPagination(file.bytes, file.format);
  const supabase = await createSessionClient();

  const { data, error } = await supabase.rpc('submit_resource', {
    p_title: metadata.data.title,
    p_description: metadata.data.description,
    p_category_id: metadata.data.categoryId,
    p_subcategory_id: metadata.data.subcategoryId,
    p_resource_type: metadata.data.resourceType,
    p_audiences: metadata.data.audiences,
    p_flags: metadata.data.flags,
    p_storage_path: uploaded.path,
    p_filename: file.filename,
    p_format: file.format,
    p_mime_type: ACCEPTED_FORMATS[file.format].mimeType,
    p_size_bytes: file.sizeBytes,
    p_page_count: pagination.pageCount,
    p_slide_count: pagination.slideCount,
  });

  if (error || !data) {
    /* Le dépôt a échoué : l'objet téléversé ne doit pas rester orphelin. */
    await removeFile(uploaded.path);
    return fail({}, `La ressource n'a pas pu être soumise : ${error?.message}`);
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
  if (error) return fail({}, `Modification refusée : ${error.message}`);

  /* Le fichier n'est remplacé que si un nouveau est joint. */
  const replacement = formData.get('file') as File | null;
  if (replacement && replacement.size > 0) {
    const file = await validateUpload(replacement);
    if (isValidationError(file)) return fail({ file: file.error });

    const uploaded = await uploadFile(user.id, file);
    if ('error' in uploaded) return fail({}, uploaded.error);

    const pagination = await detectPagination(file.bytes, file.format);
    const { error: fileError } = await supabase.rpc('replace_resource_file', {
      p_id: id,
      p_storage_path: uploaded.path,
      p_filename: file.filename,
      p_format: file.format,
      p_mime_type: ACCEPTED_FORMATS[file.format].mimeType,
      p_size_bytes: file.sizeBytes,
      p_page_count: pagination.pageCount,
      p_slide_count: pagination.slideCount,
    });

    if (fileError) {
      await removeFile(uploaded.path);
      return fail({}, `Remplacement du fichier : ${fileError.message}`);
    }
  }

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
  if (error) return fail({}, `Demande refusée : ${error.message}`);

  revalidatePath('/admin');
  redirect('/admin?corrections=1');
}

export async function updateResourceAsAdmin(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  await requireAdmin(`/admin/ressources/${id}`);

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
  if (error) return fail({}, `Modification refusée : ${error.message}`);

  revalidatePath(`/admin/ressources/${id}`);
  redirect(`/admin/ressources/${id}?modifiee=1`);
}
