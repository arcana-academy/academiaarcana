begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(6);

select extensions.ok(
  has_table_privilege('authenticated', 'public.feedback_responses', 'SELECT'),
  'authenticated can read feedback rows'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.feedback_responses', 'INSERT'),
  'authenticated can create feedback rows'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.feedback_responses', 'UPDATE'),
  'authenticated cannot update feedback rows'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.feedback_responses', 'DELETE'),
  'authenticated cannot delete feedback rows'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.feedback_responses', 'SELECT'),
  'anon cannot read feedback rows'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.feedback_responses', 'INSERT'),
  'anon cannot create feedback rows'
);

select * from extensions.finish();
rollback;
