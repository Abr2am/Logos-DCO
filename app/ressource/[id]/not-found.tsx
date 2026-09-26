import Link from 'next/link';

import { Header } from '@/components/layout/Header';
import { Panel } from '@/components/ui/Panel';

/*
 * Une ressource inexistante, non publiée ou archivée aboutit ici — avec un
 * statut 404 dans les trois cas. Rien ne permet de les distinguer.
 *
 * Le message est celui du Design System. Le point ouvert « P » — page dédiée
 * ou 404 pour une ressource archivée — n'est pas tranché : le statut HTTP
 * reste 404, qui est l'exigence de confidentialité, et le contenu est celui
 * que le Design System prévoit déjà.
 */
export default function RessourceIntrouvable() {
  return (
    <>
      <Header currentPath="/bibliotheque" />

      <main className="mx-auto max-w-content px-22 py-44 tablet:px-26 desktop:px-44">
        <Panel accent="walnut" className="max-w-reading">
          <h1 className="font-display text-[20px] leading-[1.2] tablet:text-[24px]">
            Cette ressource n&apos;est pas disponible
          </h1>
          <p className="mt-12 text-body text-text-secondary">
            Elle a peut-être été archivée. Vous pouvez revenir à la
            bibliothèque.
          </p>
          <Link
            href="/bibliotheque"
            className="mt-16 inline-block text-[13.5px] font-semibold text-walnut-900 underline underline-offset-4 hover:text-walnut-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-900"
          >
            Revenir à la bibliothèque
          </Link>
        </Panel>
      </main>
    </>
  );
}
