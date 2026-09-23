/**
 * Familles de couverture du système génératif.
 *
 * Une couverture est calculée à partir de trois données : la catégorie
 * (surtitre), le titre, et un index stable qui choisit la famille.
 *
 * ⚠️ Règle verrouillée du Design System : **une famille ne représente jamais
 * une catégorie**. Aucune correspondance couleur ↔ thème ne doit exister ;
 * la catégorie n'est exprimée que par le texte (surtitre et métadonnées).
 */
export const COVER_FAMILIES = [
  'plate',
  'ivory',
  'marquetry',
  'motif',
  'minimal',
] as const;

export type CoverFamily = (typeof COVER_FAMILIES)[number];

/**
 * Sélection déterministe d'une famille à partir d'une clé stable
 * (l'identifiant de la ressource). Même clé ⇒ même famille, partout.
 *
 * ⚠️ POINT OUVERT « N » — non tranché.
 * Le Design System impose à la fois ce déterminisme par identifiant ET des
 * contraintes de rythme par rangée de 4 (au plus 2 sombres, au plus 1 à motif,
 * jamais deux minimales côte à côte, au plus 1 rosace sur 5). Les deux règles
 * ne sont pas conciliables en général : deux ressources voisines dans une
 * grille filtrée peuvent violer le rythme.
 *
 * Cette fonction n'implémente que le déterminisme, qui est le comportement
 * neutre. `ResourceCover` accepte par ailleurs une famille explicite, afin
 * qu'un futur arbitrage puisse corriger le rythme au niveau de la rangée sans
 * modifier le composant.
 */
export function coverFamilyFromKey(key: string): CoverFamily {
  // FNV-1a 32 bits — stable, sans dépendance, indépendant de la plateforme.
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return COVER_FAMILIES[hash % COVER_FAMILIES.length] as CoverFamily;
}
