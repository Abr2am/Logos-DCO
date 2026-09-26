-- API de bibliothèque : recherche, accents, filtres, logique OU.

do $$
declare
  v_dep uuid := t.new_member('api@example.test', 'SERVANT');
  v_a uuid;
  v_b uuid;

begin
  /* Ressource A : « Histoire de l'Église », catégorie qu'aucun autre fichier
     de test n'utilise — les assertions restent indépendantes des fixtures
     précédentes, qui sont committées. */
  insert into public.resources
    (title, description, category_id, resource_type, audiences, depositor_id)
  values ('Saint Marc et l''Église d''Alexandrie', 'Quatre séances.',
          3, 'COURS_PRESENTATION', array['ADOLESCENTS']::public.audience[], v_dep)
  returning id into v_a;
  insert into public.resource_flags (resource_id, flag, sort_order)
  values (v_a, 'Évangiles', 1), (v_a, 'Apôtres', 2), (v_a, 'Discipulat', 3),
         (v_a, 'Marc', 4), (v_a, 'Jeunesse', 5);
  perform t.add_file(v_a);
  update public.resources set status = 'PENDING'   where id = v_a;
  update public.resources set status = 'PUBLISHED' where id = v_a;

  -- Ressource B : Vie chrétienne → Jeunesse.
  insert into public.resources
    (title, description, category_id, subcategory_id, resource_type, audiences, depositor_id)
  values ('Préparer une veillée', 'Un déroulé complet pour les animateurs.',
          7, 2, 'SUPPORT_DE_SEANCE', array['JEUNES_ADULTES']::public.audience[], v_dep)
  returning id into v_b;
  insert into public.resource_flags (resource_id, flag, sort_order)
  values (v_b, 'Veillée', 1), (v_b, 'Animation', 2), (v_b, 'Prière', 3),
         (v_b, 'Groupe', 4), (v_b, 'Jeunesse', 5);
  perform t.add_file(v_b);
  update public.resources set status = 'PENDING'   where id = v_b;
  update public.resources set status = 'PUBLISHED' where id = v_b;

  -- Ressource C : jamais publiée, ne doit apparaître nulle part.
  insert into public.resources
    (title, description, category_id, resource_type, audiences, depositor_id)
  values ('Brouillon Église', 'Non publiée.', 3, 'DOCUMENT',
          array['ADULTES']::public.audience[], v_dep);

  perform set_config('t.api_a', v_a::text, false);
  perform set_config('t.api_b', v_b::text, false);
end;
$$;

-- Recherche insensible aux accents — point Q.
do $$
declare v_n int;
begin
  select count(*) into v_n
    from public.search_published_resources('eglise')
   where id = current_setting('t.api_a')::uuid;
  if v_n <> 1 then
    raise exception '« eglise » doit trouver « Église » (vu %).', v_n;
  end if;

  select count(*) into v_n
    from public.search_published_resources('Église')
   where id = current_setting('t.api_a')::uuid;
  if v_n <> 1 then
    raise exception '« Église » doit se trouver lui-même (vu %).', v_n;
  end if;

  select count(*) into v_n from public.search_published_resources('veillee');
  if v_n <> 1 then
    raise exception '« veillee » doit trouver « veillée » (vu %).', v_n;
  end if;

  select count(*) into v_n from public.search_published_resources('EVANGILES');
  if v_n <> 1 then
    raise exception 'La recherche doit porter sur les flags, sans accent ni casse (vu %).', v_n;
  end if;

  select count(*) into v_n from public.search_published_resources('seances');
  if v_n <> 1 then
    raise exception 'La recherche doit porter sur la description (vu %).', v_n;
  end if;

  select count(*) into v_n from public.search_published_resources('chretienne');
  if v_n <> 1 then
    raise exception 'La recherche doit porter sur le nom de catégorie (vu %).', v_n;
  end if;
end;
$$;

-- Une ressource non publiée n'est jamais atteignable.
do $$
declare v_n int;
begin
  select count(*) into v_n from public.search_published_resources('brouillon');
  if v_n <> 0 then
    raise exception 'Une ressource non publiée ne doit jamais remonter (vu %).', v_n;
  end if;
end;
$$;

-- Filtrage par branche.
do $$
declare v_n int;
begin
  select count(*) into v_n
    from public.search_published_resources(null, 'histoire-de-l-eglise');
  if v_n <> 1 then
    raise exception 'Le filtre de catégorie est incorrect (vu %).', v_n;
  end if;

  select count(*) into v_n
    from public.search_published_resources(null, 'vie-chretienne', 'jeunesse');
  if v_n <> 1 then
    raise exception 'Le filtre de sous-catégorie est incorrect (vu %).', v_n;
  end if;

  select count(*) into v_n
    from public.search_published_resources(null, 'vie-chretienne', 'famille');
  if v_n <> 0 then
    raise exception 'Une sous-catégorie vide doit ne rien renvoyer (vu %).', v_n;
  end if;

  -- Recherche limitée à une branche.
  select count(*) into v_n
    from public.search_published_resources('jeunesse', 'histoire-de-l-eglise');
  if v_n <> 1 then
    raise exception 'La recherche de branche est incorrecte (vu %).', v_n;
  end if;
end;
$$;

-- Flags : plusieurs valeurs = logique OU.
do $$
declare v_n int;
begin
  select count(*) into v_n
    from public.search_published_resources(null, null, null, array['Jeunesse']);
  if v_n <> 2 then
    raise exception 'Un flag partagé doit remonter les deux ressources (vu %).', v_n;
  end if;

  select count(*) into v_n
    from public.search_published_resources(null, null, null, array['Apôtres', 'Animation']);
  if v_n <> 2 then
    raise exception 'Plusieurs flags doivent se combiner en OU (vu %).', v_n;
  end if;

  select count(*) into v_n
    from public.search_published_resources(null, null, null, array['apotres']);
  if v_n <> 1 then
    raise exception 'Le filtre de flag doit ignorer accents et casse (vu %).', v_n;
  end if;

  select count(*) into v_n
    from public.search_published_resources(null, null, null, array['Inexistant']);
  if v_n <> 0 then
    raise exception 'Un flag inconnu ne doit rien renvoyer (vu %).', v_n;
  end if;
end;
$$;

-- Facettes de flags, limitées à la branche.
do $$
declare v_n int;
begin
  select count(*) into v_n from public.published_flags('histoire-de-l-eglise');
  if v_n <> 5 then
    raise exception 'Cinq flags sont attendus dans cette branche (vu %).', v_n;
  end if;

  select count(*) into v_n
    from public.published_flags('vie-chretienne', 'jeunesse');
  if v_n <> 5 then
    raise exception 'Cinq flags sont attendus dans « Jeunesse » (vu %).', v_n;
  end if;
end;
$$;

-- Le tri des flags ne dépend pas de la collation de la base.
do $$
declare v text[];
begin
  select array_agg(flag order by ordinality) into v
    from public.published_flags('histoire-de-l-eglise') with ordinality;

  /* « Évangiles » doit se placer entre « Discipulat » et « Jeunesse » ; en
     collation C, un tri direct le renverrait après « Marc ». */
  if v <> array['Apôtres', 'Discipulat', 'Évangiles', 'Jeunesse', 'Marc'] then
    raise exception 'Tri des flags incorrect : %', v;
  end if;
end;
$$;

-- Le rôle anonyme peut interroger l'API, et rien d'autre.
begin;
set local role anon;
do $$
declare v_n int;
begin
  select count(*) into v_n from public.search_published_resources('eglise');
  if v_n <> 1 then
    raise exception 'Le public doit pouvoir rechercher (vu %).', v_n;
  end if;
  select count(*) into v_n from public.published_flags('histoire-de-l-eglise');
  if v_n <> 5 then
    raise exception 'Le public doit pouvoir lister les flags (vu %).', v_n;
  end if;

  /* Le filtrage par flag emprunte `normalize_text`, donc `unaccent`, qui vit
     dans un schéma sur lequel le rôle anonyme n'a pas forcément USAGE : ce
     chemin doit être vérifié SOUS le rôle anonyme, pas en tant que
     propriétaire. */
  select count(*) into v_n
    from public.search_published_resources(null, null, null, array['Jeunesse']);
  if v_n <> 2 then
    raise exception 'Le public doit pouvoir filtrer par flag (vu %).', v_n;
  end if;

  select count(*) into v_n
    from public.search_published_resources(null, null, null, array['apotres']);
  if v_n <> 1 then
    raise exception 'Le filtre de flag doit ignorer les accents pour le public (vu %).', v_n;
  end if;
end;
$$;
rollback;

\echo '  ✓ API bibliothèque'
