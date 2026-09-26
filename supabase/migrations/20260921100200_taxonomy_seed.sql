-- =============================================================================
-- Seed de la taxonomie.
--
-- Donnée structurelle imposée par le cahier des charges, pas du contenu de
-- production : elle doit exister dans TOUS les environnements. Elle vit donc
-- dans une migration, pas dans un seed de développement.
--
-- Les identifiants sont explicites et stables ; les slugs servent d'URL
-- (/bibliotheque/[categorie] et /bibliotheque/[categorie]/[sous-categorie]).
-- =============================================================================

insert into public.categories (id, slug, name, sort_order) values
  (1, 'bible',                    'Bible',                     1),
  (2, 'dogme',                    'Dogme',                     2),
  (3, 'histoire-de-l-eglise',     'Histoire de l''Église',     3),
  (4, 'rites-et-liturgie',        'Rites & Liturgie',          4),
  (5, 'spiritualite',             'Spiritualité',              5),
  (6, 'saints',                   'Saints',                    6),
  (7, 'vie-chretienne',           'Vie chrétienne',            7),
  (8, 'formation-des-serviteurs', 'Formation des serviteurs',  8),
  (9, 'divers',                   'Divers',                    9);

-- Sous-catégories : uniquement sous « Vie chrétienne » (id 7).
insert into public.subcategories (id, category_id, slug, name, sort_order) values
  (1, 7, 'petite-enfance', 'Petite enfance', 1),
  (2, 7, 'jeunesse',       'Jeunesse',       2),
  (3, 7, 'famille',        'Famille',        3);
