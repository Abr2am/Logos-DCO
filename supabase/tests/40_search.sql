-- Recherche : le vecteur agrège titre, description, catégorie, sous-catégorie
-- et flags.

do $$
declare
  v_dep uuid := t.new_member('search@example.test', 'SERVANT');
  v_res uuid;
  v_vector tsvector;
begin
  insert into public.resources
    (title, description, category_id, subcategory_id, resource_type, audiences, depositor_id)
  values ('Saint Marc, apôtre', 'Un parcours en quatre séances.',
          7, 2, 'COURS_PRESENTATION',
          array['ADOLESCENTS']::public.audience[], v_dep)
  returning id into v_res;

  insert into public.resource_flags (resource_id, flag, sort_order)
  values (v_res, 'Évangiles', 1);

  select search_vector into v_vector from public.resources where id = v_res;

  if not (v_vector @@ to_tsquery('french', 'marc')) then
    raise exception 'Le titre doit être indexé.';
  end if;
  if not (v_vector @@ to_tsquery('french', 'séances')) then
    raise exception 'La description doit être indexée.';
  end if;
  if not (v_vector @@ to_tsquery('french', 'chrétienne')) then
    raise exception 'La catégorie doit être indexée.';
  end if;
  if not (v_vector @@ to_tsquery('french', 'jeunesse')) then
    raise exception 'La sous-catégorie doit être indexée.';
  end if;
  if not (v_vector @@ to_tsquery('french', 'évangiles')) then
    raise exception 'Les flags doivent être indexés.';
  end if;

  -- Le retrait d'un flag met le vecteur à jour.
  delete from public.resource_flags where resource_id = v_res;
  select search_vector into v_vector from public.resources where id = v_res;
  if v_vector @@ to_tsquery('french', 'évangiles') then
    raise exception 'Le vecteur doit être rafraîchi au retrait d''un flag.';
  end if;
end;
$$;

\echo '  ✓ recherche'
