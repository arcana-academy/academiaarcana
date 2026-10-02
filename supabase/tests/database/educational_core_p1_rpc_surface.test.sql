begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(7);

select extensions.ok(
  pg_catalog.position(
    $$SECURITY INVOKER$$
    in pg_catalog.pg_get_functiondef(
      pg_catalog.concat(
        'public.record_educational_practice_attempt(',
        'uuid, text, text, numeric, text, text)'
      )::regprocedure
    )
  ) > 0,
  'public practice attempt RPC is SECURITY INVOKER'
);

select extensions.ok(
  pg_catalog.position(
    $$SET search_path TO public, pg_catalog$$
    in pg_catalog.pg_get_functiondef(
      pg_catalog.concat(
        'public.record_educational_practice_attempt(',
        'uuid, text, text, numeric, text, text)'
      )::regprocedure
    )
  ) > 0,
  'public practice attempt RPC has a safe search_path'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    pg_catalog.concat(
      'private.record_educational_practice_attempt(',
      'uuid, text, text, numeric, text, text)'
    ),
    'EXECUTE'
  ),
  'authenticated can execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    pg_catalog.concat(
      'private.record_educational_practice_attempt(',
      'uuid, text, text, numeric, text, text)'
    ),
    'EXECUTE'
  ),
  'anon cannot execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    pg_catalog.concat(
      'private.record_educational_practice_attempt(',
      'uuid, text, text, numeric, text, text)'
    ),
    'EXECUTE'
  ),
  'service_role cannot execute the private implementation'
);

select extensions.ok(
  pg_catalog.position(
    $$SECURITY DEFINER$$
    in pg_catalog.pg_get_functiondef(
      pg_catalog.concat(
        'private.record_educational_practice_attempt(',
        'uuid, text, text, numeric, text, text)'
      )::regprocedure
    )
  ) > 0,
  'private practice attempt implementation is SECURITY DEFINER'
);

select extensions.ok(
  pg_catalog.position(
    $$SET search_path TO ''$$
    in pg_catalog.pg_get_functiondef(
      pg_catalog.concat(
        'private.record_educational_practice_attempt(',
        'uuid, text, text, numeric, text, text)'
      )::regprocedure
    )
  ) > 0,
  'private implementation has an empty search_path'
);

select extensions.finish() as result;

rollback;
