import Link from 'next/link';

import { BrandMark } from '@/components/brand/BrandMark';
import { TopBanner } from '@/components/brand/TopBanner';
import { currentUser } from '@/lib/auth/session';
import { cn } from '@/lib/cn';

import { MobileMenu } from './MobileMenu';
import { SignOutButton } from './SignOutButton';
import { ACCOUNT_ITEM, ACCOUNT_LABEL_SIGNED_IN, NAV_ITEMS } from './nav-items';

/*
 * Header : bandeau noyer + filet doré, puis barre de 76 px (60 px mobile).
 * Fond `--surface`, bordure basse `.12`. PAS de header collant.
 * Bascule vers le hamburger sous 900 px.
 *
 * Le header lit LUI-MÊME la session : aucune page n'a plus à lui dire si son
 * visiteur est connecté, et le libellé de compte ne peut donc plus mentir sur
 * une page publique. La lecture passe par `currentUser`, seul point d'entrée
 * de `lib/auth` — le rôle est relu en base, jamais dans un jeton.
 *
 * ⚠️ Le point ouvert « T » reste entier : « Mon compte » n'est pas un lien,
 * faute de destination tranchée. Voir `nav-items.ts`.
 */
export async function Header({ currentPath }: { currentPath?: string }) {
  const user = await currentUser();
  const signedIn = user !== null;

  return (
    <header className="border-b border-line bg-surface">
      <TopBanner />
      <div className="mx-auto flex h-[60px] max-w-content items-center justify-between px-22 tablet:h-[76px] tablet:px-26 desktop:px-44">
        <Link
          href="/"
          aria-label="Logos — accueil"
          className="focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-walnut-900"
        >
          {/* Les deux tailles sont portées par des enveloppes : `BrandMark`
              pose déjà `inline-flex`, et une classe `hidden` posée sur le
              même élément ne l'emporterait pas de façon fiable. */}
          <span className="tablet:hidden">
            <BrandMark size="sm" />
          </span>
          <span className="hidden tablet:block">
            <BrandMark size="md" />
          </span>
        </Link>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-[30px] text-[13.5px] font-medium nav:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'transition-colors duration-[150ms] ease-logos',
                  'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-walnut-900',
                  active
                    ? 'border-b-2 border-walnut-900 pb-[3px] text-walnut-900'
                    : 'hover:text-walnut-900',
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {signedIn ? (
            <>
              <span className="text-help">{ACCOUNT_LABEL_SIGNED_IN}</span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href={ACCOUNT_ITEM.href}
              className="rounded-control border border-line-field px-16 py-[8px] transition-colors duration-[150ms] ease-logos hover:bg-cover-plate focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-walnut-900"
            >
              {ACCOUNT_ITEM.label}
            </Link>
          )}
        </nav>

        <MobileMenu
          items={signedIn ? NAV_ITEMS : [...NAV_ITEMS, ACCOUNT_ITEM]}
          currentPath={currentPath}
          accountLabel={signedIn ? ACCOUNT_LABEL_SIGNED_IN : undefined}
          action={signedIn ? <SignOutButton /> : undefined}
        />
      </div>
    </header>
  );
}
