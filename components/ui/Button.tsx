import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/*
 * Un seul bouton primaire par zone de décision.
 * Aucune ombre : les boutons ont une bordure ou un aplat, jamais d'ombre.
 * Le doré ne porte une action que dans un seul cas : le primaire sur noyer.
 *
 * Couleur et gabarit sont séparés : deux classes Tailwind réglant la même
 * propriété sur un même élément ne s'ordonnent pas de façon fiable.
 */

export type ButtonVariant =
  | 'primary'
  | 'primaryOnWalnut'
  | 'secondary'
  | 'secondaryOnWalnut'
  | 'tertiary';

const BASE =
  'inline-flex items-center justify-center rounded-control font-sans ' +
  'transition-colors duration-[150ms] ease-logos ' +
  'focus-visible:outline-2 focus-visible:outline-offset-[3px] ' +
  'disabled:cursor-not-allowed';

/** Couleurs et bordures — aucune métrique. */
const TONES: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-burgundy text-on-dark font-semibold',
    'hover:bg-burgundy-hover active:bg-burgundy-active',
    'focus-visible:outline-burgundy',
    'disabled:opacity-[.38] disabled:hover:bg-burgundy',
  ),
  primaryOnWalnut: cn(
    'bg-gold text-walnut-900 font-semibold',
    'hover:bg-gold-hover',
    'focus-visible:outline-gold',
    'disabled:opacity-[.38] disabled:hover:bg-gold',
  ),
  secondary: cn(
    'border border-line-secondary bg-transparent text-text font-medium',
    'hover:border-line-secondary-hover hover:text-burgundy',
    'active:bg-cover-plate',
    'focus-visible:outline-burgundy',
    'disabled:border-line disabled:text-disabled-text',
  ),
  secondaryOnWalnut: cn(
    'border border-line-on-dark bg-transparent text-on-dark font-medium',
    'hover:border-on-dark',
    'focus-visible:outline-gold',
    'disabled:opacity-[.38]',
  ),
  tertiary: cn(
    'font-semibold text-burgundy underline underline-offset-4',
    'hover:text-burgundy-light',
    'focus-visible:outline-burgundy focus-visible:outline-offset-2',
  ),
};

/** Métriques — aucune couleur. */
const METRICS: Record<ButtonVariant, string> = {
  primary: 'min-h-[52px] px-[34px] py-[17px] text-ui',
  primaryOnWalnut: 'min-h-[52px] px-[30px] py-[16px] text-ui',
  secondary: 'min-h-[52px] px-[34px] py-[17px] text-ui',
  secondaryOnWalnut: 'min-h-[52px] px-[30px] py-[17px] text-ui',
  tertiary: 'text-[13.5px]',
};

/** Gabarit mobile : pleine largeur, empilé, hauteur minimale 48 px. */
const FULL_WIDTH_METRICS =
  'w-full min-h-[48px] px-[16px] py-[15px] text-[13.5px]';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

/** Classes du bouton, réutilisables pour un lien qui doit en avoir l'aspect. */
export function buttonClassName(
  variant: ButtonVariant = 'primary',
  fullWidth = false,
  className?: string,
): string {
  const full = fullWidth && variant !== 'tertiary';
  return cn(
    BASE,
    TONES[variant],
    full ? FULL_WIDTH_METRICS : METRICS[variant],
    className,
  );
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, fullWidth, className)}
      {...props}
    />
  );
}
