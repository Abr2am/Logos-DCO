import Link from 'next/link';

import { BrandMark } from '@/components/brand/BrandMark';
import { TopBanner } from '@/components/brand/TopBanner';
import { cn } from '@/lib/cn';

import { MobileMenu } from './MobileMenu';
import { DEFAULT_ACCOUNT_ITEM, NAV_ITEMS, type NavItem } from './nav-items';

/*
 * Header : bandeau noyer + filet doré, puis barre de 76 px (60 px mobile).
 * Fond `--surface`, bordure basse `.12`. PAS de header collant.
 * Bascule vers le hamburger sous 900 px.
 */
export function Header({
  currentPath,
  account = DEFAULT_ACCOUNT_ITEM,
}: {
  currentPath?: string;
  /** Entrée de compte ; « Connexion » tant que l'utilisateur n'est pas connecté. */
  account?: NavItem;
}) {
  const items: ReadonlyArray<NavItem> = [...NAV_ITEMS, account];

  return (
    <header className="border-b border-line bg-surface">
      <TopBanner />
      <div className="mx-auto flex h-[60px] max-w-content items-center justify-between px-20 tablet:h-[76px] tablet:px-26 desktop:px-44">
        <Link
          href="/"
          aria-label="Logos — accueil"
          className="focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-burgundy"
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
                  'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-burgundy',
                  active
                    ? 'border-b-2 border-burgundy pb-[3px] text-burgundy'
                    : 'hover:text-burgundy',
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href={account.href}
            className="rounded-control border border-line-field px-16 py-[8px] transition-colors duration-[150ms] ease-logos hover:bg-cover-plate focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-burgundy"
          >
            {account.label}
          </Link>
        </nav>

        <MobileMenu items={items} currentPath={currentPath} />
      </div>
    </header>
  );
}
