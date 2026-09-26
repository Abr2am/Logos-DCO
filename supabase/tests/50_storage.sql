-- Stockage : bucket privé, cloisonnement par dépositaire.

do $$
begin
  if not exists (
    select 1 from storage.buckets where id = 'resources' and public = false
  ) then
    raise exception 'Le bucket « resources » doit exister et être privé.';
  end if;

  if exists (select 1 from storage.buckets where public) then
    raise exception 'Aucun bucket ne doit être public.';
  end if;

  -- Aucune policy n'est accordée au rôle anonyme.
  if exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and 'anon' = any (roles)
  ) then
    raise exception 'Le rôle anonyme ne doit atteindre aucun objet de stockage.';
  end if;
end;
$$;

/* Les paramètres de session ne traversent pas les fichiers psql : les
   identifiants sont relus depuis la base. */
do $$
begin
  perform set_config('t.alice',
    (select id::text from public.users where email = 'alice-rls@example.test'), false);
  perform set_config('t.bob',
    (select id::text from public.users where email = 'bob-rls@example.test'), false);
  perform set_config('t.admin',
    (select id::text from public.users where email = 'admin-rls@example.test'), false);

  -- Dépôt d'un objet sous le préfixe d'Alice, côté serveur.
  insert into storage.objects (bucket_id, name)
  values ('resources', current_setting('t.alice') || '/doc/fichier.pdf');
end;
$$;

begin;
set local role authenticated;

do $$
declare v_n int;
begin
  -- Bob ne voit pas l'objet d'Alice.
  perform set_config('app.user_id', current_setting('t.bob'), true);
  select count(*) into v_n from storage.objects;
  if v_n <> 0 then
    raise exception 'Un serviteur ne doit pas voir les fichiers d''un autre (vu %).', v_n;
  end if;

  -- Et ne peut pas écrire sous le préfixe d'un autre.
  begin
    insert into storage.objects (bucket_id, name)
    values ('resources', current_setting('t.alice') || '/doc/intrus.pdf');
    raise exception 'Un serviteur ne doit pas pouvoir écrire sous le préfixe d''un autre.';
  exception when insufficient_privilege then null;
  end;

  -- Alice voit le sien.
  perform set_config('app.user_id', current_setting('t.alice'), true);
  select count(*) into v_n from storage.objects;
  if v_n <> 1 then
    raise exception 'Le dépositaire doit voir son propre fichier (vu %).', v_n;
  end if;

  -- L'administration voit tout.
  perform set_config('app.user_id', current_setting('t.admin'), true);
  select count(*) into v_n from storage.objects;
  if v_n <> 1 then
    raise exception 'L''administration doit voir tous les fichiers (vu %).', v_n;
  end if;
end;
$$;
rollback;

\echo '  ✓ stockage'
