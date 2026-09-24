import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { STORAGE_BUCKET } from './storage-path';
import type { StoredObjectReader } from './validate';

/*
 * Lecture d'un objet du bucket privé, par PLAGES D'OCTETS.
 *
 * C'est la pièce qui remplace `file.arrayBuffer()` : depuis l'upload direct,
 * le serveur ne reçoit plus le fichier, il le relit dans Storage — et, dans
 * l'immense majorité des cas, il n'en lit que quelques octets :
 *
 *   · signature       → les 8 premiers octets ;
 *   · diapositives    → la queue du conteneur ZIP (répertoire central) ;
 *   · pages d'un PDF  → le fichier entier, et seulement sous le seuil fixé.
 *
 * Tout passe par une URL signée de courte durée émise avec le client de
 * SESSION : la policy `resources_objects_select_own` s'applique donc, et un
 * serviteur ne peut relire que ses propres objets.
 */

/** Validité de l'URL signée de lecture, en secondes. */
const READ_URL_TTL = 60;

function split(path: string): { directory: string; name: string } {
  const index = path.lastIndexOf('/');
  return index === -1
    ? { directory: '', name: path }
    : { directory: path.slice(0, index), name: path.slice(index + 1) };
}

export function storageReader(supabase: SupabaseClient): StorageReader {
  const bucket = supabase.storage.from(STORAGE_BUCKET);

  async function range(
    path: string,
    header: string,
  ): Promise<Uint8Array | null> {
    const { data, error } = await bucket.createSignedUrl(path, READ_URL_TTL);
    if (error || !data?.signedUrl) return null;

    const response = await fetch(data.signedUrl, {
      headers: { range: header },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    return new Uint8Array(await response.arrayBuffer());
  }

  return {
    async stat(path) {
      const { directory, name } = split(path);
      const { data, error } = await bucket.list(directory, {
        limit: 1,
        search: name,
      });
      const entry = data?.find((item) => item.name === name);
      if (error || !entry) return null;

      const metadata = entry.metadata as
        { size?: number; mimetype?: string } | null | undefined;

      return {
        sizeBytes: typeof metadata?.size === 'number' ? metadata.size : 0,
        mimeType: metadata?.mimetype ?? null,
      };
    },

    head(path, length) {
      return range(path, `bytes=0-${length - 1}`);
    },

    tail(path, length) {
      return range(path, `bytes=-${length}`);
    },

    async all(path) {
      const { data, error } = await bucket.download(path);
      if (error || !data) return null;
      return new Uint8Array(await data.arrayBuffer());
    },
  };
}

export type StorageReader = StoredObjectReader & {
  /** Les `length` DERNIERS octets — le répertoire central d'un conteneur ZIP. */
  tail(path: string, length: number): Promise<Uint8Array | null>;
  /** L'objet entier. Réservé aux PDF sous le seuil de pagination. */
  all(path: string): Promise<Uint8Array | null>;
};
