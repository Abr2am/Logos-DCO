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

| Fichier                  | Couverture                                                                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `10_schema.sql`          | Neuf catégories exactes, sous-catégories sous « Vie chrétienne » uniquement, énumérations, RLS active partout, absence de policy de suppression ou d'écriture sur la taxonomie, index                                                           |
| `20_workflow.sql`        | Matrice de transitions, minimum cinq flags, fichier obligatoire, commentaire obligatoire pour une correction, dépositaire immuable, horodatages                                                                                                 |
| `30_rls.sql`             | Tests **négatifs** : ce que l'anonyme et le serviteur ne doivent jamais pouvoir faire — plus un contrôle positif côté administration                                                                                                            |
| `40_search.sql`          | Agrégation du vecteur de recherche et rafraîchissement au retrait d'un flag                                                                                                                                                                     |
| `50_storage.sql`         | Bucket privé, cloisonnement par dépositaire, aucun accès anonyme                                                                                                                                                                                |
| `60_library_api.sql`     | Recherche, filtres par flags (OU), portée de branche, tri par date de publication décroissante                                                                                                                                                  |
| `70_resource_detail.sql` | Fiche publique, et téléchargement refusé pour toute ressource non publiée                                                                                                                                                                       |
| `80_contribution.sql`    | Dépôt, correction, resoumission, file de modération, identité du dépositaire réservée à l'administration                                                                                                                                        |
| `90_questions.sql`       | Insertion anonyme bornée aux ressources publiées, aucune lecture anonyme, cloisonnement de `questioner_email` entre serviteurs, transition unique `PENDING → ANSWERED`, immutabilité du texte et de l'adresse, surface publique toujours fermée |

## Surface publique

Le rôle anonyme n'a **aucun accès aux tables**. Il ne voit que la taxonomie et
trois vues, dont le filtre et la liste de colonnes sont internes :

- `published_resources`
- `published_resource_flags`
- `published_resource_files`

Deux fonctions complètent cette surface pour le rôle anonyme :
`search_published_resources` / `published_flags` (bibliothèque) et
`get_published_resource` (fiche).

`get_published_file` fait exception : elle renvoie le **chemin de stockage** et
n'est accordée **qu'à `service_role`**, pour la seule route serveur de
téléchargement. Ne jamais l'accorder à `anon`.

`ask_question` complète cette surface **en écriture seule** : le rôle anonyme
peut déposer une question sur une ressource publiée, sans jamais pouvoir en
relire aucune. La table `questions` n'entre dans **aucune vue publique** ;
`90_questions.sql` vérifie que la liste ci-dessus n'a pas grandi.

N'y figurent ni `depositor_id`, ni `admin_comment`, ni `status`, ni
`storage_path`, ni `filename`, ni aucune colonne de `users`. La RLS de
PostgreSQL étant au niveau de la **ligne** et non de la **colonne**, ce
masquage ne pouvait pas être obtenu par une policy.

## Configuration Supabase requise

Deux réglages ne vivent pas dans les migrations et doivent être posés sur le
projet Supabase :

1. **Désactiver l'inscription** (`Authentication → Sign Up`). L'absence de
   formulaire d'inscription dans l'application **n'est pas une protection** :
   l'API d'authentification reste joignable. Les comptes sont créés par le
   diocèse.
2. **Bucket `resources` privé** — créé par migration, mais vérifier qu'aucune
   politique de projet ne le rend public.

Un compte créé dans `auth.users` reçoit automatiquement un profil
`public.users` au rôle `SERVANT` (déclencheur `on_auth_user_created`). Passer
un compte en `ADMIN` est une opération d'administration :

```sql
update public.users set role = 'ADMIN' where email = '…';
```

Aucune policy ne permet à un client de le faire, et un déclencheur refuse tout
changement de rôle émanant d'un utilisateur authentifié non administrateur.

## Questions

La table `questions` porte le workflow du MVP : deux statuts (`PENDING`,
`ANSWERED`), une seule transition, aucune réponse stockée. Il n'existe **pas**
de table `answers` — la réponse part de la messagerie personnelle du
dépositaire, hors de Logos.

⚠️ **Dette technique assumée.** `questioner_email` est visible par le
dépositaire de la ressource, parce que c'est son seul canal de réponse. Il
reste invisible au rôle anonyme et à tout autre serviteur.

Deux absences sont **décidées, pas en attente** : aucun écran d'administration
des questions (`K`) et aucune notification e-mail automatique (`M`) — toutes
deux **hors périmètre MVP**. Ne pas les implémenter ici. Voir « Questions » et
« Hors périmètre MVP — dette technique assumée » dans `CLAUDE.md`.

## Rappel

La recherche est **insensible aux accents** (point `Q`, tranché) : la
configuration `public.logos_french` enchaîne `unaccent` avant `french_stem`.
Toute requête doit employer cette configuration, sinon les lexèmes ne
correspondent pas.
