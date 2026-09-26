import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

/*
 * Anti-spam du formulaire public de question — point ouvert « R », tranché le
 * 25/09/2026.
 *
 * Deux pièges, et ils ne prétendent qu'à une chose : écarter les robots qui
 * passent par la PAGE.
 *
 * ⚠️ Ils ne sont pas la garde. La clé anonyme est inlinée dans le bundle du
 * navigateur — c'est sa nature —, si bien qu'un appel direct à
 * `rpc/ask_question` ne verrait jamais ce fichier. Ce qui borne réellement le
 * débit est le déclencheur `questions_rate_limit`, en base. Ici, on ne fait
 * que rendre le spam de formulaire non rentable.
 *
 * ── La clé de signature ─────────────────────────────────────────────────────
 * Elle est DÉRIVÉE de `SUPABASE_SERVICE_ROLE_KEY`, jamais égale à elle : une
 * variable d'environnement de plus serait une friction de déploiement pour un
 * MVP qui n'en a pas besoin. La dérivation est à sens unique, et le jeton
 * émis ne révèle rien de la clé. Si la clé de service tourne, les formulaires
 * déjà ouverts deviennent invalides — le visiteur recharge, rien n'est perdu.
 */

/** En deçà, c'est une machine : personne ne lit et n'écrit en trois secondes. */
export const MIN_FILL_MS = 3_000;

/** Au-delà, la page traîne depuis trop longtemps — ou le jeton est rejoué. */
export const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;

/** Tolérance d'horloge entre le rendu et la soumission. */
const CLOCK_SKEW_MS = 60_000;

export type TokenVerdict = 'ok' | 'trop-rapide' | 'perime' | 'invalide';

function formSecret(): Buffer {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY est requis pour signer le formulaire de question.',
    );
  }
  /* Dérivation : la clé de service ne sert jamais telle quelle. */
  return createHmac('sha256', serviceKey)
    .update('logos:question-form')
    .digest();
}

function sign(issuedAt: number): string {
  return createHmac('sha256', formSecret())
    .update(String(issuedAt))
    .digest('base64url');
}

/** Jeton à poser dans le formulaire, au rendu de la fiche. */
export function issueFormToken(now: number = Date.now()): string {
  return `${now}.${sign(now)}`;
}

/**
 * Le jeton est-il authentique, et le formulaire a-t-il été rempli par un
 * humain ? Un verdict, jamais une exception : l'appelant choisit le message.
 */
export function verifyFormToken(
  token: string | null | undefined,
  now: number = Date.now(),
): TokenVerdict {
  if (!token) return 'invalide';

  const separator = token.indexOf('.');
  if (separator <= 0) return 'invalide';

  const raw = token.slice(0, separator);
  /* Un horodatage en millisecondes tient sur treize chiffres ; on borne pour
     ne pas signer une valeur absurde. */
  if (!/^\d{1,15}$/.test(raw)) return 'invalide';

  const expected = Buffer.from(sign(Number(raw)));
  const received = Buffer.from(token.slice(separator + 1));
  if (expected.length !== received.length) return 'invalide';
  if (!timingSafeEqual(expected, received)) return 'invalide';

  const issuedAt = Number(raw);
  if (issuedAt > now + CLOCK_SKEW_MS) return 'invalide';

  const age = now - issuedAt;
  if (age < MIN_FILL_MS) return 'trop-rapide';
  if (age > MAX_FORM_AGE_MS) return 'perime';

  return 'ok';
}

/** Le leurre a-t-il été rempli ? Seul un robot le peut. */
export function isHoneypotFilled(value: FormDataEntryValue | null): boolean {
  return typeof value === 'string' && value.trim() !== '';
}
