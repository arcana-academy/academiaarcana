begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(7);

select extensions.ok(
  (
    select not pg_catalog.pg_proc.prosecdef
    from pg_catalog.pg_proc
    where pg_catalog.pg_proc.oid
      = (
        'public.record_educational_practice_attempt('
        || 'uuid, text, text, numeric, text, text)'
      )::regprocedure
  ),
  'public practice attempt RPC is SECURITY INVOKER'
);

select extensions.ok(
  (
    select pg_catalog.array_to_string(
      pg_catalog.pg_proc.proconfig,
      ','
    )
    from pg_catalog.pg_proc
    where pg_catalog.pg_proc.oid
      = (
        'public.record_educational_practice_attempt('
        || 'uuid, text, text, numeric, text, text)'
      )::regprocedure
  ) = 'search_path=public, pg_catalog',
  'public practice attempt RPC has a safe search_path'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'private.record_educational_practice_attempt(',
    'EXECUTE'
  ),
  'authenticated can execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'private.record_educational_practice_attempt(',
    'EXECUTE'
  ),
  'anon cannot execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    'private.record_educational_practice_attempt(',
    'EXECUTE'
  ),
  'service_role cannot execute the private implementation'
);

select extensions.ok(
  (
    select pg_catalog.pg_proc.prosecdef
    from pg_catalog.pg_proc
    where pg_catalog.pg_proc.oid
      = (
        'private.record_educational_practice_attempt('
        || 'uuid, text, text, numeric, text, text)'
      )::regprocedure
  ),
  'private practice attempt implementation is SECURITY DEFINER'
);

select extensions.ok(
  (
    select pg_catalog.array_to_string(
      pg_catalog.pg_proc.proconfig,
      ','
    )
    from pg_catalog.pg_proc
    where pg_catalog.pg_proc.oid
      = (
        'private.record_educational_practice_attempt('
        || 'uuid, text, text, numeric, text, text)'
      )::regprocedure
  ) = 'search_path=""',
  'private implementation has an empty search_path'
);

select extensions.finish() as result;

rollback;
