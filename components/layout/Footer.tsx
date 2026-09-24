/*
 * Pied de page — aplat noyer surmonté d'un filet doré, en pied de CHAQUE page.
 *
 * Le Design System ne compose « Bande de contribution / pied » qu'en un seul
 * composant : « aplat noyer, sans texture ». Sur l'accueil, les deux se
 * suivent et ne forment donc qu'une seule zone noyer — le plafond de deux
 * zones par écran reste tenu sur toutes les pages.
 *
 * ⚠️ Le verset de 2 Timothée 3:16 y figure comme dans le hero — en italique,
 * sa référence juste en dessous sans italique —, mais dans le corps de texte
 * courant du pied : c'est le même texte, ce n'est pas le même style, et le
 * verrou du Design System reste respecté.
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
        <p className="mt-12 italic text-body-mobile tablet:text-body">
          Toute Écriture est inspirée de Dieu, et utile pour enseigner, pour
          convaincre, pour corriger, pour instruire dans la justice.
        </p>
        <p className="mt-[4px] text-body-mobile tablet:text-body">
          2 Timothée 3:16
        </p>
      </div>
    </footer>
  );
}
