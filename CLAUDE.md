# Logos — règles permanentes du projet

Bibliothèque numérique de ressources de catéchisme du **Diocèse Copte
Orthodoxe de Paris**.

> Une même foi, pour aujourd'hui et pour demain.

## Sources de vérité

| Document                                                 | Rôle                                                                                                                                                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/LOGOS_Cahier_des_charges_V1.md`                    | **Source de vérité produit.** Prime sur toute autre considération.                                                                                                                                             |
| `docs/LOGOS_Design_System_V2.html`                       | **Référence visuelle et UI.** Document bundlé : le contenu réel est dans le script `__bundler/template`.                                                                                                       |
| **Maquette finale de l'accueil** (validée le 24/09/2026) | **Source de vérité visuelle de `/`, et d'elle seule.** Elle prime sur toute interprétation et sur les règles de composition antérieures pour cette page. Les autres pages restent régies par le Design System. |

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
| Voir les questions posées sur **ses** ressources               |          ❌          |        ✅        |  ✅   |
| Voir l'e-mail du questionneur de ses ressources                |          ❌          |        ✅        |  ✅   |
| Voir l'identité et l'e-mail de **tout** questionneur           |          ❌          |        ❌        |  ✅   |
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

**Membre connecté (serviteur ou administrateur)**

- `/compte` — Mon compte
- `/partager` — Partager un cours
- `/mes-contributions` — Mes contributions
- `/mes-questions` — Mes questions

**Administration**

- `/admin` — Dashboard
- `/admin/ressources/[id]` — Modération d'une ressource

> `/compte` est un **ajout validé** (décision produit du 25/09/2026) : il
> tranche le point ouvert « T » en donnant une destination à l'entrée
> « Mon compte ». La page ne crée AUCUNE fonctionnalité — elle affiche
> l'adresse et le rôle du compte, rassemble les routes existantes en cartes, et
> porte la déconnexion. Aucun écran de gestion de compte, aucun changement de
> mot de passe, aucune modification de profil : ce serait une fonctionnalité,
> et elle n'est pas au cahier des charges.
>
> **Conséquence sur la navigation** (25/09/2026) : « Partager un cours » quitte
> le header et le menu mobile, connecté ou non — la barre se réduit à
> `Accueil · Bibliothèque · Connexion`, et `Accueil · Bibliothèque ·
Mon compte` une fois connecté. L'entrée n'est pas perdue pour autant :
> **l'accueil la porte toujours**, en appel à l'action du hero et du bloc
> « Enrichir la bibliothèque » — ces deux CTA ne bougent pas —, et un membre la
> retrouve dans « Mon compte ».
>
> `/mes-questions` est un **ajout validé** (décision produit du 22/09/2026) :
> le workflow Q&A du MVP fait du serviteur celui qui répond, et le cahier des
> charges ne prévoyait aucun écran pour cela. La liste reste fermée — elle
> compte désormais cette route, et pas une de plus. Elle n'entre pas dans la
> navigation principale (fermée elle aussi) : on l'atteint depuis
> « Mes contributions », et réciproquement.

**Interdits :** `/categories` (page d'index indépendante) · `/admin/flags`.

Les routes techniques sous `/api/` ne sont pas des pages : elles ne figurent
pas dans cette liste. À ce jour, il en existe deux, et elles ne se
recouvrent pas :

- `/api/telechargement/[id]` — public, ressources **PUBLIÉES** uniquement ;
- `/api/admin/telechargement/[id]` — **administration seule**, tous statuts
  (décision du 25/09/2026 : on ne publie pas une ressource sans l'avoir
  ouverte). Voir « Téléchargement en modération ».

La correction d'une ressource « À corriger » réutilise `/partager?ressource=<id>` :
le cahier des charges prévoit « Modifier la ressource » sans définir de route
distincte, et la liste ci-dessus est fermée.

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
- L'identité du dépositaire reste **cachée au questionneur**.
- L'administration voit tout.
- Les questions ne sont **jamais affichées publiquement** : ni sur la fiche
  ressource, ni ailleurs. La fiche ne porte que le formulaire.

Pas de fil de discussion, pas de réponses multiples, pas de mentions.

### Workflow du MVP — décision validée (22/09/2026)

```
visiteur (sans compte) → pose une question sur une ressource PUBLIÉE
serviteur              → la retrouve dans « Mes questions »
                       → voit l'adresse du visiteur, cliquable en « mailto: »
                       → répond depuis SA PROPRE messagerie, hors de Logos
                       → passe la question en « Répondue »
```

**Deux statuts, et deux seulement** (tranche le point `L`) : `PENDING`
(« En attente de réponse ») et `ANSWERED` (« Répondue »). Une seule transition
existe, `PENDING → ANSWERED`, appliquée par déclencheur. **Aucune réponse n'est
stockée en base** : Logos ne voit jamais le texte de la réponse.

**Ce que le MVP n'a pas, volontairement :** aucun service d'envoi d'e-mail,
aucune notification automatique, aucune messagerie interne, aucun lien signé,
aucun écran de modération des questions.

### Anti-spam — validé le 25/09/2026 (tranche le point `R`)

Le formulaire est public et sans compte. Deux barrières, et elles n'ont pas le
même poids :

- **Dans l'application** (`lib/questions/antispam.ts`) : un **leurre** — champ
  hors écran, hors tabulation, `aria-hidden` — et un **jeton horodaté signé**,
  émis au rendu de la fiche, qui refuse une soumission de moins de 3 secondes
  ou de plus de 2 heures. La clé de signature est **dérivée** de
  `SUPABASE_SERVICE_ROLE_KEY` : aucune variable d'environnement nouvelle. Un
  leurre rempli reçoit une confirmation d'envoi **sans rien insérer** — dire
  non apprendrait au robot comment s'adapter.
- **En base** (`enforce_question_rate_limit`, déclencheur `BEFORE INSERT`) :
  **10 questions par heure et par ressource · 5 par 24 h et par adresse · 100
  par heure au total**. Refus par `SQLSTATE 54000`, traduit en un message
  neutre.

⚠️ **Seule la seconde barrière est une garde.** La clé anonyme est inlinée
dans le bundle du navigateur — c'est sa nature —, si bien qu'un appel direct à
`rpc/ask_question` ne verrait jamais le leurre ni le jeton. Ne jamais déplacer
les plafonds hors de PostgreSQL.

Aucune donnée nouvelle n'est stockée : les compteurs se lisent dans
`questions`. Aucune table, aucune colonne, aucune policy, aucun `grant` n'ont
changé — et l'IP du visiteur n'est ni lue, ni conservée.

### ⚠️ Dette technique — anonymat partiel

Le cahier des charges (§12) pose « l'e-mail n'est jamais communiqué à
l'auteur ». **Le MVP déroge à cette règle** : l'adresse du questionneur est
visible par le dépositaire de la ressource, parce que c'est le seul canal de
réponse possible sans service d'envoi.

Ce qui reste vrai, et ne doit pas bouger :

- le questionneur n'apprend **rien** du dépositaire ;
- le public n'a **aucun accès** aux questions — aucune vue, aucun `SELECT` ;
- un serviteur ne voit **que** les questions posées sur ses propres
  ressources ;
- une question ne vise qu'une ressource **publiée**.

À reprendre le jour où un service d'e-mail sera validé — **hors périmètre
MVP**, voir la section « Hors périmètre MVP — dette technique assumée ». Ce
jour-là, la notification remplace l'exposition de l'adresse : ce n'est pas une
fonctionnalité à ajouter au MVP, c'est une dette à rembourser ensuite.

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
7. `questioner_email` n'est **jamais** exposé au rôle anonyme, ni à un
   serviteur qui n'est pas le dépositaire de la ressource concernée. La table
   `questions` n'entre dans **aucune vue publique** et n'accorde au rôle
   anonyme qu'un `INSERT`, borné aux ressources `PUBLISHED` ; la lecture est
   réservée au dépositaire et à l'administration, par policy RLS.
   ⚠️ Le MVP expose volontairement cette adresse au dépositaire — voir
   « Dette technique — anonymat partiel ». La dérogation s'arrête là :
   l'élargir à qui que ce soit d'autre est une régression.
8. La clé `service_role` n'est jamais préfixée `NEXT_PUBLIC_` et n'apparaît
   que dans du code serveur.
9. La séparation SERVANT / ADMIN est vérifiée côté serveur, jamais par un
   simple masquage de bouton.
10. Validation des téléversements côté serveur : liste blanche d'extensions
    **et** de types MIME, limite de taille, nom de fichier généré, service en
    `Content-Disposition: attachment`.
    ⚠️ PPTX, DOCX et XLSX **sont** des conteneurs ZIP : ne pas les rejeter par
    une détection générique « c'est une archive ».

    **Upload DIRECT depuis le navigateur — architecture validée le
    24/09/2026.** Le fichier ne transite plus par la fonction serveur : il va
    du navigateur à Storage, par URL signée. C'est ce qui permet des ressources
    de plusieurs dizaines de méga-octets, la limite de corps de requête de
    l'hébergeur (≈ 4,5 Mo) ne s'appliquant plus.

    ```
    1. prepareUpload()      serveur : requireMember, extension et taille
                            annoncées, chemin <uid>/<uuid>.<ext>, URL signée
    2. PUT navigateur → Storage      (avec progression ; ne passe pas par
                                      la fonction)
    3. submitResource()     serveur : le chemin appartient-il au demandeur,
                            taille + type + signature RELUS DANS STORAGE,
                            puis `submit_resource`
    ```

    Trois gardes, et il faut les trois :
    - `isOwnedBy` (`lib/files/storage-path.ts`) et son **miroir en base**,
      `owns_storage_path` — un serviteur ne peut revendiquer QUE son propre
      préfixe. La version SQL fait foi ;
    - `validateStoredFile` (`lib/files/validate.ts`) — extension, type **et
      signature** de l'objet réellement déposé, jamais de ce qu'annonce le
      formulaire ;
    - les policies Storage, inchangées : l'URL est signée par le client de
      session, donc `resources_objects_insert_own` s'applique au moment de la
      signature.

    L'attribut `accept`, la barre de progression et tout ce qu'affiche le
    navigateur restent du confort, jamais un contrôle.

    ⚠️ **Taille maximale : 50 Mo**, tranché le 24/09/2026 (`MAX_UPLOAD_BYTES`
    dans `lib/files/formats.ts`). Deux plafonds l'encadrent hors du code : la
    limite d'un envoi simple vers Storage, et le `file_size_limit` du bucket,
    à régler côté Supabase — sans quoi un appel direct à l'API la
    contournerait. `serverActions.bodySizeLimit` ne la borne plus : il est
    redescendu à 1 Mo, puisque les actions ne transportent que des
    métadonnées.

    **Dette assumée — objets orphelins.** Un dépôt interrompu après l'envoi
    laisse un objet non revendiqué dans le bucket. Aucun nettoyage n'est prévu
    au MVP : il n'y a pas de tâche planifiée, et en ajouter une supposerait un
    service de plus. L'objet reste privé, invisible, et sans ressource
    associée.

    **Pagination.** `page_count` n'est plus détecté au-delà de 15 Mo
    (`PDF_PAGINATION_MAX_BYTES`) : `pdf-lib` exige le document entier. Une
    pagination inconnue est un cas normal, que l'interface omet. Les
    diapositives d'un PPTX, elles, restent comptées à toutes les tailles — le
    répertoire central se lit dans la QUEUE du conteneur, par une requête de
    plage.

    **Téléchargement en modération — validé le 25/09/2026.** L'administration
    télécharge le fichier d'une ressource **quel que soit son statut**, par
    `/api/admin/telechargement/[id]`. Cette route n'emprunte RIEN au
    téléchargement public : celui-ci reste anonyme, sous `service_role`, et
    garde pour seule garde le filtre `status = 'PUBLISHED'` de
    `get_published_file` — qu'il ne faut pas élargir. La route
    d'administration, elle, passe par le **client de session**, jamais
    `serviceClient()`, et superpose trois gardes :

    - la route écarte tout ce qui n'est pas ADMIN par un **404 muet** — jamais
      une redirection, qui révélerait l'existence de la ressource ;
    - `admin_resource_file` lève `42501` hors administration, sous
      `files_select_admin` (elle reste SECURITY INVOKER) ;
    - la policy Storage `resources_objects_select_own` revérifie `is_admin()`
      au moment de signer.

    L'URL signée vit 60 secondes et force `Content-Disposition: attachment`.
    ⚠️ `storage_path` ne sort de la base que vers du code serveur :
    `admin_resource`, qui alimente le HTML de l'écran de modération, ne le
    renvoie pas — et ne doit jamais le renvoyer.

11. **En-têtes de sécurité HTTP** — posés le 25/09/2026 sur toutes les routes
    (`lib/security/headers.ts`, branché dans `next.config.ts`) :
    `Content-Security-Policy`, `Strict-Transport-Security` (2 ans,
    sous-domaines compris, **sans `preload`** — c'est un engagement de
    domaine, pas un réglage), `X-Frame-Options: DENY`, `X-Content-Type-Options`,
    `Referrer-Policy: strict-origin-when-cross-origin` et une
    `Permissions-Policy` qui refuse caméra, micro, position, paiement et USB.

    Ce que la CSP tient vraiment : aucun script d'une autre origine, aucun
    encadrement du site, aucun formulaire envoyé ailleurs, et le navigateur ne
    parle qu'à nous et au projet Supabase (`connect-src`, indispensable au
    téléversement direct).
    ⚠️ `script-src` admet `'unsafe-inline'` : Next place la charge utile du
    rendu dans des balises en ligne. La parade propre est un **nonce par
    requête** posé dans `proxy.ts` — elle impose un rendu dynamique à chaque
    page, ce que la 404 prérendue n'est pas. C'est une évolution à décider,
    pas un réglage à changer. `'unsafe-eval'` n'est accordé qu'en
    développement, jamais en production.

12. L'architecture d'authentification reste **isolée et remplaçable**
    (`lib/auth/`), pour pouvoir passer au SSO / OIDC du diocèse sans
    reconstruire l'application.
    En pratique : les pages ne connaissent que `currentUser`, `requireMember`
    et `requireAdmin`. Le rôle est **relu en base à chaque appel**, sous la
    RLS — jamais lu dans un jeton ni dans des métadonnées modifiables. On
    emploie `getUser()` et non `getSession()` : le premier fait valider le
    jeton par Supabase, le second se contente de lire un cookie.
    `proxy.ts` rafraîchit les cookies de session et écarte un visiteur sans
    session des routes authentifiées. **Ce n'est qu'un filtre de confort** :
    chaque page revérifie identité et rôle. Retirer le proxy ne doit ouvrir
    aucun accès.

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

### Direction NOYER — validée le 23/09/2026

**Le bordeaux `#6E1B2A` est RETIRÉ de la direction visuelle.** Il ne subsiste
dans aucun token, aucune classe, aucune famille de couverture.

| Rôle                             | Couleur                            |
| -------------------------------- | ---------------------------------- |
| Identité **et** action           | **Noyer `#2E1E15`** (`walnut-900`) |
| Nuance architecturale secondaire | Noyer `#4A3123` (`walnut-700`)     |
| Accent discret, filets           | Doré `#C39A54`                     |
| Fond principal                   | Ivoire `#F7F3EA`                   |

- **L'action principale est DORÉE à texte noyer**, sur ivoire comme sur
  noyer — décision du 23/09/2026 : le doré a un rôle visuel réel, il n'est pas
  qu'un filet. Contraste noyer sur doré : 7,4:1.
- **L'action secondaire est transparente à bordure noyer** (bordure ivoire sur
  aplat noyer). Jamais deux aplats dorés côte à côte : un seul bouton
  principal par zone de décision.
- **Aucune couleur nouvelle.** Un survol ou un appui emprunte la même famille
  (`gold-hover`, `walnut-700`, `walnut-active`) ; rien d'autre n'est permis.

- **Aucune couleur d'état** : pas de rouge d'erreur, pas de vert de succès,
  pas d'orange. Erreur = noyer + « ! » textuel + bordure renforcée ;
  succès = noyer + filet doré ; attente = doré.
- **Aucune couleur par catégorie.** Les neuf thèmes partagent exactement le
  même traitement.
- **Aucun bleu, aucun vert.**
- **Ombres réservées aux couvertures**, et **très légères** : un ouvrage est
  posé sur sa tablette, il n'y flotte pas. Panneaux, champs et boutons ont
  une bordure, jamais une ombre.
  Une seule exception, validée le 23/09/2026 : `--shadow-niche`, **ombre
  interne** du renfoncement d'une niche du meuble. Elle n'est jamais portée et
  ne sort jamais du meuble.
- **Rayons :** 3 px contrôles · 4 px panneaux · **0 couvertures, bandeaux et
  tablettes** (un livre a des angles vifs). Jamais d'arrondi complet, sauf la
  pastille de rosace.
- **Flags : rectangle 3 px, jamais de forme « pill »**, jamais de couleur
  propre à un mot-clé.
- **Bandeau noyer 4-5 px + filet doré** en tête de chaque page : c'est la
  signature architecturale du produit.
- **Montant doré de 3 px devant chaque titre de section** (`SectionHeading`) :
  la même arête qu'en nez de tablette et en corniche. Le doré ponctue la
  structure, il ne décore pas.
- **Motion :** 150 ms (survols) / 200 ms (menu, listes), courbe
  `cubic-bezier(.2,.6,.3,1)`. Aucun déplacement de plus de 2 px, aucune mise à
  l'échelle, aucune animation d'entrée au défilement, aucun toast, aucun
  skeleton animé.
- **Statuts** (En attente / Publiée / À corriger / Archivée) n'apparaissent
  **que** dans « Mes contributions » et l'administration, jamais dans la
  bibliothèque publique.
- **Ouvrage (carte ressource) :** couverture 3:4, titre, et une seule ligne
  `type · format · pagination`. Rien d'autre — ni auteur, ni date, ni public,
  ni flags, ni bouton. **AUCUNE carte blanche autour de la couverture** : le
  livre est posé directement sur la tablette.
- **Niche de thème :** aucun compteur de ressources.
- **Couvertures génératives**, calculées depuis catégorie + titre + index
  stable. Aucune image téléversée. **Une famille de couverture ne représente
  jamais une catégorie** : aucune correspondance couleur ↔ thème.

### Emblème officiel — la marque, depuis le 23/09/2026

Le logo du diocèse est un **fichier fourni et validé**. Il fait foi, et il est
servi tel quel : `assets/brand/embleme.png` (master, jamais servi) →
`public/brand/embleme-256.webp` (`npm run assets:brand`).

**Interdits :** le redessiner, le revectoriser, le recréer en CSS, changer ses
formes, ses couleurs ou ses proportions, lui appliquer un filtre, une ombre,
une rotation ou une déformation, le recadrer sur une partie de son dessin.

Deux opérations, et deux seulement, sont appliquées par le script — aucune ne
touche au dessin :

1. le fond blanc **extérieur** devient transparent, par remplissage depuis les
   bords (le master est un PNG opaque). Les blancs fermés à l'intérieur du
   dessin sont préservés ;
2. le cadre est rogné sur la **boîte englobante de l'encre** — le master a des
   marges inégales (196 / 173 / 164 / 107 px). Rien du logo n'est coupé.

C'est ce rognage qui rend le centrage **purement géométrique** dans chaque
conteneur : `BrandMark` n'applique aucune translation de compensation, et il
ne faut pas en introduire. Sa largeur est **calculée** depuis le rapport du
dessin (964 / 907), jamais saisie à la main.

Tailles : **26 px** en mobile · **32 px** en desktop · **58 px** en hero,
toujours accompagnées du mot-marque « LOGOS », que l'emblème ne contient pas.
L'emblème SEUL — sans mot-marque — n'a qu'un emploi : l'**état vide**, à
34 px. `Emblem` porte l'image ; `BrandMark` n'est que l'emblème plus le
mot-marque.

⚠️ **L'emblème porte une croix, et c'est la seule de l'interface.** La règle
« aucune croix, icône, bougie, plante ou objet liturgique » vise la
décoration : elle reste entière partout ailleurs. Un logo validé n'est pas une
décoration, et il ne s'en déduit aucune permission d'en ajouter.

Sur aplat noyer, l'emblème est servi sans changement : le doré porte le
dessin, les bruns se fondent dans le fond. Aucune variante recolorée.

### Rosace — 3 usages depuis l'emblème officiel

~~Marque (pastille 22-40 px)~~ — **remplacée par l'emblème officiel le
23/09/2026.** ~~État vide (pastille dorée 34 px)~~ — **remplacée par l'emblème
officiel le 24/09/2026** : `EmptyState` porte l'emblème à 34 px de haut,
proportionné et discret. Restent donc **deux usages** : Hero (une occurrence
par écran, **élément architectural d'arrière-plan**) · Couverture (filigrane
≤ 26 %, au plus 1 sur 5). La grande rosace décorative est un élément
**distinct du logo** : ne jamais employer l'emblème comme motif de fond, ni la
rosace comme marque.

`RosacePastille` n'a plus d'emploi dans le produit — seule la page
`/design-system` la montre encore, à titre de pièce documentée.

⚠️ **Depuis la maquette finale (24/09/2026), l'accueil n'emploie plus la
rosace en hero** : son décor est un ASSET validé, où la rosace est sculptée
dans le mur. Le composant `RosaceHero` n'y sert plus qu'au filigrane du
panneau de contribution. Les règles ci-dessous restent la référence pour tout
autre hero.

**La rosace en hero — arbitrage du 23/09/2026.** Elle est **très agrandie**, son
centre nettement **décalé vers la droite**, son opacité **très faible**
(6 %). Elle **sort de l'écran par le côté**, jamais par le haut ni par le bas :
sa taille est portée par la HAUTEUR de sa section (`inset-y-0 h-full w-auto`),
et le motif étant un **disque tangent à son cadre** (mesuré : l'alpha couvre
78 % du carré, soit π/4), ses extrémités haute et basse effleurent exactement
les bords de la section. **Aucune extrémité n'est donc coupée**, quelle que
soit la longueur du contenu, et le débordement latéral est absorbé par
`overflow-hidden` — jamais par le document, qui ne défile jamais
horizontalement. En mobile, la composition **ne la masque pas** : la même
rosace passe derrière le texte.

Fusion : `multiply` sur fond clair, `screen` sur aplat noyer — un motif sombre
sur fond sombre ne se verrait pas. Le mode est porté par une **prop** de
`Rosace.tsx`, jamais par une classe ajoutée : deux `mix-blend-*` sur un même
élément ne s'ordonnent pas de façon fiable. L'opacité, elle, est écrite en
style inline par le composant et primerait sur une classe `tablet:opacity-*` :
une seule valeur, à tous les paliers.

⚠️ **Centrage — ne pas « corriger » à nouveau.** Le motif **est centré dans son
cadre** : barycentre du canal alpha à 254,47 / 253,91 pour un cadre de 512
(−0,30 % / −0,41 %). `Rosace.tsx` n'applique **aucune translation**, et la
taille intérieure de la pastille est forcée à un nombre pair pour que le
décalage de centrage tombe sur un entier. Un `translate` posé le 23/09/2026 à
partir d'une mesure faite sur la luminance **sans le canal alpha** — elle
pesait la densité d'encre, pas la géométrie — décentrait activement le logo ;
il a été retiré. Ne pas le réintroduire sans remesurer sur l'alpha.

**Interdits :** déformation, recadrage en fragment, redessin, motif répété,
usage comme icône fonctionnelle, rotation, contour tracé, version mono-trait.

### Architecture de bibliothèque — le langage central

L'interface doit se lire comme une **bibliothèque contemporaine**, par
l'architecture et les proportions : étagères, tablettes noyer, niches et
travées, montants ponctuels, couvertures présentées comme de vrais ouvrages,
filets dorés très fins.

**Les étagères sont une STRUCTURE GRAPHIQUE, pas une bibliothèque réaliste.**
Ni musée, ni brocante, ni bibliothèque ancienne, ni décor chargé.

### L'accueil et la bibliothèque — assets validés (24/09/2026)

`/` reproduit la **maquette finale**, et `/bibliotheque` porte **le même
meuble** : on doit reconnaître le même mobilier d'une page à l'autre. Cette
menuiserie n'est plus dessinée en CSS — elle vient de quatre fichiers validés,
masters dans `assets/home/`, versions web produites par `npm run assets:home`
dans `public/home/`.

| Asset                      | Usage                                     |
| -------------------------- | ----------------------------------------- |
| `hero-desktop.webp`        | hero, à partir de 640 px                  |
| `hero-mobile.webp`         | hero, sous 640 px — composition distincte |
| `bookcase-horizontal.webp` | le meuble, à partir de 640 px             |
| `bookcase-vertical.webp`   | le meuble, sous 640 px                    |

**Interdits :** les redessiner, les recréer en CSS, les recadrer sur une
partie de leur dessin, les déformer, les remplacer par une approximation.

- **`<picture>` + `<source media>`, jamais deux `next/image` superposés** :
  c'est le seul moyen de ne télécharger QUE la composition du palier courant.
  Deux images en `hidden` seraient toutes deux chargées.
- **Le hero n'est jamais une image aplatie** : surtitre, titre, signature et
  appels à l'action restent du HTML. L'image ne porte que le décor (`alt`
  vide, `aria-hidden`).
- **Les neuf thèmes sont de vrais liens posés DANS les niches**
  (`components/library/ThemeBookcase.tsx`, partagé par `/` et
  `/bibliotheque` — toute retouche se voit sur les deux pages). Leur géométrie est en **pourcentages
  de l'image**, mesurés une fois sur les fichiers : l'image étant l'élément de
  flux, tout se met à l'échelle ensemble, sans point de rupture supplémentaire
  et sans JavaScript. Desktop et tablette : 5 thèmes puis 4, la seconde rangée
  à colonnes inégales — « Vie chrétienne » porte trois sous-thèmes. Mobile :
  cinq tablettes, deux thèmes chacune, « Vie chrétienne » seule sur la
  sienne.
- Les sous-thèmes sont des **pastilles** en mobile et en desktop ; en
  tablette, la niche est trop étroite et la maquette y met une **ligne à
  points médians**.
- « À découvrir » : fond ivoire, **une seule tablette**, cinq ouvrages nus —
  pas de panneau sombre, pas de meuble. Cinq en desktop, quatre en tablette,
  et en mobile la rangée **défile horizontalement** sous une tablette pleine
  largeur.

> `Bookcase`, `HeroShelf` et `BookSpines` — la menuiserie dessinée en CSS —
> ne servent plus qu'aux **sous-thèmes d'une branche**
> (`/bibliotheque/[categorie]`), où le meuble à neuf niches n'aurait pas de
> sens pour trois sous-catégories. ⚠️ **Point à trancher** : cette page montre
> donc encore l'ancien meuble sombre, à côté du meuble clair des deux autres.
> Ne pas l'harmoniser sans décision — aucun asset ne couvre trois niches.

**Le meuble (`Bookcase`) — « Explorer par thème » hors accueil.** Les neuf thèmes sont neuf
**niches d'un même meuble**, jamais neuf cartes. Ce qui en fait un meuble :

- une **corniche** moulurée le couronne (larmier, filet doré, frise de
  losanges), une **grecque de socle** en `walnut-900` le pose au sol, et deux
  **joues** ajourées — claustra + médaillons — le ferment de part et d'autre
  (masquées sous 640 px, où elles prendraient la place des niches) ;
- la **carcasse** est le fond de la grille, en `walnut-700` ; les **niches**
  sont des cellules `walnut-900`, plus sombres ;
- les **montants** sont les gouttières verticales de la grille : la carcasse y
  transparaît, exactement entre deux niches, à tous les paliers et **sans une
  seule règle conditionnelle** ;
- chaque niche est couronnée d'un **arc surbaissé** (l'écoinçon est plein,
  l'ouverture se découpe en négatif), bordée de deux **piédroits** dorés très
  pâles, et fermée en pied par une **tablette** ;
- une rangée incomplète laisse voir la carcasse : une travée fermée, en bois
  plein. C'est un meuble, pas une grille trouée.

**Rangées du meuble** (décision du 23/09/2026) : **5 niches puis 4** en
desktop — une grille de 20 colonnes, 4 colonnes par niche du haut, 5 par niche
du bas —, **3** en tablette, **2** en mobile. Le mobile garde donc une vraie
logique de meuble, jamais une liste de cartes.

**La profondeur** vient de trois choses, jamais d'un dégradé ni d'une texture
de bois : l'étagement des aplats, les arêtes dorées d'un pixel, et une **ombre
INTERNE très discrète** (`--shadow-niche`) — le linteau projette son ombre sur
le fond de la niche. C'est la seule ombre autorisée hors couverture, et elle
est toujours `inset` : un panneau, un champ ou un bouton n'a jamais d'ombre.

**Les ouvrages dans les niches.** Une tranche = **une ressource publiée dans
ce thème**, au plus six ; hauteur, largeur, teinte et inclinaison sont tirées
de l'identifiant, donc stables. Ce n'est ni un compteur, ni un décor inventé :
**une niche sans ressource reste vide**, et c'est exact. Seul le panneau du
hero — `aria-hidden`, sans lien — complète ses rangées de tranches muettes :
c'est du mobilier, pas une liste. Ne jamais étendre ce remplissage aux niches
de thème.

> Sur `/bibliotheque`, les niches sont volontairement **sans ouvrages** : la
> page « n'affiche pas immédiatement toutes les ressources » et ne charge donc
> aucune liste tant qu'aucun critère n'est actif.

**La menuiserie (`Arabesque.tsx`)** — arc, frise de corniche, grecque de
socle, claustra, médaillon — dérive de la géométrie de la rosace : losanges
entrelacés, arcs, méandres, étoiles. Chaque tracé est une **pièce
d'architecture** étirée sur la pièce qu'elle habille. **Jamais une texture de
fond**, jamais un motif répété sous une page, jamais sous du texte courant.

⚠️ Le **médaillon** des joues est une étoile géométrique à douze branches,
**pas la rosace de la marque** — dont les usages restent au nombre de quatre.
Chaque `<pattern>` exige un `id` unique dans la page, et son `viewBox` doit
rester large : `slice` met le tracé à l'échelle du plus grand côté, si bien
qu'un petit `viewBox` donnerait un claustra grossier.

**Le rayonnage (`Bookshelf`) — « À découvrir » et la bibliothèque :**

- Une **tablette** ferme chaque rangée : 7 px en mobile, 9 px au-delà, aplat
  `walnut-700`, filet doré en arête, tasseau `walnut-900` en dessous — trois
  aplats, aucune ombre portée, aucun dégradé de bois.
- La tablette est portée par **chaque travée**, jamais par la grille entière :
  les travées d'une rangée sont jointives, leurs tablettes se rejoignent en
  une ligne continue. C'est ce qui rend le rayonnage exact à tous les paliers
  **sans une seule règle conditionnelle**.
- **Montants** : un filet d'un pixel de part et d'autre, en desktop seulement.
- **Ouvrages par rangée :** 2 en mobile · 3 en tablette · 4 en desktop.
  Exception : « À découvrir » en accueil suit la maquette — cinq ouvrages
  posés sur UNE tablette, sans légende sous la couverture
  (`ResourceCard caption={false}`, la couverture portant déjà son titre).
- L'étagère reste **discrète** et ne domine jamais les couvertures.

Où le langage s'applique : accueil (« Explorer par thème » en niches,
« À découvrir » en étagère), Bibliothèque et pages de catégorie — c'est là
qu'il est le plus visible.

Où il ne s'applique PAS : **la fiche ressource** (l'ouvrage est extrait du
rayon — couverture, petit socle, informations, téléchargement, sans grande
étagère décorative) et **« Partager un cours »** (interface éditoriale sobre,
aucune étagère derrière le formulaire).

**Interdits :** texture de bois répétitive, motif répété, fond de page en
bois, bois derrière un champ de formulaire, dégradé bois, accumulation de
symboles religieux.

> Le patrimoine passe d'abord par la **géométrie** : symétrie, cadres en
> retrait, filets, rythme des panneaux, tranches de couvertures. Aucune croix,
> icône, bougie, plante ou objet liturgique n'entre dans l'interface —
> l'identité doit rester reconnaissable une fois tout symbole retiré.
>
> Seule exception, et elle n'en est pas vraiment une : **l'emblème officiel**,
> qui porte une croix. C'est le logo validé du diocèse, pas de la décoration —
> voir « Emblème officiel ». Rien d'autre ne s'en déduit.

### Accessibilité

Focus toujours visible, jamais supprimé (contour 2 px noyer, doré sur
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

| Réf.  | Point                                                                                                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C     | Parcours « mot de passe oublié »                                                                                                                                                                    |
| D     | Navigation entre les deux écrans d'administration                                                                                                                                                   |
| E     | Miniature extraite du fichier réel (1ʳᵉ page du PDF)                                                                                                                                                |
| ~~F~~ | ~~Canal de réponse du dépositaire aux questions~~ — **tranché le 22/09/2026** : `mailto:` depuis « Mes questions », hors de Logos                                                                   |
| G     | Police de secours pour les caractères coptes / arabes                                                                                                                                               |
| H     | Favicon et vignette de partage                                                                                                                                                                      |
| J     | Règle de « Tous les publics » combiné à d'autres publics                                                                                                                                            |
| ~~L~~ | ~~Valeurs de `Question.status`~~ — **tranché le 22/09/2026** : `PENDING` et `ANSWERED`, rien d'autre                                                                                                |
| N     | Couverture : déterminisme par identifiant _vs_ contraintes de rythme par rangée                                                                                                                     |
| O     | Format d'optimisation de la rosace (SVG vectorisé / WebP multi-tailles)                                                                                                                             |
| ~~R~~ | ~~Anti-spam du formulaire de question anonyme~~ — **tranché le 25/09/2026** : leurre et jeton horodaté côté application, plafonds de débit en base. Voir « Questions ».                             |
| ~~S~~ | ~~Renommage du fichier du Design System~~ — **résolu** : le fichier s'appelle `docs/LOGOS_Design_System_V2.html` depuis le 21/09/2026 sur `main`, et toutes les références du dépôt le suivent.     |
| ~~T~~ | ~~Destination de l'entrée « Mon compte »~~ — **tranché le 25/09/2026** : `/compte`. Le libellé bascule toujours « Connexion » → « Mon compte », mais c'est désormais un vrai lien. Voir « Routes ». |

> **F, L, R et T sont tranchés ; K et M ne sont plus des points ouverts.** Le cycle
> question → notification → réponse du §12 tient debout sans service d'envoi :
> le serviteur répond depuis sa propre messagerie. Ce qui manque encore est
> **hors périmètre**, pas indécis — voir la section ci-dessous.

---

## Hors périmètre MVP — dette technique assumée

Ces points sont **décidés** : ils ne font pas partie du MVP. Ce ne sont ni des
points ouverts à trancher, ni des fonctionnalités restant à écrire avant la
livraison. Les rouvrir demande une décision produit, pas une initiative.

**Ne pas les implémenter dans le MVP. Ne pas les reclasser en « à faire ».**

| Réf. | Point                                    | Décision                                                                                                                                                                                                                                                                 |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| K    | **Écran d'administration des questions** | **Hors périmètre MVP.** L'administration a la visibilité en base (policy `questions_select_admin`), mais aucun écran ne la lui présente. Le workflow validé confie la réponse au serviteur, pas à l'administrateur : un écran de modération n'est pas nécessaire au MVP. |
| M    | **Notifications e-mail automatiques**    | **Hors périmètre MVP.** Aucun service d'envoi n'entre dans la pile — contrainte explicite : aucun service externe, aucun coût. Le serviteur consulte « Mes questions » ; rien ne le prévient. C'est la contrepartie assumée du workflow `mailto:`.                       |

**Dette liée.** `M` porte le remboursement de la dette d'anonymat décrite plus
haut : le jour où un service d'envoi est validé, la notification remplace
l'exposition de l'adresse du questionneur au dépositaire. Tant que ce jour
n'est pas venu, l'adresse reste visible — c'est le prix du MVP, et il est
documenté, pas subi.

**Plus rien d'ouvert sur les questions :** `R` a été tranché le 25/09/2026.

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
  ⚠️ Elle est **fermée** : 4 · 8 · 12 · 16 · 22 · 26 · 34 · 44 · 56 · 78 · 96.
  Une valeur hors échelle ne produit **aucune classe et aucune erreur** —
  `px-20` ne posait aucune gouttière, et la faute n'est apparue qu'à l'audit
  visuel à 360 px. Toujours vérifier qu'un pas existe dans `tokens.css` avant
  de l'employer ; ne jamais en ajouter un pour dépanner.
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
components/       ui · brand · home · library · layout · contribution
lib/              auth · supabase · domain · library · cover · files ·
                  contributions · questions · security
styles/           tokens du Design System
supabase/         migrations SQL + tests (aucun seed de contenu)
scripts/          assets de marque, vérification du schéma, crochets de test
public/brand/     emblème officiel, rosace, marqueterie
public/home/      assets d'architecture de l'accueil (hero, meubles)
docs/             cahier des charges + Design System
```

### Commandes

```bash
npm run dev           # serveur de développement
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run test          # tests de logique pure (lanceur natif de Node)
npm run build         # build de production
npm run format:check  # Prettier (vérification)
npm run db:verify     # migrations + tests SQL sur une base jetable
npm run assets:brand  # assets de marque (masters → public/brand)
npm run assets:home   # assets d'architecture de l'accueil (→ public/home)
```

Avant tout commit :
`npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build`.

### Tests

Deux harnais, deux périmètres, aucun framework :

- **`npm run db:verify`** — la sécurité. Migrations appliquées sur une base
  jetable, puis tests de schéma et tests **négatifs** exécutés sous les vrais
  rôles PostgreSQL. C'est là que vivent les preuves de RLS.
- **`npm run test`** — la logique pure. Lanceur natif `node:test`, aucune
  dépendance ajoutée ; `scripts/test-hooks.mjs` ne fait que résoudre l'alias
  `@/` et neutraliser les modules réservés au serveur. Il ramasse les tests de
  `lib/` **et** de `components/` : un module de données posé à côté d'un
  composant — `nav-items.ts` — reste de la logique pure. Cela n'ouvre pas la
  porte aux tests de composants, qui restent exclus.

Sont couverts : validation des téléversements (déclaration du client **et**
objet réellement stocké), propriété d'un chemin de stockage, détection de
pagination par plages, assainissement du nom de fichier servi en pièce
jointe, libellés du cahier des charges, entrées de navigation selon la
session, jeton et leurre du formulaire de question, en-têtes de sécurité,
URL de bibliothèque, `safeReturnPath` et le lien `mailto:` de réponse.

**Ne sont PAS couverts, volontairement :** les composants React, le rendu, et
tout ce qui exige un navigateur. Pas de Playwright, pas de tests de
composants, pas de nouveau framework — décision du 23/09/2026.

---

## Plan de développement

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
| 11  | Refonte visuelle — direction Noyer                 | ✅   |
| 12  | Bibliothèque architecturale copte (meuble, arcs)   | ✅   |
| 13  | Accueil final — maquette validée et assets         | ✅   |
| 14  | Upload direct navigateur → Storage (50 Mo)         | ✅   |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
