begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(16);

select extensions.ok(
  relrowsecurity,
  'objective assessments have row level security enabled'
)
from pg_class
where oid = 'public.educational_objective_assessments'::regclass;

select extensions.ok(
  relrowsecurity,
  'objective attempts have row level security enabled'
)
from pg_class
where oid = 'public.educational_objective_attempts'::regclass;

select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_objective_assessments', 'SELECT'),
  'authenticated can read objective assessments through RLS'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_objective_assessments', 'INSERT'),
  'authenticated can create objective assessments'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_objective_assessments', 'UPDATE'),
  'authenticated can update objective assessments'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_objective_assessments', 'DELETE'),
  'authenticated can delete objective assessments'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_objective_attempts', 'SELECT'),
  'authenticated can read objective attempts through RLS'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_objective_attempts', 'INSERT'),
  'authenticated cannot bypass the objective attempt operation'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_objective_attempts', 'UPDATE'),
  'authenticated cannot rewrite objective attempts'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_objective_attempts', 'DELETE'),
  'authenticated cannot delete objective attempts'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.educational_objective_assessments', 'SELECT'),
  'anon cannot read objective assessments'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.educational_objective_attempts', 'SELECT'),
  'anon cannot read objective attempts'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.record_educational_objective_attempt(uuid, text)',
    'EXECUTE'
  ),
  'authenticated can execute objective attempt operation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.record_educational_objective_attempt(uuid, text)',
    'EXECUTE'
  ),
  'anon cannot execute objective attempt operation'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    'public.record_educational_objective_attempt(uuid, text)',
    'EXECUTE'
  ),
  'service_role cannot execute objective attempt operation'
);

select extensions.ok(
  not prosecdef,
  'public objective attempt operation is SECURITY INVOKER'
)
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'record_educational_objective_attempt'
  and pronargs = 2;

select extensions.ok(
  prosecdef,
  'private objective attempt implementation is SECURITY DEFINER'
)
from pg_proc
where pronamespace = 'private'::regnamespace
  and proname = 'record_educational_objective_attempt'
  and pronargs = 2;

select extensions.ok(
  has_schema_privilege('authenticated', 'private', 'USAGE'),
  'authenticated can access private objective implementation'
);

select extensions.finish();

rollback;
