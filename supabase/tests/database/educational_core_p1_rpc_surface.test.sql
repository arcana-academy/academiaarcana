begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(7);

select extensions.ok(
  prosecdef = false,
  'public practice attempt RPC is SECURITY INVOKER'
)
from pg_catalog.pg_proc
where pg_catalog.pg_proc.oid =
  (
  'public.record_educational_practice_attempt('
  || 'uuid, text, text, numeric, text, text)'
)::regprocedure;

select extensions.ok(
  pg_catalog.pg_proc.proconfig =
    array['search_path="public, pg_catalog"'],
  'public practice attempt RPC has an explicit safe search_path'
)
from pg_catalog.pg_proc
where pg_catalog.pg_proc.oid =
  'public.record_educational_practice_attempt(uuid, text, text, numeric, text, text)'::regprocedure;

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'private.record_educational_practice_attempt('
    || 'uuid, text, text, numeric, text, text)',
    'EXECUTE'
  ),
  'authenticated can execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'private.record_educational_practice_attempt('
  || 'uuid, text, text, numeric, text, text)',
    'EXECUTE'
  ),
  'anon cannot execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    'private.record_educational_practice_attempt(uuid, text, text, numeric, text, text)',
    'EXECUTE'
  ),
  'service_role cannot execute the private implementation'
);

select extensions.ok(
  prosecdef = true,
  'private practice attempt implementation is SECURITY DEFINER'
)
from pg_catalog.pg_proc
where pg_catalog.pg_proc.oid =
  (
    'private.record_educational_practice_attempt('
    || 'uuid, text, text, numeric, text, text)'
  )::regprocedure;

select extensions.ok(
  (
    select pg_catalog.pg_proc.proconfig = array['search_path=""']
    from pg_catalog.pg_proc
    where pg_catalog.pg_proc.oid =
      'private.record_educational_practice_attempt(uuid, text, text, numeric, text, text)'::regprocedure
  ),
  'private implementation has an empty search_path'
);

select * from extensions.finish();

rollback;
