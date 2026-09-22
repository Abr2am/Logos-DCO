/*
 * Pied de page — aplat noyer surmonté d'un filet doré, en pied de CHAQUE page.
 *
 * Le Design System ne compose « Bande de contribution / pied » qu'en un seul
 * composant : « aplat noyer, sans texture ». Sur l'accueil, les deux se
 * suivent et ne forment donc qu'une seule zone noyer — le plafond de deux
 * zones par écran reste tenu sur toutes les pages.
 *
 * ⚠️ La signature « Une même foi, pour aujourd'hui et pour demain. » est
 * réservée au hero dans son style propre (Bodoni italique 22 px). Elle
 * figure ici en Archivo courant : c'est la même phrase, ce n'est pas le
 * même style, et le verrou du Design System reste respecté.
 *
 * Aucun lien, aucune colonne, aucune mention légale : le pied dit qui publie,
 * et rien d'autre.
 */
export function Footer() {
  return (
    <footer className="border-t border-gold bg-walnut-900 text-on-dark">
      <div className="mx-auto max-w-content px-22 py-26 tablet:px-26 tablet:py-34 desktop:px-44">
        <p className="font-mono text-mono font-medium uppercase tracking-[0.13em] text-gold-overline">
          Diocèse Copte Orthodoxe de Paris
        </p>
        <p className="mt-12 text-body-mobile tablet:text-body">
          Logos — Une même foi, pour aujourd&apos;hui et pour demain.
        </p>
      </div>
    </footer>
  );
}
