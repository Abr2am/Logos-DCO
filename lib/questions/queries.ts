import { createSessionClient } from '@/lib/supabase/server-client';

import type { MyQuestion, QuestionStatus } from './types';

/*
 * Lecture des questions reçues par le serviteur connecté.
 *
 * Passe par le client de SESSION : la RLS s'applique, et `my_questions()` ne
 * rend que les questions posées sur ses propres ressources. La page n'a rien
 * à filtrer — et ne le pourrait pas de façon sûre.
 */

type QuestionRow = {
  id: string;
  resource_id: string;
  resource_title: string;
  questioner_email: string;
  question_text: string;
  status: QuestionStatus;
  created_at: string;
  answered_at: string | null;
};

export async function getMyQuestions(): Promise<MyQuestion[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc('my_questions');
  if (error) throw new Error(`Mes questions : ${error.message}`);

  return (data as QuestionRow[]).map((row) => ({
    id: row.id,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    questionerEmail: row.questioner_email,
    questionText: row.question_text,
    status: row.status,
    createdAt: row.created_at,
    answeredAt: row.answered_at,
  }));
}
