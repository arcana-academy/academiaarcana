begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(19);

select extensions.ok(
  relrowsecurity,
  'practice items have row level security enabled'
)
from pg_class
where oid = 'public.educational_practice_items'::regclass;

select extensions.ok(
  relrowsecurity,
  'practice attempts have row level security enabled'
)
from pg_class
where oid = 'public.educational_practice_attempts'::regclass;

select extensions.ok(
  has_table_privilege(
    'authenticated',
    'public.educational_practice_items',
    'SELECT'
  ),
  'authenticated can read practice items through RLS'
);

select extensions.ok(
  has_table_privilege(
    'authenticated',
    'public.educational_practice_items',
    'INSERT'
  ),
  'authenticated can create practice items'
);

select extensions.ok(
  has_table_privilege(
    'authenticated',
    'public.educational_practice_items',
    'UPDATE'
  ),
  'authenticated can update practice items'
);

select extensions.ok(
  has_table_privilege(
    'authenticated',
    'public.educational_practice_items',
    'DELETE'
  ),
  'authenticated can delete practice items'
);

select extensions.ok(
  has_table_privilege(
    'authenticated',
    'public.educational_practice_attempts',
    'SELECT'
  ),
  'authenticated can read practice attempts through RLS'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'public.educational_practice_attempts',
    'INSERT'
  ),
  'authenticated cannot bypass the atomic practice attempt operation'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'public.educational_practice_attempts',
    'UPDATE'
  ),
  'authenticated cannot rewrite recorded practice attempts'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'public.educational_practice_attempts',
    'DELETE'
  ),
  'authenticated cannot delete recorded practice attempts'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'public.educational_practice_items',
    'SELECT'
  ),
  'anon cannot read practice items'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'public.educational_practice_attempts',
    'SELECT'
  ),
  'anon cannot read practice attempts'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.record_educational_practice_attempt(uuid, text, text, numeric, text, text)',
    'EXECUTE'
  ),
  'authenticated can execute atomic educational attempt operation'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    'public.record_educational_practice_attempt(uuid, text, text, numeric, text, text)',
    'EXECUTE'
  ),
  'service_role cannot execute atomic educational attempt operation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.record_educational_practice_attempt(uuid, text, text, numeric, text, text)',
    'EXECUTE'
  ),
  'anon cannot execute atomic educational attempt operation'
);

select extensions.ok(
  not prosecdef,
  'public atomic educational attempt operation is SECURITY INVOKER'
)
from pg_proc
where oid =
  'public.record_educational_practice_attempt(uuid, text, text, numeric, text, text)'::regprocedure;

select extensions.ok(
  (
    select pg_proc.proconfig @> array['search_path="public, pg_catalog"']
    from pg_proc
    where pg_proc.oid =
      'public.record_educational_practice_attempt(uuid, text, text, numeric, text, text)'::regprocedure
  ),
  'public atomic educational attempt operation uses a safe search_path'
);

select extensions.ok(
  to_regclass('public.idx_educational_practice_items_page_id') is not null,
  'practice item page foreign key is indexed'
);

select extensions.ok(
  to_regclass('public.idx_educational_practice_attempts_practice_item_id') is not null,
  'practice attempt item foreign key is indexed'
);

select * from extensions.finish();

rollback;
