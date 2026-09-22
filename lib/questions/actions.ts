'use server';

import { revalidatePath } from 'next/cache';

import { requireMember } from '@/lib/auth/session';
import { publicClient } from '@/lib/supabase/public-client';
import { createSessionClient } from '@/lib/supabase/server-client';

import {
  EMAIL_MAX_LENGTH,
  EMAIL_SHAPE,
  QUESTION_MAX_LENGTH,
  QUESTION_MIN_LENGTH,
  type AskQuestionState,
} from './types';

/*
 * Actions des questions.
 *
 * Aucun envoi d'e-mail : le MVP n'embarque aucun service de messagerie. La
 * question est stockée, le dépositaire la retrouve dans « Mes questions » et
 * répond depuis sa propre messagerie.
 *
 * Les contrôles ci-dessous ne sont que la courtoisie de l'interface : la
 * vérité est dans les contraintes de `public.questions` et dans la policy
 * d'insertion, qui refuse toute ressource non publiée.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(
  fieldErrors: Record<string, string>,
  error: string | null = null,
): AskQuestionState {
  return { error, fieldErrors, sent: false };
}

export async function askQuestion(
  _previous: AskQuestionState,
  formData: FormData,
): Promise<AskQuestionState> {
  const resourceId = String(formData.get('ressource') ?? '');
  const email = String(formData.get('email') ?? '').trim();
  const question = String(formData.get('question') ?? '').trim();

  if (!UUID.test(resourceId)) return fail({}, 'Ressource introuvable.');

  const fieldErrors: Record<string, string> = {};

  if (!question) {
    fieldErrors['question'] = 'Écrivez votre question.';
  } else if (question.length < QUESTION_MIN_LENGTH) {
    fieldErrors['question'] = 'Votre question est trop courte.';
  } else if (question.length > QUESTION_MAX_LENGTH) {
    fieldErrors['question'] =
      `Votre question dépasse ${QUESTION_MAX_LENGTH} caractères.`;
  }

  if (!email) {
    fieldErrors['email'] = 'Renseignez votre adresse e-mail.';
  } else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_SHAPE.test(email)) {
    fieldErrors['email'] = 'Cette adresse e-mail ne paraît pas valide.';
  }

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  /* Client ANONYME, même pour un visiteur connecté : poser une question
     n'exige aucun compte, et la policy d'insertion est la même pour tous. */
  const { error } = await publicClient().rpc('ask_question', {
    p_resource_id: resourceId,
    p_email: email,
    p_question: question,
  });

  if (error) {
    return fail(
      {},
      "Votre question n'a pas pu être envoyée. Réessayez dans un instant.",
    );
  }

  return { error: null, fieldErrors: {}, sent: true };
}

/** Passage en « Répondue », une fois la réponse envoyée par messagerie. */
export async function markQuestionAnswered(formData: FormData) {
  await requireMember('/mes-questions');
  const id = String(formData.get('id') ?? '');

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc('mark_question_answered', { p_id: id });
  if (error) throw new Error(`Question : ${error.message}`);

  revalidatePath('/mes-questions');
}
