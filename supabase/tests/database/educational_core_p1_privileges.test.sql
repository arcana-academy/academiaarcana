begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(12);

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
  has_table_privilege('authenticated', 'public.educational_practice_items', 'SELECT'),
  'authenticated can read own practice items through RLS'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_practice_items', 'INSERT'),
  'authenticated can create practice items'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_practice_items', 'UPDATE'),
  'authenticated can update practice items'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_practice_items', 'DELETE'),
  'authenticated can delete practice items'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_practice_attempts', 'SELECT'),
  'authenticated can read own practice attempts through RLS'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_practice_attempts', 'INSERT'),
  'authenticated can create practice attempts'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_practice_attempts', 'UPDATE'),
  'authenticated cannot rewrite recorded practice attempts'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_practice_attempts', 'DELETE'),
  'authenticated cannot delete recorded practice attempts'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.educational_practice_items', 'SELECT'),
  'anon cannot read practice items'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.educational_practice_attempts', 'SELECT'),
  'anon cannot read practice attempts'
);

select * from extensions.finish();
rollback;
