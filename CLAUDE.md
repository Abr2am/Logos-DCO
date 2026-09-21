# Logos — règles permanentes du projet

Bibliothèque numérique de ressources de catéchisme du **Diocèse Copte
Orthodoxe de Paris**.

> Une même foi, pour aujourd'hui et pour demain.

## Sources de vérité

| Document                              | Rôle                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `docs/LOGOS_Cahier_des_charges_V1.md` | **Source de vérité produit.** Prime sur toute autre considération.                                       |
| `docs/Logos - Design System V2.html`  | **Référence visuelle et UI.** Document bundlé : le contenu réel est dans le script `__bundler/template`. |

Ces deux documents ne se contredisent pas. En cas de doute sur le **quoi**,
c'est le cahier des charges ; sur le **comment ça se présente**, c'est le
Design System.

**Ne jamais réinventer une décision déjà tranchée dans ces documents.**
Si un point n'est pas explicitement tranché, le signaler — ne pas décider
silencieusement (voir « Points ouverts »).

---

## Principes produit

Simplicité · qualité éditoriale · recherche efficace · transmission ·
contribution communautaire · **validation humaine**.

> Quand un choix oppose « plus de fonctionnalités » à « plus de simplicité »,
> privilégier la simplicité — sauf si la fonctionnalité est explicitement
> définie dans le cahier des charges.

L'identité visuelle est celle d'une **bibliothèque contemporaine inspirée du
patrimoine copte**, jamais celle d'un site paroissial traditionnel.
Environ **80 % contemporain / 20 % héritage copte**.

---

## Rôles et permissions

|                                                                | PUBLIC (sans compte) |     SERVANT      | ADMIN |
| -------------------------------------------------------------- | :------------------: | :--------------: | :---: |
| Consulter, rechercher, télécharger une ressource **PUBLISHED** |          ✅          |        ✅        |  ✅   |
| Poser une question                                             |          ✅          |        ✅        |  ✅   |
| Soumettre une ressource                                        |          ❌          |        ✅        |  ✅   |
| Voir **ses** contributions et leurs statuts                    |          ❌          |        ✅        |  ✅   |
| Corriger et resoumettre une ressource « À corriger »           |          ❌          | ✅ (les siennes) |  ✅   |
| **Publier**                                                    |          ❌          |  **❌ jamais**   |  ✅   |
| Voir toutes les ressources, tous statuts                       |          ❌          |        ❌        |  ✅   |
| Voir l'identité et l'e-mail du dépositaire                     |          ❌          |        ❌        |  ✅   |
| Voir l'identité et l'e-mail du questionneur                    |          ❌          |        ❌        |  ✅   |
| Modifier / demander corrections / archiver                     |          ❌          |        ❌        |  ✅   |
| Modérer questions et réponses                                  |          ❌          |        ❌        |  ✅   |

`User.role` ne connaît que `SERVANT` et `ADMIN`. PUBLIC = absence de compte,
ce n'est pas un rôle en base.

Le serviteur est **enregistré techniquement mais jamais affiché publiquement
comme auteur**. Le dépositaire d'origine reste le dépositaire même après
modification par un administrateur.

---

## Routes — liste fermée

**Public**

- `/` — Accueil (éditorial, pas une seconde bibliothèque)
- `/bibliotheque` — Bibliothèque (page d'exploration)
- `/bibliotheque/[categorie]` — Branche de catégorie
- `/bibliotheque/[categorie]/[sous-categorie]` — Branche de sous-catégorie
- `/ressource/[id]` — Fiche ressource
- `/connexion` — Connexion (**sans inscription publique**)

**Serviteur**

- `/partager` — Partager un cours
- `/mes-contributions` — Mes contributions

**Administration**

- `/admin` — Dashboard
- `/admin/ressources/[id]` — Modération d'une ressource

**Interdits :** `/categories` (page d'index indépendante) · `/admin/flags`.

Les routes techniques sous `/api/` ne sont pas des pages : elles ne figurent
pas dans cette liste. À ce jour, une seule existe —
`/api/telechargement/[id]`, qui délivre le fichier d'une ressource publiée.

> Les routes de branche `/bibliotheque/[categorie]` et
> `/bibliotheque/[categorie]/[sous-categorie]` sont une **décision validée**
> (audit du 21/09/2026) : le cahier des charges impose le parcours
> `Bibliothèque → Saints → ressources` sans en fixer l'URL. Elles ne
> constituent pas une page Catégories indépendante.

---

## Bibliothèque

**Neuf catégories, exactement — ne jamais en ajouter, renommer ou retirer :**

1. Bible
2. Dogme
3. Histoire de l'Église
4. Rites & Liturgie
5. Spiritualité
6. Saints
7. Vie chrétienne
8. Formation des serviteurs
9. Divers

**Sous-catégories uniquement sous « Vie chrétienne » :** Petite enfance ·
Jeunesse · Famille.

Une ressource possède **un seul emplacement**. Jamais de duplication entre
catégories. Les autres chemins de découverte passent uniquement par les flags.

Ordre des blocs de la page Bibliothèque : **recherche → filtres → catégories**.
Elle n'affiche pas immédiatement toutes les ressources.

**Tri** — décision validée (point `B`, tranché le 21/09/2026) : les ressources
sont présentées par **date de publication décroissante**, de la plus récente à
la plus ancienne. Lorsqu'une recherche textuelle est active, la pertinence
prime et la date départage les résultats de même rang. L'ordre est porté par
`search_published_resources` : aucun tri côté application.

**Pagination** — décision validée (point `A`, tranché le 21/09/2026) : **aucune
pagination**. Pas de « Voir plus », pas de pagination numérotée, pas de limite
de résultats. Ne pas en introduire.

---

## Flags

**Texte libre propre à chaque ressource. Ce n'est pas un référentiel.**

- Minimum **5 obligatoires** à la soumission.
- Aucune liste prédéfinie, aucune suggestion, aucune validation préalable.
- L'administrateur peut ajouter, corriger ou supprimer des flags pendant la
  modération.
- **Aucun écran de gestion, aucun workflow de validation, aucune taxonomie
  centrale.**

Plusieurs flags sélectionnés en filtre = logique **OU**.

---

## Recherche

Textuelle, sur : titre · description · catégorie · sous-catégorie · flags.
PostgreSQL uniquement.

Deux portées seulement : **globale** et **limitée à une branche**.

**Insensible aux accents** — décision validée (point `Q`, tranché le
21/09/2026) : « eglise » doit trouver « Église ». Le vecteur et les requêtes
emploient la configuration `public.logos_french`, qui enchaîne `unaccent` avant
`french_stem`. **Toujours interroger avec cette configuration** : une requête
en `french` produirait des lexèmes accentués qui ne correspondraient à rien.

**Interdits :** recherche dans le contenu des fichiers · sémantique · IA ·
vectoriel · embeddings · Elasticsearch · autocomplétion · recherche avancée.

---

## Ressource

**Champs :** Titre\* · Description\* (1 à 3 phrases) · Fichier\* · Catégorie\* ·
Sous-catégorie (si applicable) · Public\* (multi-sélection) · Type\* ·
Flags\* (min. 5) · Date de publication (auto) · Dépositaire (interne).

**Publics (8) :** Petite enfance · Enfants · Adolescents · Jeunes adultes ·
Adultes · Familles · Serviteurs · Tous les publics.

**Types (7) :** Cours / présentation · Fiche pédagogique · Activité · Jeu ·
Support de séance · Document · Autre.

**Formats (7) :** PDF · DOC · DOCX · PPT · PPTX · XLS · XLSX.
Aucun exécutable, aucune archive (ZIP/EXE).

---

## Workflow de publication

```
DRAFT → PENDING → PUBLISHED → ARCHIVED
PENDING → REJECTED (« À corriger ») → PENDING
```

`DRAFT` reste un état technique interne, sans fonctionnalité brouillon avancée.

**Le serviteur ne publie jamais directement.** Cette règle doit être appliquée
en base (contraintes / triggers), pas seulement dans l'interface.

Demander des corrections exige un **commentaire obligatoire**, affiché au
serviteur dans « Mes contributions ».

---

## Questions

Rattachées à une ressource. **Ce n'est pas une messagerie.**

- Le questionneur n'a **pas besoin de compte** : question + adresse e-mail.
- Son e-mail **n'est jamais communiqué au dépositaire** — y compris dans les
  en-têtes d'un e-mail de notification.
- L'identité du dépositaire reste **cachée au questionneur**.
- L'administration voit tout.

> **Anonymat entre utilisateurs, transparence pour l'administration.**

Pas de fil de discussion, pas de réponses multiples, pas de mentions.

---

## Sécurité — invariants non négociables

La sécurité vit dans **PostgreSQL et Storage**, jamais dans un composant React.
Toute règle ci-dessous doit rester vraie pour quelqu'un qui appelle l'API
directement, sans passer par l'interface.

1. **RLS activée sur toutes les tables**, sans exception. Le rôle anonyme n'a
   aucun `SELECT` par défaut.
2. Le public ne voit **que** les ressources `PUBLISHED`. Une ressource
   `PENDING`, `REJECTED` ou `ARCHIVED` est inaccessible **même en connaissant
   son identifiant**.
   Décision validée (point `P`, tranché le 21/09/2026) : une ressource
   `ARCHIVED` est **publiquement indistinguable d'une ressource inexistante**
   et répond **404** — fiche comme téléchargement. Ne jamais introduire de
   réponse, de message ou de statut qui permettrait de distinguer les deux
   cas.
3. **Les fichiers sont protégés au niveau du stockage**, pas masqués dans
   l'interface. Bucket privé, téléchargement par URL signée de courte durée
   délivrée par une route serveur qui vérifie le statut.
   Mécanisme **arrêté** (validé le 21/09/2026) : il est conservé tel quel. Le
   chemin de stockage figure dans l'URL signée — c'est inhérent au procédé —
   mais il n'est ni devinable, ni réutilisable passé le délai, ni exposé dans
   la page ou dans la surface publique. Ne pas le remplacer par un flux servi
   depuis le serveur sans nouvelle décision.
4. **Aucune inscription publique.** Désactivée dans la configuration
   d'authentification, pas seulement absente de l'interface.
5. Le `role` n'est **jamais** modifiable par le client.
6. `depositor_id` n'est **jamais** joint à la table des utilisateurs dans une
   requête publique.
7. `questioner_email` n'est **jamais** exposé. La RLS PostgreSQL est au niveau
   de la ligne, pas de la colonne : le masquage passe par une **vue** dédiée,
   pas par une requête prudente côté application.
8. La clé `service_role` n'est jamais préfixée `NEXT_PUBLIC_` et n'apparaît
   que dans du code serveur.
9. La séparation SERVANT / ADMIN est vérifiée côté serveur, jamais par un
   simple masquage de bouton.
10. Validation des téléversements côté serveur : liste blanche d'extensions
    **et** de types MIME, limite de taille, nom de fichier généré, service en
    `Content-Disposition: attachment`.
    ⚠️ PPTX, DOCX et XLSX **sont** des conteneurs ZIP : ne pas les rejeter par
    une détection générique « c'est une archive ».
11. L'architecture d'authentification reste **isolée et remplaçable**
    (`lib/auth/`), pour pouvoir passer au SSO / OIDC du diocèse sans
    reconstruire l'application.

Chaque policy RLS s'écrit **en même temps que sa table**, avec ses tests
négatifs. La sécurité n'est jamais rattrapée à la fin.

### Surface publique — liste fermée

Le rôle anonyme n'a **aucun accès aux tables**. Il ne voit que la taxonomie et
trois vues, dont le filtre et la liste de colonnes sont internes :
`published_resources`, `published_resource_flags`, `published_resource_files`.

Toute donnée à exposer publiquement passe par ces vues. **Ne jamais accorder au
rôle anonyme un accès direct à une table** : la RLS est au niveau de la ligne,
pas de la colonne, et autoriser la ligne exposerait `depositor_id`,
`admin_comment` ou `storage_path`.

Vérification : `npm run db:verify` — migrations appliquées sur une base
jetable, puis tests de schéma et tests de sécurité négatifs.

---

## Design System — verrous

**8 tokens de couleur · 3 familles typographiques · 1 échelle d'espacement ·
3 rayons · 2 ombres · 2 durées.** Tout est dans `styles/tokens.css`.

**Répartition de surface imposée :** ivoire ≈ 82 % · bordeaux ≤ 12 % ·
noyer ≤ 6 % · doré en filet uniquement.

- **Aucune couleur d'état** : pas de rouge d'erreur, pas de vert de succès,
  pas d'orange. Erreur = bordeaux + « ! » textuel ; succès = bordeaux + filet
  doré ; attente = doré.
- **Aucune couleur par catégorie.** Les neuf thèmes partagent exactement le
  même traitement.
- **Aucun bleu, aucun vert.**
- **Ombres réservées aux couvertures.** Cartes, panneaux, champs et boutons
  ont une bordure, jamais une ombre.
- **Rayons :** 3 px contrôles · 4 px panneaux · **0 couvertures, bandeaux et
  tablettes** (un livre a des angles vifs). Jamais d'arrondi complet, sauf la
  pastille de rosace.
- **Flags : rectangle 3 px, jamais de forme « pill »**, jamais de couleur
  propre à un mot-clé.
- **Bandeau noyer 4-5 px + filet doré** en tête de chaque page : c'est la
  signature architecturale du produit.
- **Motion :** 150 ms (survols) / 200 ms (menu, listes), courbe
  `cubic-bezier(.2,.6,.3,1)`. Aucun déplacement de plus de 2 px, aucune mise à
  l'échelle, aucune animation d'entrée au défilement, aucun toast, aucun
  skeleton animé.
- **Statuts** (En attente / Publiée / À corriger / Archivée) n'apparaissent
  **que** dans « Mes contributions » et l'administration, jamais dans la
  bibliothèque publique.
- **Carte ressource :** couverture, titre, et une seule ligne
  `type · format · pagination`. Rien d'autre — ni auteur, ni date, ni public,
  ni flags, ni bouton.
- **Carte thème :** aucun compteur de ressources.
- **Couvertures génératives**, calculées depuis catégorie + titre + index
  stable. Aucune image téléversée. **Une famille de couverture ne représente
  jamais une catégorie** : aucune correspondance couleur ↔ thème.

### Rosace — 4 usages seulement

Marque (pastille 22-40 px) · Hero (une occurrence, ≥ 200 px) · Couverture
(filigrane ≤ 26 %, au plus 1 sur 5) · État vide (pastille dorée 34 px).

**Interdits :** déformation, recadrage en fragment, redessin, motif répété,
usage comme icône fonctionnelle, rotation, contour tracé, version mono-trait.

### Bois / noyer — liste fermée

Bandeau · en-tête de catégorie · panneau de hero (mobile) · tablette · plat de
couverture famille 03 · bande de contribution et pied.

**Interdits :** texture sous un paragraphe, fond de page, motif répété, bois
derrière un champ, **plus de deux zones noyer par écran**, dégradé bois.

> Le patrimoine passe d'abord par la **géométrie** : symétrie, cadres en
> retrait, filets, rythme des panneaux, tranches de couvertures. Aucune croix,
> icône, bougie, plante ou objet liturgique n'entre dans l'interface —
> l'identité doit rester reconnaissable une fois tout symbole retiré.

### Accessibilité

Focus toujours visible, jamais supprimé (contour 2 px bordeaux, doré sur
noyer). Cibles tactiles 44 × 44 minimum, boutons 48 px en mobile. Chaque champ
a un `<label>` lié. Les erreurs sont annoncées par `aria-describedby` et ne
reposent jamais sur la seule couleur. Contraste du texte courant ≥ 7:1.

### Responsive

Mobile < 640 (2 ressources par ligne) · Tablette 640-1023 (3 par ligne) ·
Desktop ≥ 1024 (3 ou 4 par ligne). Bascule vers le hamburger sous 900 px.
**Aucune barre de navigation permanente en bas** — décision produit.

---

## Règle anti-régression

**Ne jamais introduire spontanément :**

favoris · likes · notes / ratings · commentaires publics · auteur public ·
durée · vidéo · filtre Public · filtre Type · recherche avancée · recherche
dans les fichiers · recherche sémantique ou IA · gestion centrale des flags ·
page de gestion des flags · page Catégories indépendante · multi-emplacement ·
multi-paroisses · messagerie générale · inscription publique · publication
directe par un serviteur · wizard de soumission · statistiques fictives ·
catégories supplémentaires · palette bleue ou verte · décoration religieuse
excessive · microservices · Redis · Kubernetes · Elasticsearch.

Avant d'ajouter quoi que ce soit : **vérifier que c'est explicitement présent
dans le cahier des charges.** Si ce n'est pas le cas, ne pas l'ajouter.

---

## Points ouverts — ne pas trancher silencieusement

Ces points **n'ont pas été décidés**. Les signaler plutôt que de choisir.

| Réf. | Point                                                                                                                                                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C    | Parcours « mot de passe oublié »                                                                                                                                                                                                                      |
| D    | Navigation entre les deux écrans d'administration                                                                                                                                                                                                     |
| E    | Miniature extraite du fichier réel (1ʳᵉ page du PDF)                                                                                                                                                                                                  |
| F    | **Canal de réponse du dépositaire aux questions** — aucune route ni écran n'existe                                                                                                                                                                    |
| G    | Police de secours pour les caractères coptes / arabes                                                                                                                                                                                                 |
| H    | Favicon et vignette de partage                                                                                                                                                                                                                        |
| J    | Règle de « Tous les publics » combiné à d'autres publics                                                                                                                                                                                              |
| K    | **Écran de modération des questions** — aucun n'est défini                                                                                                                                                                                            |
| L    | Valeurs de `Question.status`                                                                                                                                                                                                                          |
| M    | **Service d'envoi des notifications par e-mail** — absent de la stack                                                                                                                                                                                 |
| N    | Couverture : déterminisme par identifiant _vs_ contraintes de rythme par rangée                                                                                                                                                                       |
| O    | Format d'optimisation de la rosace (SVG vectorisé / WebP multi-tailles)                                                                                                                                                                               |
| R    | Anti-spam du formulaire de question anonyme                                                                                                                                                                                                           |
| S    | Renommage du fichier du Design System (espaces dans le chemin)                                                                                                                                                                                        |
| T    | **Destination de l'entrée « Mon compte »** une fois connecté — aucune route de compte n'existe dans la liste fermée (le Design System indique seulement que le libellé bascule depuis « Connexion »). `Header` reçoit donc cette entrée en propriété. |

> **F, K et M forment un même trou fonctionnel** : le cycle
> question → notification → réponse décrit au §12 du cahier des charges n'a ni
> route, ni écran, ni service. À trancher avant l'étape 8.

---

## Stack et conventions

**Next.js (App Router) · React · TypeScript strict · Tailwind CSS ·
Supabase (PostgreSQL + Auth + Storage) · Vercel.**

- **Aucune bibliothèque de composants** (shadcn, MUI, etc.) : elle
  réintroduirait des rayons, ombres et couleurs interdits par le Design
  System. Les composants sont écrits à la main sur les tokens.
- Les palettes, échelles et rayons par défaut de Tailwind sont **désactivés**
  dans `styles/tokens.css`. `bg-blue-500`, `rounded-xl` ou `p-7` ne produisent
  aucune classe : l'anti-régression visuelle est mécanique.
- L'échelle d'espacement est nommée d'après ses valeurs en pixels
  (`p-22` = 22 px), car le Design System raisonne en pixels.
- **Pas de gestionnaire d'état, pas de data-fetching client** : l'URL porte
  l'état (les filtres et la recherche sont des `searchParams`).
- Le rendu est serveur par défaut ; `'use client'` seulement quand
  l'interactivité l'exige.
- **Next.js 16** : `params` et `searchParams` sont **asynchrones** (à attendre
  avant lecture). Voir `node_modules/next/dist/docs/` avant d'écrire du code
  qui s'en écarte.
- Deux classes Tailwind réglant la **même propriété** sur un même élément ne
  s'ordonnent pas de façon fiable (l'ordre du CSS prime sur l'ordre des
  classes). Séparer couleur et métrique, ou choisir l'une **ou** l'autre —
  jamais les deux (`cn('flex', cond && 'hidden')` est un bug).

### Structure

```
app/              routes (App Router)
components/       ui · brand · library · layout
lib/              auth · supabase · domain · search · cover
styles/           tokens du Design System
supabase/         migrations SQL + seed
public/brand/     rosace, marqueterie
docs/             cahier des charges + Design System
```

### Commandes

```bash
npm run dev           # serveur de développement
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run build         # build de production
npm run format:check  # Prettier (vérification)
```

Avant tout commit : `npm run lint && npm run typecheck && npm run build`.

---

## Plan de développement

| #   | Étape                                              | État    |
| --- | -------------------------------------------------- | ------- |
| 1   | Initialisation technique                           | ✅      |
| 2   | Fondations visuelles (tokens, polices, primitives) | ✅      |
| 3   | Modèle de données + Supabase + RLS                 | ✅      |
| 4   | Bibliothèque publique                              | ✅      |
| 5   | Fiche ressource + téléchargement sécurisé          | ✅      |
| 6   | Authentification + espace serviteur                | à faire |
| 7   | Soumission + workflow admin                        | à faire |
| 8   | Questions + durcissement + tests                   | à faire |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
