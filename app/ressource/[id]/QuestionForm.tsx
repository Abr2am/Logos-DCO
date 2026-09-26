'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Textarea } from '@/components/ui/Textarea';
import { askQuestion } from '@/lib/questions/actions';
import {
  EMPTY_ASK_STATE,
  FORM_TOKEN_FIELD,
  HONEYPOT_FIELD,
  QUESTION_MAX_LENGTH,
} from '@/lib/questions/types';

/*
 * Bloc « Poser une question » du Design System.
 *
 * Aucun compte requis. L'adresse sert uniquement à recevoir la réponse : elle
 * n'ouvre pas de compte, ne s'affiche jamais sur la page, et le dépositaire
 * n'est jamais nommé au questionneur.
 *
 * Ce n'est pas une messagerie : un seul envoi, pas de fil, pas d'historique
 * côté visiteur. La confirmation remplace le formulaire — succès = noyer
 * et filet doré, jamais de vert, jamais de toast.
 *
 * Deux champs cachés portent l'anti-spam (25/09/2026) : un jeton horodaté,
 * émis au rendu par la page, et un leurre. Ni l'un ni l'autre n'a d'existence
 * visuelle — le formulaire est exactement celui du Design System.
 */
export function QuestionForm({
  resourceId,
  formToken,
}: {
  resourceId: string;
  /** Jeton signé au rendu : il date le formulaire, il n'identifie personne. */
  formToken: string;
}) {
  const [state, action, pending] = useActionState(askQuestion, EMPTY_ASK_STATE);

  if (state.sent) {
    return (
      <Panel accent="gold" label="Question envoyée">
        Votre question a bien été transmise. La réponse vous parviendra par
        e-mail, à l&apos;adresse que vous avez indiquée.
      </Panel>
    );
  }

  return (
    <form action={action} className="grid gap-12">
      <input type="hidden" name="ressource" value={resourceId} />
      <input type="hidden" name={FORM_TOKEN_FIELD} value={formToken} />

      {/* Leurre : hors flux, hors écran, hors tabulation et masqué aux
          technologies d'assistance. Un visiteur ne peut pas le remplir ; un
          robot qui remplit tout le remplira. */}
      <div
        aria-hidden
        className="absolute left-[-9999px] h-[1px] w-[1px] overflow-hidden"
      >
        <label htmlFor="site">Ne remplissez pas ce champ</label>
        <input
          id="site"
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <Textarea
        id="question"
        name="question"
        label="Votre question"
        required
        rows={3}
        maxLength={QUESTION_MAX_LENGTH}
        placeholder="La quatrième séance suppose-t-elle une lecture préalable ?"
        error={state.fieldErrors['question']}
      />

      <div className="flex flex-col gap-12 tablet:flex-row tablet:items-start">
        <div className="tablet:flex-1">
          <Input
            id="questioner-email"
            name="email"
            type="email"
            label="Votre adresse e-mail"
            required
            autoComplete="email"
            placeholder="vous@exemple.fr"
            help="Elle sert uniquement à vous répondre. Aucun compte n'est créé."
            error={state.fieldErrors['email']}
          />
        </div>
        <div className="tablet:mt-[31px]">
          <Button type="submit" disabled={pending}>
            {pending ? 'Envoi…' : 'Envoyer la question'}
          </Button>
        </div>
      </div>

      {state.error ? (
        <p className="flex gap-[6px] text-[11.5px] leading-[1.5] text-walnut-900">
          <span className="font-mono" aria-hidden>
            !
          </span>
          <span>{state.error}</span>
        </p>
      ) : null}
    </form>
  );
}
