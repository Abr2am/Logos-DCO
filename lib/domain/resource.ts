/*
 * Libellés du cahier des charges, mot pour mot.
 *
 * Les codes sont ceux des énumérations PostgreSQL ; les libellés sont ceux de
 * la spécification. Ne jamais ajouter, renommer ou raccourcir une entrée.
 */

export const RESOURCE_TYPES = {
  COURS_PRESENTATION: 'Cours / présentation',
  FICHE_PEDAGOGIQUE: 'Fiche pédagogique',
  ACTIVITE: 'Activité',
  JEU: 'Jeu',
  SUPPORT_DE_SEANCE: 'Support de séance',
  DOCUMENT: 'Document',
  AUTRE: 'Autre',
} as const;

export type ResourceTypeCode = keyof typeof RESOURCE_TYPES;

export const AUDIENCES = {
  PETITE_ENFANCE: 'Petite enfance',
  ENFANTS: 'Enfants',
  ADOLESCENTS: 'Adolescents',
  JEUNES_ADULTES: 'Jeunes adultes',
  ADULTES: 'Adultes',
  FAMILLES: 'Familles',
  SERVITEURS: 'Serviteurs',
  TOUS_PUBLICS: 'Tous les publics',
} as const;

export type AudienceCode = keyof typeof AUDIENCES;

export const FILE_FORMATS = [
  'PDF',
  'DOC',
  'DOCX',
  'PPT',
  'PPTX',
  'XLS',
  'XLSX',
] as const;

export type FileFormat = (typeof FILE_FORMATS)[number];

/**
 * Ligne de métadonnées d'une carte : `type · format · pagination`.
 * Rien d'autre — ni auteur, ni date, ni public, ni flags.
 * La pagination est omise lorsqu'elle est inconnue.
 */
export function resourceMetaLine(resource: {
  resourceType: ResourceTypeCode;
  format: FileFormat | null;
  pageCount: number | null;
  slideCount: number | null;
}): string {
  const parts: string[] = [RESOURCE_TYPES[resource.resourceType]];

  if (resource.format) parts.push(resource.format);

  if (resource.pageCount) {
    parts.push(
      `${resource.pageCount} page${resource.pageCount > 1 ? 's' : ''}`,
    );
  } else if (resource.slideCount) {
    parts.push(
      `${resource.slideCount} diapositive${resource.slideCount > 1 ? 's' : ''}`,
    );
  }

  return parts.join(' · ');
}
