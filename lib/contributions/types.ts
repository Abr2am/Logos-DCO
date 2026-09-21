import type {
  AudienceCode,
  FileFormat,
  ResourceTypeCode,
} from '@/lib/domain/resource';

/** Statuts affichables. `DRAFT` reste un état technique interne. */
export type ContributionStatus =
  'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export type Contribution = {
  id: string;
  title: string;
  categoryName: string;
  resourceType: ResourceTypeCode;
  status: ContributionStatus;
  adminComment: string | null;
  submittedAt: string | null;
  createdAt: string;
};

/** Ressource telle qu'un dépositaire la reprend pour correction. */
export type EditableResource = {
  id: string;
  title: string;
  description: string;
  categoryId: number;
  subcategoryId: number | null;
  resourceType: ResourceTypeCode;
  audiences: AudienceCode[];
  flags: string[];
  status: ContributionStatus;
  adminComment: string | null;
  filename: string | null;
  format: FileFormat | null;
};

export type AdminCounters = {
  pending: number;
  published: number;
  rejected: number;
  archived: number;
};

export type AdminQueueItem = {
  id: string;
  title: string;
  categoryName: string;
  status: ContributionStatus;
  depositorEmail: string;
  submittedAt: string | null;
  createdAt: string;
};

/** Vue de modération — seule surface où le dépositaire est identifié. */
export type AdminResource = EditableResource & {
  categoryName: string;
  subcategoryName: string | null;
  depositorEmail: string;
  depositorName: string | null;
  pageCount: number | null;
  slideCount: number | null;
  submittedAt: string | null;
  publishedAt: string | null;
};

/*
 * État d'un formulaire de contribution.
 *
 * Vit ici et non dans `actions.ts` : un module `'use server'` ne peut exporter
 * que des fonctions asynchrones, jamais une constante.
 */
export type FormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
};

export const EMPTY_FORM_STATE: FormState = { error: null, fieldErrors: {} };
