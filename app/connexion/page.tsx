import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BrandMark } from '@/components/brand/BrandMark';
import { TopBanner } from '@/components/brand/TopBanner';
import { currentUser, safeReturnPath } from '@/lib/auth/session';

import { LoginForm } from './LoginForm';

/*
 * Connexion — gabarit du Design System : bandeau, header réduit au logo,
 * panneau centré de 420 px, et une ligne d'information.
 *
 * PAS D'INSCRIPTION PUBLIQUE. Aucun lien de création de compte n'existe, et
 * l'inscription doit rester désactivée dans la configuration Supabase Auth :
 * l'absence de formulaire n'est pas une protection.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Connexion — Logos',
  robots: { index: false, follow: false },
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.suivant)
    ? params.suivant[0]
    : params.suivant;
  const returnPath = safeReturnPath(raw);

  /* Déjà connecté : la page de connexion n'a plus d'objet. */
  const user = await currentUser();
  if (user) redirect(returnPath ?? '/');

  return (
    <>
      <header className="border-b border-line bg-surface">
        <TopBanner />
        <div className="mx-auto flex h-[60px] max-w-content items-center px-22 tablet:h-[76px] tablet:px-26 desktop:px-44">
          <Link
            href="/"
            aria-label="Logos — accueil"
            className="focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-walnut-900"
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

      <main className="flex min-h-[calc(100vh-76px)] items-start justify-center px-22 py-44 tablet:px-26 tablet:py-56">
        {/* Panneau centré de 420 px — surface encadrée, sans accent latéral. */}
        <div className="w-full max-w-login rounded-panel border border-line bg-surface px-[26px] py-[28px]">
          <h1 className="font-display text-h2-mobile tablet:text-h2">
            Connexion
          </h1>
          <p className="mt-[8px] text-body text-text-secondary">
            Réservée aux serviteurs et aux administrateurs du diocèse.
          </p>

          <div className="mt-22">
            <LoginForm returnPath={returnPath} />
          </div>

          <p className="mt-16 text-[12px] leading-[1.6] text-help">
            Les comptes sont créés par le diocèse ; il n&apos;y a pas
            d&apos;inscription publique.
          </p>
        </div>
      </main>
    </>
  );
}
