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

type FileFacts = {
  format: FileFormat | null;
  pageCount: number | null;
  slideCount: number | null;
};

/**
 * Ligne de fichier : `format · pagination`.
 *
 * Employée seule dans le bloc de métadonnées de la fiche — où le type occupe
 * déjà sa propre case — et sous le bouton de téléchargement.
 * La pagination est omise lorsqu'elle est inconnue.
 */
export function fileFormatLine(file: FileFacts): string {
  const parts: string[] = [];

  if (file.format) parts.push(file.format);

  if (file.pageCount) {
    parts.push(`${file.pageCount} page${file.pageCount > 1 ? 's' : ''}`);
  } else if (file.slideCount) {
    parts.push(
      `${file.slideCount} diapositive${file.slideCount > 1 ? 's' : ''}`,
    );
  }

  return parts.join(' · ');
}

/**
 * Ligne de métadonnées d'une carte : `type · format · pagination`.
 * Rien d'autre — ni auteur, ni date, ni public, ni flags.
 */
export function resourceMetaLine(
  resource: FileFacts & { resourceType: ResourceTypeCode },
): string {
  return [RESOURCE_TYPES[resource.resourceType], fileFormatLine(resource)]
    .filter(Boolean)
    .join(' · ');
}
