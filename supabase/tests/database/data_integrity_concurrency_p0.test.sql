begin;

create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

set statement_timeout = '20s';
set lock_timeout = '5s';

select extensions.plan(12);

select extensions.dblink_connect_u(
  'aa_ic_setup',
  'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres'
);

select extensions.dblink_exec(
  'aa_ic_setup',
  $sql$
    drop schema if exists aa_integrity_concurrency cascade;
    create schema aa_integrity_concurrency;

    insert into auth.users (id, email)
    values
      ('c1000000-0000-4000-8000-000000000001', 'concurrency-a@example.test'),
      ('c1000000-0000-4000-8000-000000000002', 'concurrency-b@example.test');

    insert into public.grimoires (id, owner_id, title)
    values (
      'c2000000-0000-4000-8000-000000000001',
      'c1000000-0000-4000-8000-000000000001',
      'Concurrency Grimoire'
    );

    insert into public.notebooks (id, grimoire_id, title, position)
    values (
      'c3000000-0000-4000-8000-000000000001',
      'c2000000-0000-4000-8000-000000000001',
      'Concurrency Notebook',
      0
    );

    insert into public.chapters (id, notebook_id, title, position)
    values (
      'c4000000-0000-4000-8000-000000000001',
      'c3000000-0000-4000-8000-000000000001',
      'Concurrency Chapter',
      0
    );

    insert into public.pages (id, chapter_id, title, position)
    values
      (
        'c5000000-0000-4000-8000-000000000001',
        'c4000000-0000-4000-8000-000000000001',
        'Concurrency Page A',
        0
      ),
      (
        'c5000000-0000-4000-8000-000000000002',
        'c4000000-0000-4000-8000-000000000001',
        'Concurrency Page B',
        1
      ),
      (
        'c5000000-0000-4000-8000-000000000003',
        'c4000000-0000-4000-8000-000000000001',
        'Concurrency Page C',
        2
      );

    create function aa_integrity_concurrency.try_friend_insert(
      p_requester uuid,
      p_recipient uuid,
      p_delay double precision
    )
    returns text
    language plpgsql
    security invoker
    set search_path = ''
    as $fn$
    begin
      perform pg_catalog.pg_sleep(p_delay);

      insert into public.friend_connections (
        requester_id,
        recipient_id
      )
      values (p_requester, p_recipient);

      return 'inserted';
    exception
      when unique_violation then
        return 'unique_violation';
    end;
    $fn$;

    create function aa_integrity_concurrency.upsert_progress(
      p_owner uuid,
      p_page uuid,
      p_delay double precision
    )
    returns text
    language plpgsql
    security invoker
    set search_path = ''
    as $fn$
    begin
      perform pg_catalog.pg_sleep(p_delay);

      insert into public.page_progress (
        owner_id,
        page_id,
        status,
        completed_at,
        updated_at
      )
      values (
        p_owner,
        p_page,
        'in-progress',
        null,
        pg_catalog.now()
      )
      on conflict (owner_id, page_id)
      do update
        set status = 'in-progress',
            completed_at = null,
            updated_at = pg_catalog.now();

      return 'ok';
    end;
    $fn$;

    revoke all on function aa_integrity_concurrency.try_friend_insert(
      uuid, uuid, double precision
    ) from public;
    revoke all on function aa_integrity_concurrency.upsert_progress(
      uuid, uuid, double precision
    ) from public;

    grant usage on schema aa_integrity_concurrency to authenticated;
    grant execute on function aa_integrity_concurrency.try_friend_insert(
      uuid, uuid, double precision
    ) to authenticated;
    grant execute on function aa_integrity_concurrency.upsert_progress(
      uuid, uuid, double precision
    ) to authenticated;
  $sql$
);

select extensions.dblink_disconnect('aa_ic_setup');

create temporary table aa_integrity_concurrency_results (
  name text primary key,
  value text not null
) on commit drop;

-- Concurrent workspace ordering.

select extensions.dblink_connect_u(
  'aa_move_a',
  'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres'
);
select extensions.dblink_connect_u(
  'aa_move_b',
  'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres'
);

select extensions.dblink_exec(
  'aa_move_a',
  $sql$
    set role authenticated;
    do $fn$
    begin
      perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        'c1000000-0000-4000-8000-000000000001',
        false
      );
      perform pg_catalog.set_config(
        'request.jwt.claims',
        '{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated"}',
        false
      );
    end
    $fn$;
    set statement_timeout = 5000;
    set lock_timeout = 3000;
  $sql$
);

select extensions.dblink_exec(
  'aa_move_b',
  $sql$
    set role authenticated;
    do $fn$
    begin
      perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        'c1000000-0000-4000-8000-000000000001',
        false
      );
      perform pg_catalog.set_config(
        'request.jwt.claims',
        '{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated"}',
        false
      );
    end
    $fn$;
    set statement_timeout = 5000;
    set lock_timeout = 3000;
  $sql$
);

select extensions.dblink_send_query(
  'aa_move_a',
  $sql$
    select public.move_workspace_page(
      'c5000000-0000-4000-8000-000000000001',
      'down'
    )::text
  $sql$
);

select pg_catalog.pg_sleep(0.02);

select extensions.dblink_send_query(
  'aa_move_b',
  $sql$
    select public.move_workspace_page(
      'c5000000-0000-4000-8000-000000000001',
      'down'
    )::text
  $sql$
);

do $$
declare
  v_a text;
  v_b text;
begin
  select result into v_a
  from extensions.dblink_get_result('aa_move_a') as r(result text);

  select result into v_b
  from extensions.dblink_get_result('aa_move_b') as r(result text);

  insert into aa_integrity_concurrency_results(name, value)
  values
    ('move_a', coalesce(v_a, 'null')),
    ('move_b', coalesce(v_b, 'null'));
end;
$$;

select extensions.ok(
  (select value like '%c5000000-0000-4000-8000-000000000001%'
     from aa_integrity_concurrency_results where name = 'move_a'),
  'first concurrent page move completes'
);

select extensions.ok(
  (select value like '%c5000000-0000-4000-8000-000000000001%'
     from aa_integrity_concurrency_results where name = 'move_b'),
  'second concurrent page move completes'
);

select extensions.is(
  (
    select value
    from extensions.dblink(
      'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres',
      $sql$
        select count(distinct position)::integer
        from public.pages
        where chapter_id = 'c4000000-0000-4000-8000-000000000001'
      $sql$
    ) as t(value integer)
  ),
  3,
  'concurrent page moves leave three distinct positions'
);

select extensions.is(
  (
    select value
    from extensions.dblink(
      'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres',
      $sql$
        select position::integer
        from public.pages
        where id = 'c5000000-0000-4000-8000-000000000001'
      $sql$
    ) as t(value integer)
  ),
  2,
  'two serialized down moves leave the target page at position two'
);

select extensions.dblink_disconnect('aa_move_a');
select extensions.dblink_disconnect('aa_move_b');

-- Concurrent reverse friendship requests.

select extensions.dblink_connect_u(
  'aa_friend_a',
  'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres'
);
select extensions.dblink_connect_u(
  'aa_friend_b',
  'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres'
);

select extensions.dblink_exec(
  'aa_friend_a',
  $sql$
    set role authenticated;
    do $fn$
    begin
      perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        'c1000000-0000-4000-8000-000000000001',
        false
      );
      perform pg_catalog.set_config(
        'request.jwt.claims',
        '{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated"}',
        false
      );
    end
    $fn$;
    set statement_timeout = 5000;
    set lock_timeout = 3000;
  $sql$
);

select extensions.dblink_exec(
  'aa_friend_b',
  $sql$
    set role authenticated;
    do $fn$
    begin
      perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        'c1000000-0000-4000-8000-000000000002',
        false
      );
      perform pg_catalog.set_config(
        'request.jwt.claims',
        '{"sub":"c1000000-0000-4000-8000-000000000002","role":"authenticated"}',
        false
      );
    end
    $fn$;
    set statement_timeout = 5000;
    set lock_timeout = 3000;
  $sql$
);

select extensions.dblink_send_query(
  'aa_friend_a',
  $sql$
    select aa_integrity_concurrency.try_friend_insert(
      'c1000000-0000-4000-8000-000000000001',
      'c1000000-0000-4000-8000-000000000002',
      0.10
    )
  $sql$
);

select extensions.dblink_send_query(
  'aa_friend_b',
  $sql$
    select aa_integrity_concurrency.try_friend_insert(
      'c1000000-0000-4000-8000-000000000002',
      'c1000000-0000-4000-8000-000000000001',
      0.10
    )
  $sql$
);

do $$
declare
  v_a text;
  v_b text;
begin
  select result into v_a
  from extensions.dblink_get_result('aa_friend_a') as r(result text);

  select result into v_b
  from extensions.dblink_get_result('aa_friend_b') as r(result text);

  insert into aa_integrity_concurrency_results(name, value)
  values
    ('friend_a', coalesce(v_a, 'null')),
    ('friend_b', coalesce(v_b, 'null'));
end;
$$;

select extensions.is(
  (
    select count(*)::integer
    from aa_integrity_concurrency_results
    where name in ('friend_a', 'friend_b')
      and value = 'inserted'
  ),
  1,
  'exactly one concurrent friendship insert succeeds'
);

select extensions.is(
  (
    select count(*)::integer
    from aa_integrity_concurrency_results
    where name in ('friend_a', 'friend_b')
      and value = 'unique_violation'
  ),
  1,
  'the competing friendship insert is rejected by uniqueness'
);

select extensions.is(
  (
    select value
    from extensions.dblink(
      'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres',
      $sql$
        select count(*)::integer
        from public.friend_connections
        where least(requester_id, recipient_id)
                = 'c1000000-0000-4000-8000-000000000001'::uuid
          and greatest(requester_id, recipient_id)
                = 'c1000000-0000-4000-8000-000000000002'::uuid
      $sql$
    ) as t(value integer)
  ),
  1,
  'friendship race leaves one relationship row'
);

select extensions.is(
  (
    select value
    from extensions.dblink(
      'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres',
      $sql$
        select status
        from public.friend_connections
        where least(requester_id, recipient_id)
                = 'c1000000-0000-4000-8000-000000000001'::uuid
          and greatest(requester_id, recipient_id)
                = 'c1000000-0000-4000-8000-000000000002'::uuid
      $sql$
    ) as t(value text)
  ),
  'pending',
  'friendship race preserves the canonical initial state'
);

select extensions.dblink_disconnect('aa_friend_a');
select extensions.dblink_disconnect('aa_friend_b');

-- Concurrent owner/page progress upsert.

select extensions.dblink_connect_u(
  'aa_progress_a',
  'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres'
);
select extensions.dblink_connect_u(
  'aa_progress_b',
  'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres'
);

select extensions.dblink_exec(
  'aa_progress_a',
  $sql$
    set role authenticated;
    do $fn$
    begin
      perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        'c1000000-0000-4000-8000-000000000001',
        false
      );
      perform pg_catalog.set_config(
        'request.jwt.claims',
        '{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated"}',
        false
      );
    end
    $fn$;
    set statement_timeout = 5000;
    set lock_timeout = 3000;
  $sql$
);

select extensions.dblink_exec(
  'aa_progress_b',
  $sql$
    set role authenticated;
    do $fn$
    begin
      perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        'c1000000-0000-4000-8000-000000000001',
        false
      );
      perform pg_catalog.set_config(
        'request.jwt.claims',
        '{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated"}',
        false
      );
    end
    $fn$;
    set statement_timeout = 5000;
    set lock_timeout = 3000;
  $sql$
);

select extensions.dblink_send_query(
  'aa_progress_a',
  $sql$
    select aa_integrity_concurrency.upsert_progress(
      'c1000000-0000-4000-8000-000000000001',
      'c5000000-0000-4000-8000-000000000001',
      0.10
    )
  $sql$
);

select extensions.dblink_send_query(
  'aa_progress_b',
  $sql$
    select aa_integrity_concurrency.upsert_progress(
      'c1000000-0000-4000-8000-000000000001',
      'c5000000-0000-4000-8000-000000000001',
      0.10
    )
  $sql$
);

do $$
declare
  v_a text;
  v_b text;
begin
  select result into v_a
  from extensions.dblink_get_result('aa_progress_a') as r(result text);

  select result into v_b
  from extensions.dblink_get_result('aa_progress_b') as r(result text);

  insert into aa_integrity_concurrency_results(name, value)
  values
    ('progress_a', coalesce(v_a, 'null')),
    ('progress_b', coalesce(v_b, 'null'));
end;
$$;

select extensions.is(
  (select value from aa_integrity_concurrency_results where name = 'progress_a'),
  'ok',
  'first concurrent progress upsert succeeds'
);

select extensions.is(
  (select value from aa_integrity_concurrency_results where name = 'progress_b'),
  'ok',
  'second concurrent progress upsert succeeds'
);

select extensions.is(
  (
    select value
    from extensions.dblink(
      'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres',
      $sql$
        select count(*)::integer
        from public.page_progress
        where owner_id = 'c1000000-0000-4000-8000-000000000001'
          and page_id = 'c5000000-0000-4000-8000-000000000001'
      $sql$
    ) as t(value integer)
  ),
  1,
  'progress race leaves exactly one owner/page row'
);

select extensions.is(
  (
    select value
    from extensions.dblink(
      'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres',
      $sql$
        select status
        from public.page_progress
        where owner_id = 'c1000000-0000-4000-8000-000000000001'
          and page_id = 'c5000000-0000-4000-8000-000000000001'
      $sql$
    ) as t(value text)
  ),
  'in-progress',
  'progress race preserves the canonical in-progress state'
);

select extensions.dblink_disconnect('aa_progress_a');
select extensions.dblink_disconnect('aa_progress_b');

select extensions.dblink_connect_u(
  'aa_ic_cleanup',
  'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres'
);

select extensions.dblink_exec(
  'aa_ic_cleanup',
  $sql$
    delete from public.page_progress
    where owner_id = 'c1000000-0000-4000-8000-000000000001';

    delete from public.friend_connections
    where requester_id in (
      'c1000000-0000-4000-8000-000000000001',
      'c1000000-0000-4000-8000-000000000002'
    )
    or recipient_id in (
      'c1000000-0000-4000-8000-000000000001',
      'c1000000-0000-4000-8000-000000000002'
    );

    delete from public.grimoires
    where id = 'c2000000-0000-4000-8000-000000000001';

    delete from auth.users
    where id in (
      'c1000000-0000-4000-8000-000000000001',
      'c1000000-0000-4000-8000-000000000002'
    );

    drop schema if exists aa_integrity_concurrency cascade;
  $sql$
);

select extensions.dblink_disconnect('aa_ic_cleanup');

select * from extensions.finish();

rollback;
