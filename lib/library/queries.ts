import type {
  AudienceCode,
  FileFormat,
  ResourceTypeCode,
} from '@/lib/domain/resource';
import { publicClient } from '@/lib/supabase/public-client';

import type {
  Category,
  LibraryFilters,
  ResourceDetail,
  ResourceSummary,
} from './types';

/*
 * Accès à la bibliothèque publique.
 *
 * Tout passe par la taxonomie et par deux fonctions PostgreSQL posées sur les
 * vues publiques : rien d'autre que des ressources PUBLISHED ne peut remonter,
 * quelle que soit la façon dont ces fonctions sont appelées.
 */

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  subcategories: {
    id: number;
    slug: string;
    name: string;
    sort_order: number;
  }[];
};

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await publicClient()
    .from('categories')
    .select('id, slug, name, subcategories(id, slug, name, sort_order)')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Lecture des catégories : ${error.message}`);

  return (data as CategoryRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    subcategories: [...(row.subcategories ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ id, slug, name }) => ({ id, slug, name })),
  }));
}

type ResourceRow = {
  id: string;
  title: string;
  category_slug: string;
  category_name: string;
  subcategory_slug: string | null;
  subcategory_name: string | null;
  resource_type: ResourceTypeCode;
  format: FileFormat | null;
  page_count: number | null;
  slide_count: number | null;
};

export async function searchResources(
  filters: LibraryFilters,
): Promise<ResourceSummary[]> {
  const { data, error } = await publicClient().rpc(
    'search_published_resources',
    {
      p_query: filters.query ?? null,
      p_category_slug: filters.categorySlug ?? null,
      p_subcategory_slug: filters.subcategorySlug ?? null,
      p_flags: filters.flags?.length ? filters.flags : null,
    },
  );

  if (error) throw new Error(`Recherche : ${error.message}`);

  return (data as ResourceRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    subcategorySlug: row.subcategory_slug,
    subcategoryName: row.subcategory_name,
    resourceType: row.resource_type,
    format: row.format,
    pageCount: row.page_count,
    slideCount: row.slide_count,
  }));
}

type ResourceDetailRow = ResourceRow & {
  description: string;
  audiences: AudienceCode[];
  flags: string[];
};

/**
 * Détail d'une ressource PUBLIÉE.
 *
 * Renvoie `null` aussi bien pour une ressource inexistante que pour une
 * ressource non publiée : l'appelant ne peut pas distinguer les deux cas, et
 * ne doit pas essayer de le faire.
 */
export async function getPublishedResource(
  id: string,
): Promise<ResourceDetail | null> {
  const { data, error } = await publicClient().rpc('get_published_resource', {
    p_id: id,
  });

  if (error) throw new Error(`Lecture de la ressource : ${error.message}`);

  const row = (data as ResourceDetailRow[])[0];
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    subcategorySlug: row.subcategory_slug,
    subcategoryName: row.subcategory_name,
    resourceType: row.resource_type,
    audiences: row.audiences ?? [],
    flags: row.flags ?? [],
    format: row.format,
    pageCount: row.page_count,
    slideCount: row.slide_count,
  };
}

/**
 * Mots-clés réellement présents sur les ressources publiées de la branche.
 *
 * Ce n'est pas un référentiel : rien n'est administré, rien n'est validé,
 * et la liste disparaît avec les ressources qui la portaient.
 */
export async function getFlagFacets(
  branch: Pick<LibraryFilters, 'categorySlug' | 'subcategorySlug'> = {},
): Promise<string[]> {
  const { data, error } = await publicClient().rpc('published_flags', {
    p_category_slug: branch.categorySlug ?? null,
    p_subcategory_slug: branch.subcategorySlug ?? null,
  });

  if (error) throw new Error(`Lecture des flags : ${error.message}`);

  return (data as { flag: string }[]).map((row) => row.flag);
}
