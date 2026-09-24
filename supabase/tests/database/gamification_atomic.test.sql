begin;

create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

create temporary table aa_gamification_test_ids (
  owner_id uuid not null,
  task_same uuid not null,
  task_profile_a uuid not null,
  task_profile_b uuid not null,
  task_failure uuid not null,
  helper_schema text not null
) on commit drop;

insert into aa_gamification_test_ids (
  owner_id,
  task_same,
  task_profile_a,
  task_profile_b,
  task_failure,
  helper_schema
)
select
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  'aa_gamification_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

select extensions.plan(17);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.complete_study_task_with_reward(uuid)',
    'EXECUTE'
  ),
  'authenticated can execute the atomic reward RPC'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.complete_study_task_with_reward(uuid)',
    'EXECUTE'
  ),
  'anon cannot execute the atomic reward RPC'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'public.gamification_profiles',
    'UPDATE'
  ),
  'authenticated cannot directly update gamification profile XP'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'public.missions',
    'INSERT,UPDATE,DELETE'
  ),
  'authenticated cannot directly mutate missions'
);

select extensions.dblink_connect(
  'aa_setup',
  'dbname=postgres user=postgres password=postgres'
);

select extensions.dblink_exec(
  'aa_setup',
  format(
    $sql$
      insert into auth.users (id, email)
      values (%L::uuid, %L);
    $sql$,
    (select owner_id from aa_gamification_test_ids),
    'aa-gamification-' ||
      replace((select owner_id::text from aa_gamification_test_ids), '-', '') ||
      '@example.test'
  )
);

select extensions.dblink_exec(
  'aa_setup',
  format(
    $sql$
      create schema %I;

      create function %I.complete_and_hold(
        p_task_id uuid,
        p_hold_seconds double precision
      )
      returns text
      language plpgsql
      security invoker
      set search_path = ''
      as $fn$
      begin
        perform public.complete_study_task_with_reward(p_task_id);
        perform pg_catalog.pg_sleep(p_hold_seconds);
        return 'ok';
      end;
      $fn$;
    $sql$,
    (select helper_schema from aa_gamification_test_ids),
    (select helper_schema from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_setup',
  format(
    $sql$
      insert into public.study_tasks (id, owner_id, title)
      values (%L::uuid, %L::uuid, 'Concorrência - mesma tarefa');
    $sql$,
    (select task_same from aa_gamification_test_ids),
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_setup',
  format(
    $sql$
      insert into public.study_tasks (id, owner_id, title)
      values
        (%L::uuid, %L::uuid, 'Concorrência - criação do perfil A'),
        (%L::uuid, %L::uuid, 'Concorrência - criação do perfil B');
    $sql$,
    (select task_profile_a from aa_gamification_test_ids),
    (select owner_id from aa_gamification_test_ids),
    (select task_profile_b from aa_gamification_test_ids),
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_setup',
  format(
    $sql$
      insert into public.gamification_profiles (
        owner_id,
        xp,
        streak_days,
        last_active_on
      )
      values (%L::uuid, 2147483640, 7, current_date);
    $sql$,
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_setup',
  format(
    $sql$
      insert into public.study_tasks (id, owner_id, title)
      values (%L::uuid, %L::uuid, 'Falha transacional');
    $sql$,
    (select task_failure from aa_gamification_test_ids),
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_disconnect('aa_setup');

select extensions.dblink_connect('aa_same_a', 'dbname=postgres user=postgres password=postgres');
select extensions.dblink_connect('aa_same_b', 'dbname=postgres user=postgres password=postgres');

select extensions.dblink_exec(
  'aa_same_a',
  format(
    'select set_config(''request.jwt.claim.sub'', %L, false)',
    (select owner_id::text from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_same_b',
  format(
    'select set_config(''request.jwt.claim.sub'', %L, false)',
    (select owner_id::text from aa_gamification_test_ids)
  )
);

select extensions.dblink_send_query(
  'aa_same_a',
  format(
    'select %I.complete_and_hold(%L::uuid, 0.50)',
    (select helper_schema from aa_gamification_test_ids),
    (select task_same from aa_gamification_test_ids)
  )
);

select pg_catalog.pg_sleep(0.05);

select extensions.dblink_send_query(
  'aa_same_b',
  format(
    'select %I.complete_and_hold(%L::uuid, 0.00)',
    (select helper_schema from aa_gamification_test_ids),
    (select task_same from aa_gamification_test_ids)
  )
);

do $$
declare
  v_a text;
  v_b text;
begin
  while extensions.dblink_is_busy('aa_same_a')
     or extensions.dblink_is_busy('aa_same_b')
  loop
    perform pg_catalog.pg_sleep(0.02);
  end loop;

  select result into v_a
  from extensions.dblink_get_result('aa_same_a') as r(result text);

  select result into v_b
  from extensions.dblink_get_result('aa_same_b') as r(result text);

  execute
    'create temp table if not exists aa_concurrency_results (' ||
    'name text primary key, value text not null) on commit drop';

  insert into aa_concurrency_results(name, value)
  values ('same_a', coalesce(v_a, 'null')), ('same_b', coalesce(v_b, 'null'))
  on conflict (name) do update
    set value = excluded.value;

exception
  when others then
    insert into aa_concurrency_results(name, value)
    values ('same_a', 'error:' || sqlerrm), ('same_b', 'error')
    on conflict (name) do update
      set value = excluded.value;
end;
$$;

select extensions.ok(
  (select value from aa_concurrency_results where name = 'same_a') = 'ok',
  'first concurrent completion succeeds'
);

select extensions.ok(
  (select value from aa_concurrency_results where name = 'same_b') = 'ok',
  'second concurrent completion is idempotent'
);

select extensions.is(
  (
    select status
    from public.study_tasks
    where id = (select task_same from aa_gamification_test_ids)
  ),
  'completed',
  'concurrent completion leaves the task completed'
);

select extensions.is(
  (
    select xp
    from public.gamification_profiles
    where owner_id = (select owner_id from aa_gamification_test_ids)
  ),
  2147483650,
  'first concurrent completion awards exactly one daily reward'
);

select extensions.is(
  (
    select count(*)::integer
    from public.missions
    where owner_id = (select owner_id from aa_gamification_test_ids)
      and code = 'complete-study-task'
      and target_date = current_date
  ),
  1,
  'concurrent completion creates one daily mission'
);

select extensions.dblink_disconnect('aa_same_a');
select extensions.dblink_disconnect('aa_same_b');

select extensions.dblink_connect('aa_reset_1', 'dbname=postgres user=postgres password=postgres');

select extensions.dblink_exec(
  'aa_reset_1',
  format(
    'delete from public.missions where owner_id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_reset_1',
  format(
    'delete from public.study_tasks where owner_id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_reset_1',
  format(
    'delete from public.gamification_profiles where owner_id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_reset_1',
  format(
    $sql$
      insert into public.study_tasks (id, owner_id, title)
      values
        (%L::uuid, %L::uuid, 'Concorrência - criação do perfil A'),
        (%L::uuid, %L::uuid, 'Concorrência - criação do perfil B');
    $sql$,
    (select task_profile_a from aa_gamification_test_ids),
    (select owner_id from aa_gamification_test_ids),
    (select task_profile_b from aa_gamification_test_ids),
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_disconnect('aa_reset_1');

select extensions.dblink_connect('aa_profile_a', 'dbname=postgres user=postgres password=postgres');
select extensions.dblink_connect('aa_profile_b', 'dbname=postgres user=postgres password=postgres');

select extensions.dblink_exec(
  'aa_profile_a',
  format(
    'select set_config(''request.jwt.claim.sub'', %L, false)',
    (select owner_id::text from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_profile_b',
  format(
    'select set_config(''request.jwt.claim.sub'', %L, false)',
    (select owner_id::text from aa_gamification_test_ids)
  )
);

select extensions.dblink_send_query(
  'aa_profile_a',
  format(
    'select %I.complete_and_hold(%L::uuid, 0.50)',
    (select helper_schema from aa_gamification_test_ids),
    (select task_profile_a from aa_gamification_test_ids)
  )
);

select pg_catalog.pg_sleep(0.05);

select extensions.dblink_send_query(
  'aa_profile_b',
  format(
    'select %I.complete_and_hold(%L::uuid, 0.00)',
    (select helper_schema from aa_gamification_test_ids),
    (select task_profile_b from aa_gamification_test_ids)
  )
);

do $$
declare
  v_a text;
  v_b text;
begin
  while extensions.dblink_is_busy('aa_profile_a')
     or extensions.dblink_is_busy('aa_profile_b')
  loop
    perform pg_catalog.pg_sleep(0.02);
  end loop;

  select result into v_a
  from extensions.dblink_get_result('aa_profile_a') as r(result text);

  select result into v_b
  from extensions.dblink_get_result('aa_profile_b') as r(result text);

  update aa_concurrency_results
  set value = coalesce(v_a, 'null')
  where name = 'profile_a';

  insert into aa_concurrency_results(name, value)
  values ('profile_a', coalesce(v_a, 'null')), ('profile_b', coalesce(v_b, 'null'))
  on conflict (name) do update
    set value = excluded.value;

exception
  when others then
    insert into aa_concurrency_results(name, value)
    values ('profile_a', 'error:' || sqlerrm), ('profile_b', 'error')
    on conflict (name) do update
      set value = excluded.value;
end;
$$;

select extensions.ok(
  (select value from aa_concurrency_results where name = 'profile_a') = 'ok',
  'concurrent first access can initialize the profile'
);

select extensions.ok(
  (select value from aa_concurrency_results where name = 'profile_b') = 'ok',
  'second concurrent first access does not hit a duplicate-profile failure'
);

select extensions.is(
  (
    select count(*)::integer
    from public.gamification_profiles
    where owner_id = (select owner_id from aa_gamification_test_ids)
  ),
  1,
  'concurrent first access leaves exactly one gamification profile'
);

select extensions.is(
  (
    select xp
    from public.gamification_profiles
    where owner_id = (select owner_id from aa_gamification_test_ids)
  ),
  10,
  'concurrent first access preserves the single daily reward without losing the XP update'
);

select extensions.dblink_disconnect('aa_profile_a');
select extensions.dblink_disconnect('aa_profile_b');

select extensions.dblink_connect('aa_reset_2', 'dbname=postgres user=postgres password=postgres');

select extensions.dblink_exec(
  'aa_reset_2',
  format(
    'delete from public.missions where owner_id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_reset_2',
  format(
    'delete from public.study_tasks where owner_id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_reset_2',
  format(
    'delete from public.gamification_profiles where owner_id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_reset_2',
  format(
    $sql$
      insert into public.gamification_profiles (
        owner_id,
        xp,
        streak_days,
        last_active_on
      )
      values (%L::uuid, 2147483640, 7, current_date);

      insert into public.study_tasks (id, owner_id, title)
      values (%L::uuid, %L::uuid, 'Falha transacional');
    $sql$,
    (select owner_id from aa_gamification_test_ids),
    (select task_failure from aa_gamification_test_ids),
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_disconnect('aa_reset_2');

set local request.jwt.claim.sub = (
  select owner_id::text from aa_gamification_test_ids
);

select extensions.throws_ok(
  format(
    'select * from public.complete_study_task_with_reward(%L::uuid)',
    (select task_failure from aa_gamification_test_ids)
  ),
  '22003',
  null,
  'reward overflow fails as a database error'
);

select extensions.is(
  (
    select status
    from public.study_tasks
    where id = (select task_failure from aa_gamification_test_ids)
  ),
  'pending',
  'failed reward does not commit task completion'
);

select extensions.is(
  (
    select xp
    from public.gamification_profiles
    where owner_id = (select owner_id from aa_gamification_test_ids)
  ),
  2147483640,
  'failed reward does not modify XP'
);

select extensions.is(
  (
    select count(*)::integer
    from public.missions
    where owner_id = (select owner_id from aa_gamification_test_ids)
  ),
  0,
  'failed reward leaves no mission completion behind'
);

select extensions.dblink_connect('aa_cleanup', 'dbname=postgres user=postgres password=postgres');

select extensions.dblink_exec(
  'aa_cleanup',
  format(
    'delete from public.missions where owner_id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_cleanup',
  format(
    'delete from public.study_tasks where owner_id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_cleanup',
  format(
    'delete from public.gamification_profiles where owner_id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_cleanup',
  format(
    'delete from auth.users where id = %L::uuid',
    (select owner_id from aa_gamification_test_ids)
  )
);

select extensions.dblink_exec(
  'aa_cleanup',
  format(
    'drop schema %I cascade',
    (select helper_schema from aa_gamification_test_ids)
  )
);

select extensions.dblink_disconnect('aa_cleanup');

select * from extensions.finish();

rollback;
