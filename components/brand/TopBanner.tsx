/**
 * Bandeau noyer surmonté d'un filet doré, en tête de chaque page.
 *
 * « C'est la signature architecturale du produit, présente sur toutes les
 * pages. » 5 px desktop, 4 px mobile. Aplat, sans texture.
 */
export function TopBanner() {
  return (
    <div
      aria-hidden
      className="h-[4px] border-b border-gold bg-walnut-900 tablet:h-[5px]"
    />
  );
}
