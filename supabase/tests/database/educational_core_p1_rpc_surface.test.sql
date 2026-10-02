begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(7);

select extensions.ok(
  pg_catalog.pg_get_functiondef(
    (
      'public.record_educational_practice_attempt(' ||
      'uuid, text, text, numeric, text, text)'
    )::regprocedure
  ) like '%SECURITY INVOKER%',
  'public practice attempt RPC is SECURITY INVOKER'
);

select extensions.ok(
  pg_catalog.pg_get_functiondef(
    (
      'public.record_educational_practice_attempt(' ||
      'uuid, text, text, numeric, text, text)'
    )::regprocedure
  ) like '%SET search_path TO public, pg_catalog%',
  'public practice attempt RPC has a safe search_path'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    (
      'private.record_educational_practice_attempt(' ||
      'uuid, text, text, numeric, text, text)'
    )::regprocedure,
    'EXECUTE'
  ),
  'authenticated can execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    (
      'private.record_educational_practice_attempt(' ||
      'uuid, text, text, numeric, text, text)'
    )::regprocedure,
    'EXECUTE'
  ),
  'anon cannot execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    (
      'private.record_educational_practice_attempt(' ||
      'uuid, text, text, numeric, text, text)'
    )::regprocedure,
    'EXECUTE'
  ),
  'service_role cannot execute the private implementation'
);

select extensions.ok(
  pg_catalog.pg_get_functiondef(
    (
      'private.record_educational_practice_attempt(' ||
      'uuid, text, text, numeric, text, text)'
    )::regprocedure
  ) like '%SECURITY DEFINER%',
  'private practice attempt implementation is SECURITY DEFINER'
);

select extensions.ok(
  pg_catalog.pg_get_functiondef(
    (
      'private.record_educational_practice_attempt(' ||
      'uuid, text, text, numeric, text, text)'
    )::regprocedure
  ) like '%SET search_path TO ''''%',
  'private implementation has an empty search_path'
);

select extensions.finish() as result;

rollback;
