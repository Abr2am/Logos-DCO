import type { Metadata } from 'next';
import Link from 'next/link';

import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { requireMember } from '@/lib/auth/session';
import { markQuestionAnswered } from '@/lib/questions/actions';
import { getMyQuestions } from '@/lib/questions/queries';
import type { MyQuestion } from '@/lib/questions/types';

/*
 * Mes questions.
 *
 * Le serviteur ne voit QUE les questions posées sur ses propres ressources —
 * la RLS s'en charge, la page n'a rien à filtrer.
 *
 * Il n'y a pas de zone de réponse : le MVP n'embarque aucun service d'envoi
 * d'e-mail. L'adresse du visiteur est un lien `mailto:` qui ouvre la
 * messagerie personnelle du serviteur. Une fois la réponse partie, il marque
 * la question comme répondue.
 *
 * Traitement du Design System pour le bloc Q&R : accent doré pour une
 * question répondue, accent neutre pour une question en attente.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mes questions — Logos',
  robots: { index: false, follow: false },
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR');
}

export default async function MesQuestionsPage() {
  await requireMember('/mes-questions');
  const questions = await getMyQuestions();
  const waiting = questions.filter((q) => q.status === 'PENDING').length;

  return (
    <>
      <Header currentPath="/mes-questions" />

      <main className="mx-auto max-w-content px-22 py-34 tablet:px-26 tablet:py-44 desktop:px-44">
        <h1 className="font-display text-h1-mobile tablet:text-h1">
          Mes questions
        </h1>
        <p className="mt-12 text-body text-text-secondary">
          Les questions posées sur les ressources que vous avez déposées.
          {waiting > 0
            ? ` ${waiting} en attente de réponse.`
            : ' Aucune n’attend de réponse.'}
        </p>
        <p className="mt-12">
          <Link
            href="/mes-contributions"
            className="text-[13px] font-semibold text-burgundy underline-offset-4 hover:text-burgundy-light hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
          >
            Mes contributions →
          </Link>
        </p>

        {questions.length === 0 ? (
          <div className="mt-34">
            <EmptyState
              title="Aucune question reçue"
              description="Les questions posées sur vos ressources apparaîtront ici."
            />
          </div>
        ) : (
          <ul className="mt-34 grid max-w-reading gap-16">
            {questions.map((question) => (
              <li key={question.id}>
                <QuestionCard question={question} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function QuestionCard({ question }: { question: MyQuestion }) {
  const answered = question.status === 'ANSWERED';

  /* L'adresse est encodée avant d'entrer dans l'URL : un « ? » ou un « # »
     dans la partie locale — que la contrainte de la table accepte — couperait
     sinon le destinataire au premier de ces caractères, et le courrier
     partirait silencieusement à la mauvaise adresse. Le « @ » reste littéral,
     comme l'attendent les clients de messagerie.

     Objet pré-rempli : le visiteur ne sait pas de quelle ressource il s'agit
     une fois la réponse reçue hors de Logos. */
  const address = encodeURIComponent(question.questionerEmail).replace(
    /%40/g,
    '@',
  );
  const mailto =
    `mailto:${address}` +
    `?subject=${encodeURIComponent(`Logos — ${question.resourceTitle}`)}`;

  return (
    <Panel accent={answered ? 'gold' : 'neutral'}>
      <p className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-help">
        <Link
          href={`/ressource/${question.resourceId}`}
          className="underline-offset-4 hover:text-burgundy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
        >
          {question.resourceTitle}
        </Link>
      </p>

      <p className="mt-12 text-[14.5px] leading-[1.6]">
        {question.questionText}
      </p>

      <dl className="mt-16 grid gap-[6px] border-t border-line-hairline pt-12 text-small">
        <div className="flex flex-wrap items-baseline gap-x-[8px]">
          <dt className="text-help">Adresse du visiteur</dt>
          <dd>
            <a
              href={mailto}
              className="font-medium text-burgundy underline underline-offset-4 hover:text-burgundy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
            >
              {question.questionerEmail}
            </a>
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-[8px]">
          <dt className="text-help">Reçue le</dt>
          <dd>{formatDate(question.createdAt)}</dd>
        </div>
      </dl>

      {answered ? (
        <p className="mt-12 text-small text-help">
          Répondue
          {question.answeredAt ? ` le ${formatDate(question.answeredAt)}` : ''}.
        </p>
      ) : (
        <div className="mt-16 flex flex-wrap items-center gap-12">
          <a
            href={mailto}
            className="text-[13px] font-semibold text-burgundy underline underline-offset-4 hover:text-burgundy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
          >
            Répondre par e-mail
          </a>
          <form action={markQuestionAnswered}>
            <input type="hidden" name="id" value={question.id} />
            <Button type="submit" variant="secondary">
              Marquer comme répondue
            </Button>
          </form>
        </div>
      )}
    </Panel>
  );
}
