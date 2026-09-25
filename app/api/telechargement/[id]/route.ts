import { signedFileRedirect } from '@/lib/files/download';
import { serviceClient } from '@/lib/supabase/service-client';

/*
 * Téléchargement d'une ressource.
 *
 * Le bucket est PRIVÉ pour tous les statuts. Cette route est le seul chemin
 * d'accès aux fichiers :
 *
 *   1. `get_published_file` ne renvoie un chemin que pour une ressource
 *      PUBLISHED — la règle vit en base, pas ici. Une ressource en attente,
 *      à corriger ou archivée ne renvoie rien, et l'archivage rend donc le
 *      téléchargement immédiatement caduc.
 *   2. une URL signée de courte durée est émise, en forçant
 *      `Content-Disposition: attachment` : le fichier n'est jamais rendu dans
 *      le navigateur.
 *
 * Le chemin de stockage n'est exposé à aucun rôle client : il n'apparaît ni
 * dans la surface publique, ni dans le HTML de la fiche. Il n'est connu que du
 * serveur et de l'URL signée elle-même, qui expire.
 *
 * Une ressource inexistante et une ressource non publiée donnent exactement la
 * même réponse : rien ne doit permettre de distinguer les deux cas.
 */

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Durée de validité de l'URL signée, en secondes. */
const SIGNED_URL_TTL = 60;

const BUCKET = 'resources';

type PublishedFile = {
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

/**
 * Le nom de fichier provient de la base et finira dans un en-tête HTTP :
 * on en retire tout ce qui pourrait en sortir (guillemets, retours à la ligne,
 * caractères de contrôle) ainsi que toute composante de chemin.
 */
function safeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? 'ressource';
  const cleaned = base.replace(/["\r\n\u0000-\u001f\u007f]/g, '').trim();
  return cleaned || 'ressource';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID.test(id)) return notFound();

  const supabase = serviceClient();

  const { data, error } = await supabase.rpc('get_published_file', {
    p_id: id,
  });
  if (error) throw new Error(`Téléchargement : ${error.message}`);

  const file = (data as PublishedFile[])[0];
  if (!file) return notFound();

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
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
