'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { FlagFilterLink } from '@/components/ui/Flag';
import { cn } from '@/lib/cn';
import { libraryHref } from '@/lib/library/url';
import type { Category } from '@/lib/library/types';

/*
 * Filtres — UNIQUEMENT Catégorie, Sous-catégorie et Flags.
 * Pas de filtre par Public, pas de filtre par Type, pas de recherche avancée.
 *
 * Plusieurs flags sélectionnés utilisent une logique OU.
 *
 * L'état vit dans l'URL : chaque option est un lien. Le composant n'est client
 * que pour l'ouverture des listes — les filtres eux-mêmes fonctionnent sans
 * JavaScript.
 *
 * Desktop : ligne unique, listes en panneau sous le déclencheur.
 * Mobile : rangée à défilement horizontal, listes en feuille depuis le bas.
 */

type PanelName = 'categorie' | 'sous-categorie' | 'flags';

type FilterBarProps = {
  categories: ReadonlyArray<Category>;
  categorySlug: string | null;
  subcategorySlug: string | null;
  query: string;
  availableFlags: ReadonlyArray<string>;
  activeFlags: ReadonlyArray<string>;
};

export function FilterBar({
  categories,
  categorySlug,
  subcategorySlug,
  query,
  availableFlags,
  activeFlags,
}: FilterBarProps) {
  const [open, setOpen] = useState<PanelName | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(null);
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const activeCategory =
    categories.find((category) => category.slug === categorySlug) ?? null;
  const activeSubcategory =
    activeCategory?.subcategories.find(
      (subcategory) => subcategory.slug === subcategorySlug,
    ) ?? null;

  const base = { query, flags: activeFlags };

  function toggleFlagHref(flag: string): string {
    const next = activeFlags.includes(flag)
      ? activeFlags.filter((value) => value !== flag)
      : [...activeFlags, flag];
    return libraryHref({ categorySlug, subcategorySlug, query, flags: next });
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="-mx-22 flex gap-[9px] overflow-x-auto px-22 tablet:mx-0 tablet:flex-wrap tablet:overflow-visible tablet:px-0">
        <Trigger
          name="categorie"
          label="Catégorie"
          value={activeCategory?.name}
          open={open}
          setOpen={setOpen}
        />
        <Trigger
          name="sous-categorie"
          label="Sous-catégorie"
          value={activeSubcategory?.name}
          disabled={
            !activeCategory || activeCategory.subcategories.length === 0
          }
          open={open}
          setOpen={setOpen}
        />
        <Trigger
          name="flags"
          label="Flags"
          value={activeFlags.length ? `${activeFlags.length}` : undefined}
          disabled={availableFlags.length === 0}
          open={open}
          setOpen={setOpen}
        />
      </div>

      {open === 'categorie' ? (
        <Panel onClose={() => setOpen(null)} title="Catégorie">
          <OptionLink
            href={libraryHref({ ...base })}
            selected={!categorySlug}
            label="Toutes les catégories"
          />
          {categories.map((category) => (
            <OptionLink
              key={category.slug}
              href={libraryHref({ ...base, categorySlug: category.slug })}
              selected={category.slug === categorySlug}
              label={category.name}
            />
          ))}
        </Panel>
      ) : null}

      {open === 'sous-categorie' && activeCategory ? (
        <Panel onClose={() => setOpen(null)} title="Sous-catégorie">
          <OptionLink
            href={libraryHref({ ...base, categorySlug: activeCategory.slug })}
            selected={!subcategorySlug}
            label={`Tout ${activeCategory.name}`}
          />
          {activeCategory.subcategories.map((subcategory) => (
            <OptionLink
              key={subcategory.slug}
              href={libraryHref({
                ...base,
                categorySlug: activeCategory.slug,
                subcategorySlug: subcategory.slug,
              })}
              selected={subcategory.slug === subcategorySlug}
              label={subcategory.name}
            />
          ))}
        </Panel>
      ) : null}

      {open === 'flags' ? (
        <Panel onClose={() => setOpen(null)} title="Flags">
          <div className="flex flex-wrap gap-[7px] px-16 py-12">
            {availableFlags.map((flag) => (
              <FlagFilterLink
                key={flag}
                label={flag}
                href={toggleFlagHref(flag)}
                selected={activeFlags.includes(flag)}
              />
            ))}
          </div>
        </Panel>
      ) : null}

      {activeCategory || activeFlags.length > 0 ? (
        <div className="mt-12 flex flex-wrap items-center gap-[7px]">
          {activeCategory ? (
            <FlagFilterLink
              label={activeSubcategory?.name ?? activeCategory.name}
              href={
                activeSubcategory
                  ? libraryHref({ ...base, categorySlug: activeCategory.slug })
                  : libraryHref({ ...base })
              }
              selected
            />
          ) : null}
          {activeFlags.map((flag) => (
            <FlagFilterLink
              key={flag}
              label={flag}
              href={toggleFlagHref(flag)}
              selected
            />
          ))}
          {activeFlags.length > 1 ? (
            <span className="ml-[6px] font-mono text-mono uppercase tracking-[0.13em] text-help">
              logique OU
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Trigger({
  name,
  label,
  value,
  disabled = false,
  open,
  setOpen,
}: {
  name: PanelName;
  label: string;
  value?: string;
  disabled?: boolean;
  open: PanelName | null;
  setOpen: (panel: PanelName | null) => void;
}) {
  const isOpen = open === name;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-expanded={isOpen}
      onClick={() => setOpen(isOpen ? null : name)}
      className={cn(
        'inline-flex shrink-0 items-center gap-[8px] rounded-control border',
        'min-h-[44px] px-16 py-[11px] text-[13px] font-medium',
        'transition-colors duration-[150ms] ease-logos',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900',
        'disabled:cursor-not-allowed disabled:border-line disabled:text-disabled-text',
        value
          ? 'border-walnut-900 bg-surface text-walnut-900'
          : 'border-line-field bg-surface text-text hover:bg-cover-plate',
      )}
    >
      {label}
      {value ? <span className="text-[12px]">· {value}</span> : null}
      <span aria-hidden className="text-gold">
        {isOpen ? '↑' : '↓'}
      </span>
    </button>
  );
}

function Panel({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        'z-40 border border-line bg-surface',
        // Mobile : feuille depuis le bas. Desktop : panneau sous la rangée.
        'fixed inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-panel',
        'tablet:absolute tablet:inset-x-auto tablet:bottom-auto tablet:top-[52px]',
        'tablet:max-h-[420px] tablet:w-[360px] tablet:rounded-panel',
      )}
    >
      <div className="flex items-center justify-between border-b border-line-hairline px-16 py-12">
        <span className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-walnut-900">
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="grid size-[44px] place-items-center text-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900 tablet:size-[24px]"
        >
          <span aria-hidden>✕</span>
        </button>
      </div>
      {children}
    </div>
  );
}

function OptionLink({
  href,
  label,
  selected,
}: {
  href: string;
  label: string;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'flex min-h-[52px] items-center border-b border-line-hairline px-16 py-12',
        'text-[14px] transition-colors duration-[150ms] ease-logos',
        'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-walnut-900',
        'last:border-b-0 hover:bg-cover-plate',
        selected && 'font-semibold text-walnut-900',
      )}
    >
      {label}
    </Link>
  );
}
