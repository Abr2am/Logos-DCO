import type { FileFormat } from '@/lib/domain/resource';

import { ACCEPTED_FORMATS } from './formats';

/*
 * Chemins du bucket privé — la règle de propriété, en un seul endroit.
 *
 *   <uuid du dépositaire>/<uuid généré>.<extension>
 *
 * Le premier segment est ce sur quoi TOUT repose :
 *   · la policy Storage `resources_objects_insert_own` n'autorise l'écriture
 *     que sous le préfixe de l'utilisateur ;
 *   · `submit_resource` et `replace_resource_file` refusent en base un chemin
 *     qui ne commence pas par `auth.uid()` — un serviteur ne peut donc pas
 *     revendiquer l'objet d'un autre ;
 *   · le serveur ne fait jamais confiance au chemin renvoyé par le
 *     navigateur : il le revérifie avec `isOwnedBy`.
 *
 * ⚠️ Le nom d'origine n'entre JAMAIS dans le chemin : il n'est conservé que
 * comme métadonnée, dans `files.filename`. Seule l'extension est reprise, et
 * elle est celle du format validé — jamais une chaîne venue du client.
 */

export const STORAGE_BUCKET = 'resources';

export function buildStoragePath(userId: string, format: FileFormat): string {
  return `${userId}/${crypto.randomUUID()}.${ACCEPTED_FORMATS[format].extension}`;
}

/** Le chemin appartient-il bien à cet utilisateur ? */
export function isOwnedBy(path: string, userId: string): boolean {
  if (!userId) return false;
  /* Un chemin ne comporte que deux segments, sans traversée possible. */
  if (path.includes('..') || path.includes('//') || path.startsWith('/')) {
    return false;
  }
  return path.startsWith(`${userId}/`) && path.slice(userId.length + 1) !== '';
}
