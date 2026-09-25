'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { BrandMark } from '@/components/brand/BrandMark';
import { cn } from '@/lib/cn';

import type { NavItem } from './nav-items';

/*
 * Menu plein écran, ouverture en 200 ms, fond `--surface`, entrées Archivo 500
 * à 16 px séparées par des hairlines, hauteur de ligne tactile ≥ 52 px.
 *
 * Le menu piège le focus, se ferme à Échap et au choix d'une entrée.
 * Cible tactile du déclencheur : 44 × 44.
 *
 * « Aucune navigation basse : décision produit, ne pas réintroduire. »
 */
export function MobileMenu({
  items,
  currentPath,
  action,
}: {
  /**
   * Entrées de la barre, compte compris : « Mon compte » est une entrée comme
   * une autre depuis qu'elle mène à `/compte` (25/09/2026).
   */
  items: ReadonlyArray<NavItem>;
  currentPath?: string;
  /** Action de compte posée sous les entrées (ex. : déconnexion). */
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('a, button')?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const focusables = panel.querySelectorAll<HTMLElement>('a, button');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="menu-principal"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        onClick={() => setOpen((value) => !value)}
        className="-mr-[10px] grid size-[44px] place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900 nav:hidden"
      >
        {open ? (
          <span aria-hidden className="text-[18px] leading-none">
            ✕
          </span>
        ) : (
          <span aria-hidden className="flex flex-col gap-[4px]">
            <span className="block h-[1.5px] w-[20px] bg-text" />
            <span className="block h-[1.5px] w-[20px] bg-text" />
            <span className="block h-[1.5px] w-[20px] bg-text" />
          </span>
        )}
      </button>

      {open ? (
        <div
          id="menu-principal"
          ref={panelRef}
          className="fixed inset-0 z-50 flex flex-col bg-surface nav:hidden"
        >
          <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-[rgb(36_24_16/0.1)] px-22">
            <BrandMark size="sm" />
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="-mr-[10px] grid size-[44px] place-items-center text-[18px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          <nav aria-label="Navigation principale" className="px-22 pt-[8px]">
            <ul>
              {items.map((item, index) => {
                const active = currentPath === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-[52px] items-center py-[17px] text-[16px] font-medium',
                        'active:bg-cover-plate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900',
                        index < items.length - 1 &&
                          'border-b border-[rgb(36_24_16/0.08)]',
                        active && 'text-walnut-900',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {action ? <div className="pt-16">{action}</div> : null}
            <div
              aria-hidden
              className="mt-[8px] h-px bg-[rgb(195_154_84/0.6)]"
            />
          </nav>
        </div>
      ) : null}
    </>
  );
}
