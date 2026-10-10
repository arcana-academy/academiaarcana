-- P0 #536 — test the VERSIONED Feedback FK contract in the disposable local
-- Supabase instance. This file must never be executed on the hosted project.
-- The only rows inserted/deleted are synthetic test users and feedback in the
-- local DB, inside a transaction that is rolled back after the assertions.
begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(17);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_constraint as c
    join pg_catalog.pg_class as t on t.oid = c.conrelid
    join pg_catalog.pg_namespace as n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'feedback_responses'
      and c.conname = 'feedback_responses_user_id_fkey'
      and c.contype = 'f'
      and c.confdeltype = 'c'
  ),
  'Versioned Feedback FK uses ON DELETE CASCADE'
);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_attribute as a
    join pg_catalog.pg_class as t on t.oid = a.attrelid
    join pg_catalog.pg_namespace as n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'feedback_responses'
      and a.attname = 'user_id'
      and a.attnotnull
      and not a.attisdropped
  ),
  'Versioned feedback requires a non-null authenticated owner'
);

select extensions.ok(
  (select c.relrowsecurity
   from pg_catalog.pg_class as c
   join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'feedback_responses'),
  'Feedback RLS is enabled'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.feedback_responses', 'DELETE'),
  'Direct authenticated feedback deletion stays denied'
);

insert into auth.users (id, email)
values
  ('b5300000-0000-4000-8000-000000000001', 'p0-feedback-fk-owner-a@example.test'),
  ('b5300000-0000-4000-8000-000000000002', 'p0-feedback-fk-owner-b@example.test');

insert into public.feedback_responses (id, user_id, email, feedback)
values
  ('b5310000-0000-4000-8000-000000000001', 'b5300000-0000-4000-8000-000000000001', 'p0-feedback-fk-owner-a@example.test', 'Synthetic isolated test feedback A'),
  ('b5310000-0000-4000-8000-000000000002', 'b5300000-0000-4000-8000-000000000002', 'p0-feedback-fk-owner-b@example.test', 'Synthetic isolated test feedback B');

select extensions.is(
  (select count(*)::integer from public.feedback_responses
   where id in ('b5310000-0000-4000-8000-000000000001', 'b5310000-0000-4000-8000-000000000002')),
  2,
  'Both synthetic users retain their own feedback before deletion'
);

-- This is a DELETE in the DISPOSABLE LOCAL CI DATABASE ONLY, never hosted.
delete from auth.users where id = 'b5300000-0000-4000-8000-000000000001';

select extensions.is(
  (select count(*)::integer from public.feedback_responses
   where id = 'b5310000-0000-4000-8000-000000000001'),
  0,
  'Deleting synthetic user A cascades to A feedback without setting NULL'
);

select extensions.is(
  (select count(*)::integer from public.feedback_responses
   where id = 'b5310000-0000-4000-8000-000000000002'),
  1,
  'Deleting synthetic user A leaves unrelated B feedback untouched'
);

delete from auth.users where id = 'b5300000-0000-4000-8000-000000000002';

select extensions.is(
  (select count(*)::integer from public.feedback_responses
   where id in ('b5310000-0000-4000-8000-000000000001', 'b5310000-0000-4000-8000-000000000002')),
  0,
  'Deleting synthetic user B also cascades; no residual feedback orphan'
);

-- Reproduce the observed hosted FK contradiction ONLY in this disposable local
-- Supabase transaction: ON DELETE SET NULL together with user_id NOT NULL.
-- This is a negative test. It is never executed against a hosted project.
-- Every DDL/DML operation is reverted by the outer ROLLBACK below.
alter table public.feedback_responses
  drop constraint feedback_responses_user_id_fkey;

alter table public.feedback_responses
  add constraint feedback_responses_user_id_fkey
  foreign key (user_id) references auth.users(id)
  on delete set null;

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_constraint as c
    join pg_catalog.pg_class as t on t.oid = c.conrelid
    join pg_catalog.pg_namespace as n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'feedback_responses'
      and c.conname = 'feedback_responses_user_id_fkey'
      and c.confdeltype = 'n'
  ),
  'Simulated hosted FK uses ON DELETE SET NULL'
);

insert into auth.users (id, email)
values ('b5300000-0000-4000-8000-000000000003', 'p0-feedback-fk-owner-c@example.test');

insert into public.feedback_responses (id, user_id, email, feedback)
values (
  'b5310000-0000-4000-8000-000000000003',
  'b5300000-0000-4000-8000-000000000003',
  'p0-feedback-fk-owner-c@example.test',
  'Synthetic isolated negative FK test feedback C'
);

-- PgTAP catches SQLSTATE 23502 in its own exception subtransaction;
-- user C's failed DELETE must not leak changes into the local test transaction.
select extensions.throws_ok(
  'delete from auth.users where id = ''b5300000-0000-4000-8000-000000000003''',
  '23502',
  null,
  'Simulated SET NULL plus NOT NULL blocks account deletion'
);

select extensions.is(
  (select count(*)::integer from auth.users
   where id = 'b5300000-0000-4000-8000-000000000003'),
  1,
  'Failed account deletion keeps the synthetic user intact'
);

select extensions.is(
  (select count(*)::integer from public.feedback_responses
   where id = 'b5310000-0000-4000-8000-000000000003'
     and user_id = 'b5300000-0000-4000-8000-000000000003'),
  1,
  'Failed account deletion keeps synthetic feedback ownership intact'
);

-- A hypothetical forward repair, executed ONLY in a local disposable
-- PostgreSQL test transaction. NOT a production DDL or retention decision.
insert into auth.users (id, email)
values ('b5300000-0000-4000-8000-000000000004', 'p0-feedback-fk-owner-d@example.test');

insert into public.feedback_responses (id, user_id, email, feedback)
values (
  'b5310000-0000-4000-8000-000000000004',
  'b5300000-0000-4000-8000-000000000004',
  'p0-feedback-fk-owner-d@example.test',
  'Synthetic unrelated feedback D'
);

alter table public.feedback_responses
  drop constraint feedback_responses_user_id_fkey;

alter table public.feedback_responses
  add constraint feedback_responses_user_id_fkey
  foreign key (user_id) references auth.users(id)
  on delete cascade;

select extensions.ok(
  exists (
    select 1 from pg_catalog.pg_constraint as c
    join pg_catalog.pg_class as t on t.oid = c.conrelid
    join pg_catalog.pg_namespace as n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'feedback_responses'
      and c.conname = 'feedback_responses_user_id_fkey'
      and c.confdeltype = 'c' and c.convalidated
  ),
  'Forward rehearsal restores validated CASCADE action'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.feedback_responses', 'DELETE'),
  'Forward rehearsal preserves denial of user DELETE privileges'
);

delete from auth.users
where id = 'b5300000-0000-4000-8000-000000000003';

select extensions.is(
  (select count(*)::integer from auth.users
   where id = 'b5300000-0000-4000-8000-000000000003'), 0,
  'Forward rehearsal permits synthetic user C deletion'
);

select extensions.is(
  (select count(*)::integer from public.feedback_responses
   where id = 'b5310000-0000-4000-8000-000000000003'), 0,
  'Forward rehearsal cascades only C feedback'
);

select extensions.is(
  (select count(*)::integer from public.feedback_responses
   where id = 'b5310000-0000-4000-8000-000000000004'
     and user_id = 'b5300000-0000-4000-8000-000000000004'), 1,
  'Forward rehearsal preserves unrelated synthetic D feedback'
);

select * from extensions.finish();

rollback;
