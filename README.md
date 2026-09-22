# Logos — DCO

Bibliothèque numérique de ressources de catéchisme du **Diocèse Copte
Orthodoxe de Paris**.

> Une même foi, pour aujourd'hui et pour demain.

---

## Documents de référence

| Document                                                                     | Rôle                                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`docs/LOGOS_Cahier_des_charges_V1.md`](docs/LOGOS_Cahier_des_charges_V1.md) | Source de vérité **produit**                                                            |
| `docs/Logos - Design System V2.html`                                         | Référence **visuelle et UI**                                                            |
| [`CLAUDE.md`](CLAUDE.md)                                                     | Règles permanentes du projet (rôles, routes, sécurité, anti-régression, points ouverts) |

**Lire `CLAUDE.md` avant toute contribution.** Il condense les règles
opposables des deux documents ci-dessus.

---

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript strict**
- **Tailwind CSS 4** — configuration restreinte aux tokens du Design System
- **Supabase** (PostgreSQL · Auth · Storage) — _étape 3, pas encore configuré_
- Déploiement : Vercel ou équivalent

---

## Démarrage

Prérequis : **Node ≥ 20.9** (la version utilisée est fixée dans `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev                  # http://localhost:3000
```

> `.env.local` n'est jamais versionné. `.env.example` ne doit contenir
> **aucun secret réel**.

---

## Scripts

| Commande               | Effet                    |
| ---------------------- | ------------------------ |
| `npm run dev`          | Serveur de développement |
| `npm run build`        | Build de production      |
| `npm run start`        | Serveur de production    |
| `npm run lint`         | ESLint                   |
| `npm run lint:fix`     | ESLint avec corrections  |
| `npm run typecheck`    | `tsc --noEmit`           |
| `npm run test`         | Tests de logique pure    |
| `npm run format`       | Prettier (écriture)      |
| `npm run format:check` | Prettier (vérification)  |
| `npm run assets:brand` | Régénère `public/brand/` |
| `npm run db:verify`    | Migrations + tests SQL   |

Avant tout commit :

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build
```

La CI (`.github/workflows/ci.yml`) rejoue ces mêmes vérifications sur chaque
push et chaque pull request, ainsi que `npm run db:verify` sur un service
PostgreSQL 16.

### Tests

Deux harnais, aucun framework, aucune dépendance de test :

- `npm run db:verify` — la **sécurité**. Migrations sur une base jetable, puis
  tests de schéma et tests négatifs sous les vrais rôles PostgreSQL.
- `npm run test` — la **logique pure**, avec le lanceur natif `node:test`.
  Node 22 exécute TypeScript directement ; `scripts/test-hooks.mjs` se borne à
  résoudre l'alias `@/` et à neutraliser les modules réservés au serveur.

Couverts : validation des téléversements, détection de pagination, libellés du
cahier des charges, URL de bibliothèque, `safeReturnPath`, lien `mailto:`.

Volontairement hors périmètre : composants React, rendu, navigateur.

---

## Structure

```
app/              routes (App Router)
components/
  ui/             primitives (boutons, champs, flags, statuts…)
  brand/          marque, bandeau, rosace
  library/        cartes, couvertures, recherche, filtres
  contribution/   formulaire de ressource
  layout/         header, menu mobile, breadcrumb, pied
lib/
  auth/           couche d'authentification isolée et remplaçable
  supabase/       clients navigateur / serveur / admin
  domain/         catégories, publics, types, transitions de statut
  search/         construction des requêtes de recherche
  cover/          algorithme de couverture générative
styles/           tokens.css — tokens du Design System
assets/brand/     masters de marque (rosace, marqueterie) — jamais servis
scripts/          extraction et optimisation des assets de marque
supabase/         migrations SQL + seed
public/brand/     rosace, marqueterie
docs/             cahier des charges + Design System
```

---

## Tokens du Design System

Tout le vocabulaire visuel vit dans [`styles/tokens.css`](styles/tokens.css) :
**8 couleurs, 3 familles typographiques, 1 échelle d'espacement, 3 rayons,
2 ombres, 2 durées**.

Les palettes, échelles et rayons par défaut de Tailwind y sont **désactivés**.
Écrire `bg-blue-500`, `rounded-xl` ou `p-7` ne produit donc aucune classe :
l'anti-régression visuelle est mécanique, pas déclarative.

L'échelle d'espacement est nommée d'après ses valeurs en pixels — `p-22` vaut
22 px — car le Design System raisonne en pixels.

---

## État d'avancement

| #   | Étape                                              | État |
| --- | -------------------------------------------------- | ---- |
| 1   | Initialisation technique                           | ✅   |
| 2   | Fondations visuelles (tokens, polices, primitives) | ✅   |
| 3   | Modèle de données + Supabase + RLS                 | ✅   |
| 4   | Bibliothèque publique                              | ✅   |
| 5   | Fiche ressource + téléchargement sécurisé          | ✅   |
| 6   | Authentification + espace serviteur                | ✅   |
| 7   | Soumission + workflow admin                        | ✅   |
| 8   | Questions + durcissement + tests                   | ✅   |
| 9   | Accueil éditorial + pied de page                   | ✅   |
| 10  | Durcissement : états d'erreur et harnais de test   | ✅   |

`app/not-found.tsx` et `app/error.tsx` couvrent les deux pannes visibles : une
URL inconnue et une exception non rattrapée. Aucun détail technique n'est
exposé au visiteur.

`app/page.tsx` porte l'accueil éditorial du §20 du cahier des charges : hero,
raison d'être, recherche, les neuf thèmes, « À découvrir », bande de
contribution. Le pied de page est monté globalement dans `app/layout.tsx` et
clôt toutes les pages.

---

## Assets de marque

Les **masters font autorité** et vivent dans `assets/brand/` : la rosace
(PNG 2048 × 2048, 7,4 Mo) et la marqueterie (JPEG 736 × 1336). Ils sont
conservés tels quels — aucun recadrage, aucune vectorisation, aucune
transformation en texture répétable.

Ils sont réextractibles bit-à-bit depuis le Design System bundlé :

```bash
node scripts/extract-brand-masters.mjs
```

Les versions web servies sont générées dans `public/brand/`, uniquement aux
tailles réellement employées par le Design System :

```bash
npm run assets:brand
```

La rosace n'a que **quatre usages autorisés** — marque, hero, couverture,
état vide. Le module `components/brand/Rosace.tsx` n'expose que ceux-là.

---

## Planche de vérification

`/design-system` confronte chaque primitive à sa spécification. Cette route
**n'existe qu'en développement** : elle répond 404 en production, la liste des
routes publiques reste fermée.

---

## Base de données

Le schéma, les migrations et les tests vivent dans [`supabase/`](supabase/) —
voir [`supabase/README.md`](supabase/README.md).

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run db:verify
```

La base indiquée est recréée dans l'état attendu : **n'utiliser qu'une base
jetable**.

Deployment configuration verified.
