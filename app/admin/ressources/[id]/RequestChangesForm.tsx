'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { requestChanges } from '@/lib/contributions/actions';
import { EMPTY_FORM_STATE } from '@/lib/contributions/types';

/*
 * Demande de correction — le commentaire est OBLIGATOIRE.
 * Il sera affiché au serviteur dans « Mes contributions ».
 */
export function RequestChangesForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    requestChanges,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={action} className="grid gap-12">
      <input type="hidden" name="id" value={id} />
      <Textarea
        id="comment"
        name="comment"
        label="Commentaire de correction"
        required
        rows={3}
        placeholder="Il manque la tranche d'âge visée dans la description."
        error={state.fieldErrors['comment'] ?? state.error ?? undefined}
      />
      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          Demander des corrections
        </Button>
      </div>
    </form>
  );
}
