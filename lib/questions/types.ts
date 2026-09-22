/*
 * Questions — MVP.
 *
 * Deux statuts, et deux seulement : en attente de réponse, ou répondue. Il
 * n'existe ni brouillon, ni fil, ni réponse stockée — la réponse part de la
 * messagerie personnelle du dépositaire, hors de Logos.
 */

export type QuestionStatus = 'PENDING' | 'ANSWERED';

/**
 * Question telle que son dépositaire la voit.
 *
 * ⚠️ `questionerEmail` est une donnée personnelle. Elle n'a sa place que dans
 * « Mes questions » et dans l'administration — jamais dans une page publique,
 * jamais dans une métadonnée, jamais dans une URL.
 */
export type MyQuestion = {
  id: string;
  resourceId: string;
  resourceTitle: string;
  questionerEmail: string;
  questionText: string;
  status: QuestionStatus;
  createdAt: string;
  answeredAt: string | null;
};

/* Bornes reprises telles quelles des contraintes de la table : l'application
   ne fait que les annoncer à l'avance, la base les impose. */
export const QUESTION_MIN_LENGTH = 10;
export const QUESTION_MAX_LENGTH = 1000;
export const EMAIL_MAX_LENGTH = 254;

/** Contrôle de forme, pas de validité — identique à `questions_email_shape`. */
export const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type AskQuestionState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  sent: boolean;
};

export const EMPTY_ASK_STATE: AskQuestionState = {
  error: null,
  fieldErrors: {},
  sent: false,
};
