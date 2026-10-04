begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(12);

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.educational_practice_items'::regclass),
  'practice items have row level security enabled'
);

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.educational_practice_attempts'::regclass),
  'practice attempts have row level security enabled'
);

select extensions.ok(
  has_table_privilege('authenticated','public.educational_practice_items','SELECT'),
  'authenticated can read practice items through RLS'
);

select extensions.ok(
  has_table_privilege('authenticated','public.educational_practice_items','INSERT'),
  'authenticated can create practice items'
);

select extensions.ok(
  has_table_privilege('authenticated','public.educational_practice_items','UPDATE'),
  'authenticated can update practice items'
);

select extensions.ok(
  has_table_privilege('authenticated','public.educational_practice_items','DELETE'),
  'authenticated can delete practice items'
);

select extensions.ok(
  not has_table_privilege('authenticated','public.educational_practice_attempts','INSERT'),
  'authenticated cannot bypass the atomic attempt operation'
);

select extensions.ok(
  has_table_privilege('authenticated','public.educational_practice_attempts','SELECT'),
  'authenticated can read own attempts through RLS'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.record_criterion_referenced_practice_attempt(uuid, text)',
    'EXECUTE'
  ),
  'authenticated can execute objective evidence RPC'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.record_criterion_referenced_practice_attempt(uuid, text)',
    'EXECUTE'
  ),
  'anon cannot execute objective evidence RPC'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    'public.record_criterion_referenced_practice_attempt(uuid, text)',
    'EXECUTE'
  ),
  'service_role cannot execute objective evidence RPC'
);

select extensions.ok(
  not prosecdef,
  'public objective evidence RPC is SECURITY INVOKER'
)
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'record_criterion_referenced_practice_attempt'
  and pronargs = 2;

select extensions.finish();

rollback;
