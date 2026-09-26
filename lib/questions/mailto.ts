/*
 * Lien de réponse du dépositaire.
 *
 * Le MVP n'envoie aucun e-mail : le serviteur répond depuis sa propre
 * messagerie, ouverte par un lien `mailto:`.
 *
 * ⚠️ L'adresse est encodée avant d'entrer dans l'URL. La contrainte
 * `questions_email_shape` accepte un « ? » ou un « # » dans la partie locale ;
 * rendus tels quels, ils couperaient le destinataire au premier d'entre eux et
 * le courrier partirait silencieusement à la mauvaise adresse. Le « @ » reste
 * littéral, comme l'attendent les clients de messagerie.
 */

export function answerMailto(email: string, resourceTitle: string): string {
  const address = encodeURIComponent(email).replace(/%40/g, '@');
  const subject = encodeURIComponent(`Logos — ${resourceTitle}`);
  return `mailto:${address}?subject=${subject}`;
}
