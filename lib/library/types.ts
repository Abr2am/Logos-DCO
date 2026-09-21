import type { FileFormat, ResourceTypeCode } from '@/lib/domain/resource';

export type Subcategory = {
  id: number;
  slug: string;
  name: string;
};

export type Category = {
  id: number;
  slug: string;
  name: string;
  subcategories: Subcategory[];
};

/** Ce que la surface publique expose d'une ressource dans une liste. */
export type ResourceSummary = {
  id: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  subcategorySlug: string | null;
  subcategoryName: string | null;
  resourceType: ResourceTypeCode;
  format: FileFormat | null;
  pageCount: number | null;
  slideCount: number | null;
};

export type LibraryFilters = {
  query?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  /** Plusieurs flags sélectionnés : logique OU. */
  flags?: string[];
};
