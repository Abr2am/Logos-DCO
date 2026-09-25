import { currentUser } from '@/lib/auth/session';
import {
  SIGNED_URL_TTL,
  safeFilename,
  signedFileRedirect,
} from '@/lib/files/download';
import { STORAGE_BUCKET } from '@/lib/files/storage-path';
import { createSessionClient } from '@/lib/supabase/server-client';

/*
 * Téléchargement par l'administration — tous statuts.
 *
 * On ne publie pas une ressource sans l'avoir ouverte : la modération a besoin
 * du fichier d'une ressource PENDING, REJECTED ou ARCHIVED, que le
 * téléchargement public refuse par construction.
 *
 * ── Pourquoi une route distincte de `/api/telechargement/[id]` ──────────────
 * La route publique est anonyme et s'appuie sur `service_role`, donc HORS
 * RLS : sa seule garde est le filtre `status = 'PUBLISHED'` de
 * `get_published_file`. Y greffer une branche privilégiée ferait cohabiter un
 * chemin anonyme et un chemin administrateur dans un même handler, la clé de
 * service déjà en main. Ici, au contraire :
 *
 *   · le client est celui de la SESSION — jamais `serviceClient()` ;
 *   · `admin_resource_file` refuse quiconque n'est pas administrateur ;
 *   · la policy Storage `resources_objects_select_own` revérifie `is_admin()`
 *     au moment de signer.
 *
 * Trois gardes, dont deux dans PostgreSQL : la route ne fait qu'orchestrer.
 *
 * ⚠️ `notFound()` et non une redirection : un serviteur ou un visiteur reçoit
 * exactement la réponse d'une ressource inexistante. Rien — ni statut, ni
 * message, ni code — ne doit révéler que la ressource existe.
 *
 * Le chemin de stockage ne quitte jamais ce fichier : il sert à signer, et
 * n'apparaît ni dans le HTML, ni dans la réponse.
 */

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Code d'erreur PostgreSQL `insufficient_privilege`. */
const FORBIDDEN = '42501';

type AdminFile = {
  storage_path: string;
  filename: string;
  mime_type: string;
};

function notFound(): Response {
  return new Response('Ressource introuvable.', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') return notFound();
  if (!UUID.test(id)) return notFound();

  const supabase = await createSessionClient();

  const { data, error } = await supabase.rpc('admin_resource_file', {
    p_id: id,
  });

  /* La base a le dernier mot : si elle refuse, la réponse reste un 404 muet.
     Toute autre erreur est une panne, et doit rester visible. */
  if (error) {
    if (error.code === FORBIDDEN) return notFound();
    throw new Error(`Téléchargement administrateur : ${error.message}`);
  }

  const file = (data as AdminFile[])[0];
  if (!file) return notFound();

  const { data: signed, error: signError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_TTL, {
      download: safeFilename(file.filename),
    });

  if (signError || !signed?.signedUrl) {
    throw new Error(
      `Signature de l'URL : ${signError?.message ?? 'réponse vide'}`,
    );
  }

  return signedFileRedirect(signed.signedUrl);
}
