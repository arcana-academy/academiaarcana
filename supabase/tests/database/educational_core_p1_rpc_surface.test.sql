begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(4);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.record_educational_practice_attempt(uuid, text, text, numeric, text, text)',
    'EXECUTE'
  ),
  'authenticated can execute the public practice RPC'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'private.record_educational_practice_attempt(uuid, text, text, numeric, text, text)',
    'EXECUTE'
  ),
  'authenticated can execute the private implementation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'private.record_educational_practice_attempt(uuid, text, text, numeric, text, text)',
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

select extensions.finish() as result;

rollback;
