begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(12);

select extensions.ok(
  has_table_privilege(
    'authenticated',
    'public.integration_credentials',
    'SELECT,INSERT,UPDATE,DELETE'
  ),
  'authenticated has CRUD privileges for integration credentials'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'public.integration_credentials',
    'SELECT'
  ),
  'anon cannot read integration credentials'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'public.integration_credentials',
    'INSERT'
  ),
  'anon cannot create integration credentials'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'public.integration_credentials',
    'UPDATE'
  ),
  'anon cannot update integration credentials'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'public.integration_credentials',
    'DELETE'
  ),
  'anon cannot delete integration credentials'
);

select extensions.ok(
  coalesce(
    (select relrowsecurity
       from pg_class
      where oid = 'public.integration_credentials'::regclass),
    false
  ),
  'RLS is enabled on integration credentials'
);

select extensions.ok(
  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'integration_credentials'
       and policyname = 'integration_credentials_select_own'
  ),
  'own-row SELECT policy exists'
);

select extensions.ok(
  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'integration_credentials'
       and policyname = 'integration_credentials_insert_own'
  ),
  'own-row INSERT policy exists'
);

select extensions.ok(
  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'integration_credentials'
       and policyname = 'integration_credentials_update_own'
  ),
  'own-row UPDATE policy exists'
);

select extensions.ok(
  exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'integration_credentials'
       and policyname = 'integration_credentials_delete_own'
  ),
  'own-row DELETE policy exists'
);

select extensions.ok(
  exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'integration_credentials'
       and column_name = 'access_token_ciphertext'
  ),
  'access token is persisted as ciphertext'
);

select extensions.ok(
  exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'integration_credentials'
       and column_name = 'refresh_token_ciphertext'
  ),
  'refresh token is persisted as ciphertext'
);

select * from extensions.finish();
rollback;
