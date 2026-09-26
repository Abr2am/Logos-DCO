import type {
  AudienceCode,
  FileFormat,
  ResourceTypeCode,
} from '@/lib/domain/resource';
import { createSessionClient } from '@/lib/supabase/server-client';

import type {
  AdminCounters,
  AdminQueueItem,
  AdminResource,
  Contribution,
  ContributionStatus,
  EditableResource,
} from './types';

/*
 * Lectures de l'espace serviteur et de l'administration.
 *
 * Tout passe par le client de SESSION : la RLS s'applique, un serviteur ne
 * voit que ses propres ressources, et les fonctions d'administration refusent
 * tout appelant qui n'est pas ADMIN — indépendamment de la protection des
 * pages.
 */

type ContributionRow = {
  id: string;
  title: string;
  category_name: string;
  resource_type: ResourceTypeCode;
  status: ContributionStatus;
  admin_comment: string | null;
  submitted_at: string | null;
  created_at: string;
};

export async function getMyContributions(): Promise<Contribution[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc('my_contributions');
  if (error) throw new Error(`Mes contributions : ${error.message}`);

  return (data as ContributionRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    categoryName: row.category_name,
    resourceType: row.resource_type,
    status: row.status,
    adminComment: row.admin_comment,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  }));
}

type EditableRow = {
  id: string;
  title: string;
  description: string;
  category_id: number;
  subcategory_id: number | null;
  resource_type: ResourceTypeCode;
  audiences: AudienceCode[] | null;
  flags: string[] | null;
  status: ContributionStatus;
  admin_comment: string | null;
  filename: string | null;
  format: FileFormat | null;
};

function toEditable(row: EditableRow): EditableResource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: Number(row.category_id),
    subcategoryId:
      row.subcategory_id == null ? null : Number(row.subcategory_id),
    resourceType: row.resource_type,
    audiences: row.audiences ?? [],
    flags: row.flags ?? [],
    status: row.status,
    adminComment: row.admin_comment,
    filename: row.filename,
    format: row.format,
  };
}

export async function getEditableResource(
  id: string,
): Promise<EditableResource | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc('editable_resource', { p_id: id });
  if (error) throw new Error(`Ressource à corriger : ${error.message}`);

  const row = (data as EditableRow[])[0];
  return row ? toEditable(row) : null;
}

type CountersRow = {
  pending: number | string;
  published: number | string;
  rejected: number | string;
  archived: number | string;
};

export async function getAdminCounters(): Promise<AdminCounters> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc('admin_counters');
  if (error) throw new Error(`Compteurs : ${error.message}`);

  const row = (data as CountersRow[])[0];
  return {
    pending: Number(row?.pending ?? 0),
    published: Number(row?.published ?? 0),
    rejected: Number(row?.rejected ?? 0),
    archived: Number(row?.archived ?? 0),
  };
}

type QueueRow = {
  id: string;
  title: string;
  category_name: string;
  status: ContributionStatus;
  depositor_email: string;
  submitted_at: string | null;
  created_at: string;
};

export async function getAdminQueue(
  status?: string,
): Promise<AdminQueueItem[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc('admin_queue', {
    p_status: status ?? null,
  });
  if (error) throw new Error(`File de modération : ${error.message}`);

  return (data as QueueRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    categoryName: row.category_name,
    status: row.status,
    depositorEmail: row.depositor_email,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  }));
}

type AdminRow = EditableRow & {
  category_name: string;
  subcategory_name: string | null;
  depositor_email: string;
  depositor_name: string | null;
  page_count: number | null;
  slide_count: number | null;
  submitted_at: string | null;
  published_at: string | null;
};

export async function getAdminResource(
  id: string,
): Promise<AdminResource | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc('admin_resource', { p_id: id });
  if (error) throw new Error(`Modération : ${error.message}`);

  const row = (data as AdminRow[])[0];
  if (!row) return null;

  return {
    ...toEditable(row),
    categoryName: row.category_name,
    subcategoryName: row.subcategory_name,
    depositorEmail: row.depositor_email,
    depositorName: row.depositor_name,
    pageCount: row.page_count == null ? null : Number(row.page_count),
    slideCount: row.slide_count == null ? null : Number(row.slide_count),
    submittedAt: row.submitted_at,
    publishedAt: row.published_at,
  };
}
