# Base de données

## Contenu

```
migrations/   schéma versionné — appliqué dans l'ordre des noms de fichiers
tests/        tests de schéma et de sécurité, dont la doublure Supabase
```

Il n'existe **aucun seed de contenu**. La taxonomie (neuf catégories, trois
sous-catégories) est une donnée **structurelle** imposée par le cahier des
charges : elle vit dans une migration, pas dans un seed de développement, afin
d'exister à l'identique dans tous les environnements.

## Appliquer les migrations

Sur un projet Supabase, via la CLI :

```bash
supabase db push
```

Les fichiers de `tests/` ne sont **jamais** appliqués à un environnement
Supabase : `00_shim.sql` reproduit ce que la plateforme fournit déjà (rôles
`anon` / `authenticated` / `service_role`, schémas `auth` et `storage`) afin de
pouvoir tout exécuter sur un PostgreSQL nu.

## Vérifier le schéma

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run db:verify
```

La base indiquée est **recréée dans l'état attendu** : n'utiliser qu'une base
jetable. La CI rejoue cette vérification sur un service PostgreSQL 16.

Les tests couvrent :

| Fichier           | Couverture                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `10_schema.sql`   | Neuf catégories exactes, sous-catégories sous « Vie chrétienne » uniquement, énumérations, RLS active partout, absence de policy de suppression ou d'écriture sur la taxonomie, index |
| `20_workflow.sql` | Matrice de transitions, minimum cinq flags, fichier obligatoire, commentaire obligatoire pour une correction, dépositaire immuable, horodatages                                       |
| `30_rls.sql`      | Tests **négatifs** : ce que l'anonyme et le serviteur ne doivent jamais pouvoir faire — plus un contrôle positif côté administration                                                  |
| `40_search.sql`   | Agrégation du vecteur de recherche et rafraîchissement au retrait d'un flag                                                                                                           |
| `50_storage.sql`  | Bucket privé, cloisonnement par dépositaire, aucun accès anonyme                                                                                                                      |

## Surface publique

Le rôle anonyme n'a **aucun accès aux tables**. Il ne voit que la taxonomie et
trois vues, dont le filtre et la liste de colonnes sont internes :

- `published_resources`
- `published_resource_flags`
- `published_resource_files`

N'y figurent ni `depositor_id`, ni `admin_comment`, ni `status`, ni
`storage_path`, ni `filename`, ni aucune colonne de `users`. La RLS de
PostgreSQL étant au niveau de la **ligne** et non de la **colonne**, ce
masquage ne pouvait pas être obtenu par une policy.

## Ce qui n'est pas encore là

- **Questions et réponses** — étape ultérieure. Les tables `questions` et
  `answers` seront ajoutées par migration, avec leur propre vue de masquage :
  l'e-mail du questionneur ne doit jamais être exposé.
  La recherche est **insensible aux accents** (point `Q`, tranché) : la
  configuration `public.logos_french` enchaîne `unaccent` avant `french_stem`.
  Toute requête doit employer cette configuration, sinon les lexèmes ne
  correspondent pas.
