import Link from 'next/link';

import { BrandMark } from '@/components/brand/BrandMark';
import { TopBanner } from '@/components/brand/TopBanner';

/*
 * En-tête réduit : bandeau noyer, filet doré, marque — sans navigation.
 *
 * Il existe parce que deux pages ne peuvent pas rendre le `Header` complet :
 *
 *   - `app/not-found.tsx`, que Next rend hors de tout contexte de requête et
 *     qui ne peut donc pas lire la session ;
 *   - `app/error.tsx`, qui est une frontière CLIENT et ne peut donc pas
 *     rendre un composant serveur asynchrone.
 *
 * Le bandeau noyer reste là : c'est la signature architecturale du produit,
 * présente en tête de CHAQUE page — une page d'erreur comprise.
 */
export function MinimalHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <TopBanner />
      <div className="mx-auto flex h-[60px] max-w-content items-center px-22 tablet:h-[76px] tablet:px-26 desktop:px-44">
        <Link
          href="/"
          aria-label="Logos — accueil"
          className="focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-burgundy"
        >
          <span className="tablet:hidden">
            <BrandMark size="sm" />
          </span>
          <span className="hidden tablet:block">
            <BrandMark size="md" />
          </span>
        </Link>
      </div>
    </header>
  );
}
