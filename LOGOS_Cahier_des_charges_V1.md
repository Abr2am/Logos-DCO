docs/LOGOS_Cahier_des_charges_V1.md
## Source de vérité pour le développement

> **Une même foi, pour aujourd’hui et pour demain.**

---

## 1. Vision du projet

**Logos** est une bibliothèque numérique de ressources de catéchisme destinée au **Diocèse Copte Orthodoxe de Paris**.

Objectifs :
- trouver facilement des ressources ;
- découvrir de nouveaux supports ;
- partager ses propres cours et supports ;
- poser et recevoir des questions autour d’une ressource ;
- constituer progressivement une bibliothèque commune.

Logos doit donner l’impression d’une **bibliothèque contemporaine inspirée du patrimoine copte**, et non d’un site paroissial traditionnel.

Principes : simplicité, qualité éditoriale, recherche efficace, transmission, contribution communautaire et validation humaine.

---

## 2. Utilisateurs et rôles

### Public

Sans compte, un visiteur peut :
- consulter l’accueil ;
- parcourir la bibliothèque ;
- rechercher une ressource ;
- consulter une ressource publiée ;
- télécharger une ressource publiée ;
- poser une question sur une ressource.

### Serviteur

Un serviteur authentifié peut :
- consulter la bibliothèque publique ;
- soumettre une ressource ;
- consulter ses contributions ;
- voir leur statut ;
- corriger une ressource à corriger ;
- la resoumettre.

Son identité est enregistrée techniquement mais **jamais affichée publiquement comme auteur**.

### Administrateur

L’administrateur peut :
- voir toutes les ressources ;
- voir l’identité des déposants ;
- modifier les ressources ;
- publier ;
- demander des corrections ;
- archiver ;
- gérer/modérer les questions et réponses si nécessaire.

---

## 3. Architecture des pages

### Public
- `/` — Accueil
- `/bibliotheque` — Bibliothèque
- `/ressource/[id]` — Fiche ressource
- `/connexion` — Connexion

### Serviteur connecté
- `/partager` — Partager un cours
- `/mes-contributions` — Mes contributions

### Administration
- `/admin` — Dashboard
- `/admin/ressources/[id]` — Modération d’une ressource

### Pages explicitement exclues
- pas de `/categories`
- pas de `/admin/flags`

---

## 4. Navigation

### Desktop
**Logo | Accueil | Bibliothèque | Partager un cours | Mon compte**

### Mobile
**Logo + menu hamburger**

Menu :
- Accueil
- Bibliothèque
- Partager un cours
- Mon compte / Connexion

Pas de barre de navigation permanente en bas.

---

## 5. Bibliothèque

La Bibliothèque est une **page d’exploration**. Elle n’affiche pas immédiatement toutes les ressources.

Ordre :
1. recherche ;
2. filtres ;
3. catégories.

### 9 catégories exactes
1. Bible
2. Dogme
3. Histoire de l’Église
4. Rites & Liturgie
5. Spiritualité
6. Saints
7. Vie chrétienne
8. Formation des serviteurs
9. Divers

### Sous-catégories
Uniquement sous **Vie chrétienne** :
- Petite enfance
- Jeunesse
- Famille

Une catégorie sans sous-catégorie mène directement aux ressources.

Exemple :
**Bibliothèque → Saints → ressources**

Avec sous-catégorie :
**Bibliothèque → Vie chrétienne → Jeunesse → ressources**

---

## 6. Règle de classement

Une ressource possède **un seul emplacement** dans la bibliothèque.

Exemple :
**Saint Marc → Catégorie : Saints**

Elle n’est pas dupliquée dans Bible. Les autres chemins de découverte passent par les flags.

---

## 7. Recherche

Recherche textuelle sur :
- titre ;
- description ;
- catégorie ;
- sous-catégorie ;
- flags.

Pas de recherche dans le contenu des PDF/PPTX au MVP.

Pas de recherche sémantique/IA.

Pas d’Elasticsearch.

Une recherche depuis une catégorie peut être limitée à cette branche.

---

## 8. Flags — règle définitive

**Les flags sont du texte libre propre à chaque ressource.**

Ils ne constituent **pas** un référentiel administré.

À la soumission :
- minimum **5 flags obligatoires** ;
- texte libre ;
- autant de flags pertinents que nécessaire ;
- aucune liste prédéfinie ;
- aucune validation préalable d’un nouveau flag.

Exemple :
`Saint Marc` · `Marc` · `Évangiles` · `Apôtres` · `Discipulat` · `Jeunesse`

L’administrateur peut, lors de la validation :
- ajouter ;
- modifier ;
- corriger ;
- supprimer des flags.

Objectif : **ne jamais bloquer le référencement et faciliter au maximum la recherche.**

Il n’existe donc :
- aucun écran « Gestion des flags » ;
- aucun workflow de validation des flags ;
- aucune table de référentiel central des flags nécessaire au MVP.

---

## 9. Filtres

Filtres uniquement :
- Catégorie
- Sous-catégorie
- Flags

Plusieurs flags sélectionnés utilisent une logique **OU**.

Exemple :
`Évangiles + Jeunesse` → ressources contenant **Évangiles OU Jeunesse**.

Pas de filtre par Public.
Pas de filtre par Type.

---

## 10. Ressource et métadonnées

Chaque ressource contient :
- **Titre** — obligatoire
- **Description** — obligatoire, 1 à 3 phrases
- **Fichier** — obligatoire
- **Catégorie** — obligatoire
- **Sous-catégorie** — uniquement si applicable
- **Public** — obligatoire, multi-sélection
- **Type** — obligatoire
- **Flags** — obligatoire, minimum 5
- **Date de publication** — automatique
- **Dépositaire** — interne uniquement

### Publics
- Petite enfance
- Enfants
- Adolescents
- Jeunes adultes
- Adultes
- Familles
- Serviteurs
- Tous les publics

### Types de ressources
- Cours / présentation
- Fiche pédagogique
- Activité
- Jeu
- Support de séance
- Document
- Autre

### Formats MVP
- PDF
- DOC
- DOCX
- PPT
- PPTX
- XLS
- XLSX

Pas d’exécutables ni d’archives comme ZIP/EXE.

Lorsque possible, détecter automatiquement :
- format ;
- nombre de pages PDF ;
- nombre de diapositives PPT/PPTX.

---

## 11. Fiche ressource

Contenu :
- breadcrumb ;
- couverture ;
- titre ;
- description ;
- catégorie ;
- sous-catégorie si applicable ;
- publics ;
- type ;
- flags ;
- format ;
- nombre de pages/diapositives ;
- bouton **Télécharger la ressource**.

Pas d’auteur public.

Pas de :
- likes ;
- favoris ;
- notes ;
- ratings ;
- commentaires publics classiques.

---

## 12. Questions anonymes

Chaque ressource peut recevoir des questions.

### Questionneur
Aucun compte obligatoire.

Il renseigne :
- question ;
- adresse e-mail.

L’e-mail **n’est jamais communiqué à l’auteur**.

### Auteur / dépositaire
Reçoit une notification lorsqu’une question est posée et peut répondre.

Son identité reste cachée au questionneur.

### Administrateur
Peut voir :
- identité du questionneur ;
- e-mail ;
- identité du dépositaire ;
- question ;
- réponse ;
- historique utile à la modération.

Principe :
> **Anonymat entre utilisateurs, transparence pour l’administration.**

Les questions sont rattachées à une ressource. Ce n’est pas une messagerie générale.

---

## 13. Soumission d’une ressource

Le bouton public est **Partager un cours**.

Si non connecté → `/connexion`.

Une fois connecté → formulaire.

### Une seule page
**Pas de wizard.**

Champs :
1. Titre
2. Description
3. Fichier
4. Catégorie
5. Sous-catégorie
6. Public
7. Type
8. Flags — minimum 5

Bouton :
> **Soumettre la ressource**

Le serviteur ne publie jamais directement.

---

## 14. Workflow de publication

États :
- `DRAFT`
- `PENDING`
- `PUBLISHED`
- `REJECTED`
- `ARCHIVED`

Flux normal :
`DRAFT → PENDING → PUBLISHED → ARCHIVED`

Correction :
`PENDING → REJECTED / À corriger → PENDING`

`DRAFT` peut rester un état technique interne sans fonctionnalité brouillon avancée dans le MVP.

---

## 15. Confirmation de soumission

Après soumission :

> **Ressource soumise**

> Votre ressource a bien été transmise à l’équipe de Logos.

> Elle sera examinée par un administrateur avant d’être publiée dans la bibliothèque.

Actions :
- **Voir mes contributions**
- éventuellement **Soumettre une autre ressource**

---

## 16. Mes contributions

Le serviteur voit uniquement ses propres ressources.

Informations :
- titre ;
- catégorie ;
- type ;
- statut ;
- date de soumission ;
- action.

Statuts affichés :
- En attente
- Publiée
- À corriger
- Archivée

### Ressource à corriger
Le serviteur voit :
- le commentaire de l’administrateur ;
- **Modifier la ressource** ;
- **Resoumettre la ressource**.

Après resoumission :
`REJECTED → PENDING`

### Ressource publiée
Consultation uniquement côté serviteur dans le MVP. Pas de modification directe sans nouveau contrôle.

---

## 17. Administration

### Dashboard `/admin`
Afficher des compteurs dynamiques :
- ressources en attente ;
- ressources publiées ;
- ressources à corriger ;
- ressources archivées.

### Modération `/admin/ressources/[id]`

L’admin voit :
- couverture ;
- titre ;
- description ;
- catégorie ;
- sous-catégorie ;
- publics ;
- type ;
- flags ;
- fichier ;
- identité du dépositaire ;
- e-mail du dépositaire ;
- date de soumission.

Ces informations administratives ne sont jamais publiques.

### Actions
**Modifier**
- titre ;
- description ;
- catégorie ;
- sous-catégorie ;
- publics ;
- type ;
- flags ;
- fichier.

**Publier**
`PENDING → PUBLISHED`

**Demander des corrections**
- commentaire obligatoire ;
- `PENDING → REJECTED`

**Archiver**
- `PUBLISHED → ARCHIVED`

Le dépositaire original reste enregistré comme dépositaire même si l’admin modifie la ressource.

---

## 18. Sécurité des fichiers

- `PUBLISHED` : téléchargement public autorisé.
- `PENDING` : fichier non accessible publiquement.
- `REJECTED` : fichier non accessible publiquement.
- `ARCHIVED` : ressource retirée de la bibliothèque publique et fichier non téléchargeable publiquement.

Les fichiers privés doivent être protégés côté stockage, et pas seulement masqués dans l’interface.

---

## 19. Identité visuelle

### Palette
- bois sombre ;
- bordeaux profond ;
- ivoire ;
- or très discret.

Pas de bleu ou vert ajoutés pour différencier les catégories.

### Inspiration
- bibliothèque contemporaine ;
- bois sculpté ;
- géométrie d’iconostase copte ;
- couvertures de livres ;
- patrimoine copte.

Principe :
> **Le patrimoine est dans les détails, pas dans la surcharge.**

Éviter :
- effet « bibliothèque de brocante » ;
- musée ;
- reconstitution d’église ;
- site paroissial traditionnel ;
- surcharge d’icônes, croix, bougies, plantes ou objets décoratifs.

### Rosace
Le motif fourni par l’utilisateur est une référence graphique forte et doit rester **le plus fidèle possible à l’original**, avec adaptation des couleurs à la palette Logos si nécessaire.

---

## 20. Homepage

La homepage est **éditoriale**, pas une seconde bibliothèque.

Structure :
1. Hero : Logos + « Les ressources de catéchisme du Diocèse Copte Orthodoxe de Paris »
2. CTA : **Explorer les ressources**
3. Courte section de raison d’être
4. Recherche immédiatement après cette section
5. **Explorer par thème** avec les 9 catégories
6. **À découvrir** : quelques ressources récentes uniquement
7. CTA de contribution : **Partager un cours**

---

## 21. Responsive

### Mobile
- Logo + hamburger ;
- contenu vertical ;
- **2 ressources par ligne** ;
- couvertures suffisamment grandes et lisibles ;
- formulaire de soumission sur une seule page scrollable.

### Tablette
3 ressources par ligne.

### Desktop
3 ou 4 ressources par ligne selon largeur.

### Accueil mobile
L’accueil mobile doit davantage faire ressortir le **patrimoine copte et la géométrie de l’iconostase avec un effet fondu**, plutôt qu’un décor de bibliothèque réaliste chargé.

---

## 22. Architecture technique recommandée

### Frontend
- Next.js
- React
- TypeScript

### UI
- Tailwind CSS

### Backend / base
- Supabase
  - PostgreSQL
  - Auth
  - Storage

### Déploiement
Vercel ou équivalent.

### Versioning
Repository GitHub existant.

### Développement
Claude Code.

---

## 23. Modèle de données minimal

### User
- id
- email
- role
- created_at

Roles :
- SERVANT
- ADMIN

### Resource
- id
- title
- description
- category_id
- subcategory_id nullable
- resource_type
- audiences
- status
- depositor_id
- file_id
- created_at
- submitted_at
- published_at
- updated_at

### Category
- id
- name
- slug
- order

### Subcategory
- id
- category_id
- name
- slug
- order

### Resource flags
Les flags sont des **textes libres associés à une ressource**. Aucun référentiel central de flags n’est requis pour le MVP.

### Question
- id
- resource_id
- questioner_email
- question_text
- status
- created_at

### Answer
- id
- question_id
- answer_text
- created_at

### File
- id
- resource_id
- storage_path
- filename
- mime_type
- size
- page_count nullable
- slide_count nullable
- created_at

---

## 24. Recherche technique MVP

Utiliser PostgreSQL/Supabase.

Pas :
- Elasticsearch ;
- moteur vectoriel ;
- embeddings ;
- IA de recherche.

Le système doit rester simple, rapide et maintenable.

---

## 25. Authentification

Pour le MVP, l’architecture d’authentification doit être **isolée et remplaçable**.

Une authentification locale/demo peut être utilisée pour le développement.

Elle devra pouvoir être remplacée ensuite par le **SSO / OAuth / OIDC du Diocèse** sans reconstruire l’application.

Pas d’inscription publique.

---

# 26. HORS MVP — ne pas ajouter spontanément

- IA théologique
- validation théologique par IA
- recherche sémantique
- recherche dans PDF/PPTX
- favoris
- likes
- notes
- ratings
- commentaires publics classiques
- durée des cours
- auteur public
- création de compte public
- multi-paroisses
- multi-emplacement des ressources
- gestion centralisée des flags
- écran de gestion des flags
- page Catégories indépendante
- messagerie générale
- versioning avancé
- notifications complexes
- Elasticsearch
- microservices
- Redis
- Kubernetes

---

# 27. Règle anti-régression

Ne jamais ajouter une fonctionnalité simplement parce qu’elle semble utile ou habituelle dans une application de bibliothèque.

Avant d’ajouter une fonctionnalité :
1. vérifier si elle est explicitement présente dans cette spécification ;
2. si elle ne l’est pas, ne pas l’ajouter au MVP ;
3. ne pas créer de nouvelles catégories ;
4. ne pas transformer les flags en taxonomie ;
5. ne pas créer de workflow supplémentaire ;
6. ne pas transformer une interface simple en wizard ;
7. ne pas ajouter d’éléments décoratifs qui dégradent la lisibilité.

**La simplicité est une exigence du produit.**

---

## 28. Priorité produit

Quand un choix oppose :
> plus de fonctionnalités

à :
> plus de simplicité

pour le MVP, privilégier **la simplicité**, sauf si la fonctionnalité est explicitement définie dans ce cahier des charges.

---

# 29. État de référence

Ce document constitue la **source de vérité produit V1 de Logos**.

Toute implémentation doit respecter :
- les fonctionnalités définies ici ;
- les rôles et permissions ;
- les règles de classement ;
- les règles d’anonymat ;
- le workflow de publication ;
- la logique des flags ;
- l’identité visuelle ;
- les contraintes responsive ;
- la liste hors MVP ;
- la règle anti-régression.

Toute ambiguïté technique peut être résolue par une décision d’implémentation, mais ne doit pas modifier silencieusement une décision produit définie ici.
