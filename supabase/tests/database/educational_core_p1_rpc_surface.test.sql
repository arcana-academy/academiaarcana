begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(7);

select extensions.ok(
  (
    select not proc.prosecdef
    from pg_catalog.pg_proc as proc
    where proc.oid =
      pg_catalog.to_regprocedure(
        'public.record_educational_practice_attempt(' ||
          'uuid, text, text, numeric, text, text)'
      )
  ),
  'public practice attempt RPC is SECURITY INVOKER'
);

select extensions.ok(
  (
    select pg_catalog.array_to_string(
      proc.proconfig,
      ','
    )
    from pg_catalog.pg_proc as proc
    where proc.oid =
      pg_catalog.to_regprocedure(
        'public.record_educational_practice_attempt(' ||
          'uuid, text, text, numeric, text, text)'
      )
  ) = 'search_path=public, pg_catalog',
  'public practice attempt RPC has a safe search_path'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    pg_catalog.to_regprocedure(
      'private.record_educational_practice_attempt(' ||
        'uuid, text, text, numeric, text, text)'
    ),
    'EXECUTE'
  ),
  'authenticated can execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    pg_catalog.to_regprocedure(
      'private.record_educational_practice_attempt(' ||
        'uuid, text, text, numeric, text, text)'
    ),
    'EXECUTE'
  ),
  'anon cannot execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    pg_catalog.to_regprocedure(
      'private.record_educational_practice_attempt(' ||
        'uuid, text, text, numeric, text, text)'
    ),
    'EXECUTE'
  ),
  'service_role cannot execute the private implementation'
);

select extensions.ok(
  (
    select proc.prosecdef
    from pg_catalog.pg_proc as proc
    where proc.oid =
      pg_catalog.to_regprocedure(
        'private.record_educational_practice_attempt(' ||
          'uuid, text, text, numeric, text, text)'
      )
  ),
  'private practice attempt implementation is SECURITY DEFINER'
);

select extensions.ok(
  (
    select pg_catalog.array_to_string(
      proc.proconfig,
      ','
    )
    from pg_catalog.pg_proc as proc
    where proc.oid =
      pg_catalog.to_regprocedure(
        'private.record_educational_practice_attempt(' ||
          'uuid, text, text, numeric, text, text)'
      )
  ) = 'search_path=""',
  'private implementation has an empty search_path'
);

select extensions.finish() as result;

rollback;
