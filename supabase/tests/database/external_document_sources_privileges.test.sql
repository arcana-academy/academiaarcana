begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(11);

select extensions.ok(
  not has_table_privilege('anon', 'public.external_document_sources', 'SELECT'),
  'anon cannot read external document sources'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.external_document_sources', 'INSERT'),
  'anon cannot create external document sources'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.external_document_sources', 'UPDATE'),
  'anon cannot update external document sources'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.external_document_sources', 'DELETE'),
  'anon cannot delete external document sources'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.external_document_sources', 'SELECT,INSERT,UPDATE,DELETE'),
  'authenticated has CRUD privileges for external document sources'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.external_document_sources', 'TRUNCATE'),
  'authenticated cannot truncate external document sources'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.external_document_sources', 'REFERENCES'),
  'authenticated cannot alter foreign-key references on external document sources'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.external_document_sources', 'TRIGGER'),
  'authenticated cannot create triggers on external document sources'
);

select extensions.ok(
  coalesce(
    (select relrowsecurity
       from pg_class
      where oid = 'public.external_document_sources'::regclass),
    false
  ),
  'RLS is enabled on external document sources'
);

select extensions.ok(
  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'external_document_sources'
       and policyname = 'Users can view their external document sources'
  ),
  'own-row SELECT policy exists'
);

select extensions.ok(
  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'external_document_sources'
       and policyname = 'Users can update their external document sources'
  ),
  'own-row UPDATE policy exists'
);

select * from extensions.finish();

rollback;
