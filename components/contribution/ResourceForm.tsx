'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { FileUpload } from '@/components/ui/FileUpload';
import { FlagsInput } from '@/components/ui/FlagsInput';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  EMPTY_FORM_STATE,
  type EditableResource,
  type FormState,
} from '@/lib/contributions/types';
import { AUDIENCES, RESOURCE_TYPES } from '@/lib/domain/resource';
import { ACCEPT_ATTRIBUTE } from '@/lib/files/formats';
import type { Category } from '@/lib/library/types';

/*
 * Formulaire de ressource — UNE SEULE PAGE, jamais un wizard.
 *
 * Huit champs, dans l'ordre du cahier des charges : titre, description,
 * fichier, catégorie, sous-catégorie, public, type, flags.
 *
 * Le même formulaire sert au dépôt, à la correction par le dépositaire et à
 * la modification par l'administration : seule l'action change.
 */
export function ResourceForm({
  categories,
  action,
  submitLabel,
  note,
  resource,
  fileRequired = true,
}: {
  categories: ReadonlyArray<Category>;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  /** Mention sous le bouton — « Relu par un administrateur… ». */
  note?: string;
  resource?: EditableResource | null;
  fileRequired?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  const [categoryId, setCategoryId] = useState<number>(
    resource?.categoryId ?? 0,
  );

  const category = categories.find((item) => item.id === categoryId);
  const subcategories = category?.subcategories ?? [];
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="grid gap-22">
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}

      {state.error ? <Panel accent="burgundy">{state.error}</Panel> : null}

      <Input
        id="title"
        name="title"
        label="Titre"
        required
        defaultValue={resource?.title}
        placeholder="Saint Marc, apôtre de l'Égypte"
        error={errors['title']}
      />

      <Textarea
        id="description"
        name="description"
        label="Description"
        required
        rows={3}
        defaultValue={resource?.description}
        placeholder="Un parcours en quatre séances sur la vie de saint Marc."
        help="1 à 3 phrases"
        error={errors['description']}
      />

      <FileUpload
        id="file"
        name="file"
        label="Fichier"
        accept={ACCEPT_ATTRIBUTE}
        required={fileRequired}
        help="PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX"
        error={errors['file']}
        currentFilename={resource?.filename}
      />

      {/* Paires courtes sur deux colonnes à partir de la tablette. */}
      <div className="grid gap-22 tablet:grid-cols-2 tablet:gap-[20px]">
        <Select
          id="categoryId"
          name="categoryId"
          label="Catégorie"
          required
          defaultValue={resource?.categoryId ?? ''}
          onChange={(event) => setCategoryId(Number(event.target.value))}
          error={errors['categoryId']}
        >
          <option value="">Choisir une catégorie</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>

        <Select
          id="subcategoryId"
          name="subcategoryId"
          label="Sous-catégorie"
          defaultValue={resource?.subcategoryId ?? ''}
          disabled={subcategories.length === 0}
          error={errors['subcategoryId']}
        >
          <option value="">
            {subcategories.length === 0
              ? 'Sans objet pour cette catégorie'
              : 'Aucune'}
          </option>
          {subcategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>

      <ChipGroup
        id="audiences"
        name="audiences"
        label="Public"
        required
        options={Object.entries(AUDIENCES).map(([value, label]) => ({
          value,
          label,
        }))}
        defaultValues={resource?.audiences}
        error={errors['audiences']}
      />

      <Select
        id="resourceType"
        name="resourceType"
        label="Type"
        required
        defaultValue={resource?.resourceType ?? ''}
        error={errors['resourceType']}
      >
        <option value="">Choisir un type</option>
        {Object.entries(RESOURCE_TYPES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <FlagsInput
        id="flags"
        name="flags"
        label="Flags"
        defaultValues={resource?.flags}
        error={errors['flags']}
      />

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Envoi…' : submitLabel}
        </Button>
        {note ? <p className="mt-12 text-small text-help">{note}</p> : null}
      </div>
    </form>
  );
}
