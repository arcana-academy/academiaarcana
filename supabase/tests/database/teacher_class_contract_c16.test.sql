-- CYCLE 16: synthetic teacher/class contract ONLY. Not a production migration.
-- Executed only against disposable local Supabase by database-tests.yml.
-- Everything created here is rolled back; no real users or records are read.
begin;

create extension if not exists pgtap with schema extensions;

-- This is an intentionally hypothetical / noncanonical institution model.
create schema aa_c16_isolated;

create table aa_c16_isolated.institutions (
  id uuid primary key,
  display_name text not null
);

create table aa_c16_isolated.classrooms (
  id uuid primary key,
  institution_id uuid not null references aa_c16_isolated.institutions(id),
  title text not null,
  unique (id, institution_id)
);

create table aa_c16_isolated.teacher_assignments (
  actor_id uuid not null,
  institution_id uuid not null,
  classroom_id uuid not null,
  status text not null check (status in ('active', 'revoked')),
  revoked_at timestamptz,
  expires_at timestamptz,
  primary key (actor_id, classroom_id),
  foreign key (classroom_id, institution_id)
    references aa_c16_isolated.classrooms (id, institution_id)
);

-- Permission and row policies for this test-only model. Deliberately no
-- anonymous grants, write grants, SECURITY DEFINER functions or views.
alter table aa_c16_isolated.classrooms enable row level security;
alter table aa_c16_isolated.teacher_assignments enable row level security;
revoke all on schema aa_c16_isolated from public, anon;
revoke all on all tables in schema aa_c16_isolated from public, anon, authenticated;
grant usage on schema aa_c16_isolated to authenticated;
grant select on aa_c16_isolated.teacher_assignments, aa_c16_isolated.classrooms
  to authenticated;

create policy teacher_assignment_select_self
  on aa_c16_isolated.teacher_assignments for select to authenticated
  using (actor_id = (select auth.uid()));

create policy classroom_select_active_teacher
  on aa_c16_isolated.classrooms for select to authenticated
  using (exists (
    select 1 from aa_c16_isolated.teacher_assignments binding
    where binding.actor_id = (select auth.uid())
      and binding.classroom_id = classrooms.id
      and binding.institution_id = classrooms.institution_id
      and binding.status = 'active'
      and binding.revoked_at is null
      and (binding.expires_at is null or binding.expires_at > now())
  ));

-- Artificial ids with no dependencies on auth.users and no API traffic.
insert into aa_c16_isolated.institutions (id, display_name) values
  ('f1000000-0000-4000-8000-000000000001', 'Instituição A — fictícia'),
  ('f2000000-0000-4000-8000-000000000002', 'Instituição B — fictícia');

insert into aa_c16_isolated.classrooms (id, institution_id, title) values
  ('c1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'Turma A1'),
  ('c1000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001', 'Turma A2'),
  ('c2000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000002', 'Turma B1');

insert into aa_c16_isolated.teacher_assignments
  (actor_id, institution_id, classroom_id, status, revoked_at, expires_at) values
  ('b1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000001', 'active', null, null),
  ('b1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000002', 'revoked', now(), null),
  ('b1000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000002',
   'c2000000-0000-4000-8000-000000000001', 'active', null, now() - interval '1 day'),
  ('b1000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000002', 'active', null, null),
  ('b1000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000002',
   'c2000000-0000-4000-8000-000000000001', 'active', null, null);

set local role anon;
select extensions.throws_ok(
  $sql$select count(*) from aa_c16_isolated.classrooms$sql$,
  '42501',
  null,
  'C16-001 anon cannot inspect test classrooms'
);

select extensions.throws_ok(
  $sql$select count(*) from aa_c16_isolated.teacher_assignments$sql$,
  '42501',
  null,
  'C16-002 anon cannot inspect teacher assignments'
);
reset role;

-- Role authenticated with missing subject MUST see nothing.
set local role authenticated;
select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms),
  0,
  'C16-003 no authenticated subject sees zero classes'
);

select extensions.is(
  (select count(*)::integer from aa_c16_isolated.teacher_assignments),
  0,
  'C16-004 no authenticated subject sees zero assignments'
);
reset role;

-- Professor A: one currently active binding; revoked and expired hidden.
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
reset role;

-- Professor B, same context and across two institutions, sees only B grants.
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms),
  1,
  'C16-005 A sees only one active classroom'
);

select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms where id='c1000000-0000-4000-8000-000000000001'),
  1,
  'C16-006 A sees own class A1'
);

select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms where id='c1000000-0000-4000-8000-000000000002'),
  0,
  'C16-007 A cannot see revoked class A2'
);

select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms where id='c2000000-0000-4000-8000-000000000001'),
  0,
  'C16-008 A cannot see expired cross-institution class B1'
);

select extensions.is(
  (select count(*)::integer from aa_c16_isolated.teacher_assignments where actor_id='b1000000-0000-4000-8000-000000000002'),
  0,
  'C16-009 A cannot read B assignments'
);

select extensions.throws_ok(
  $sql$insert into aa_c16_isolated.teacher_assignments (actor_id,institution_id,classroom_id,status) values ('b1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002','active')$sql$,
  '42501',
  null,
  'C16-010 authenticated cannot forge teacher binding'
);

select extensions.throws_ok(
  $sql$update aa_c16_isolated.teacher_assignments set status='active' where classroom_id='c1000000-0000-4000-8000-000000000002'$sql$,
  '42501',
  null,
  'C16-011 authenticated cannot reinstate revoked binding'
);

select extensions.throws_ok(
  $sql$delete from aa_c16_isolated.teacher_assignments where classroom_id='c1000000-0000-4000-8000-000000000001'$sql$,
  '42501',
  null,
  'C16-012 authenticated cannot delete assignment'
);
reset role;

-- Forged self-editable user_metadata never substitutes an active binding.
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-4000-8000-000000000003","role":"authenticated","user_metadata":{"is_teacher":true,"institution_id":"f1000000-0000-4000-8000-000000000001"}}', true);
set local role authenticated;
select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms),
  2,
  'C16-013 B sees exactly two assigned classrooms'
);

select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms where id='c1000000-0000-4000-8000-000000000001'),
  0,
  'C16-014 B cannot see A-only classroom'
);

select extensions.is(
  (select count(*)::integer from aa_c16_isolated.teacher_assignments where actor_id='b1000000-0000-4000-8000-000000000001'),
  0,
  'C16-015 B cannot see A assignments'
);
reset role;

-- A class-id + institution-id mismatch fails referential integrity even for admin fixture setup.

select extensions.throws_ok(
  $sql$insert into aa_c16_isolated.teacher_assignments (actor_id,institution_id,classroom_id,status) values ('b1000000-0000-4000-8000-000000000003','f2000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','active')$sql$,
  '23503',
  null,
  'C16-018 cross-institution forged assignment violates composite FK'
);

-- A's revocation must take effect without a new claim or client-side cache.
update aa_c16_isolated.teacher_assignments set status='revoked', revoked_at=now()
  where actor_id='b1000000-0000-4000-8000-000000000001'
    and classroom_id='c1000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms),
  0,
  'C16-016 forged user_metadata cannot reveal classes'
);

select extensions.is(
  (select count(*)::integer from aa_c16_isolated.teacher_assignments),
  0,
  'C16-017 forged user_metadata cannot reveal assignments'
);
reset role;

-- Recovery of the hypothetical grant is visible only after explicit restoration.
update aa_c16_isolated.teacher_assignments set status='active', revoked_at=null
  where actor_id='b1000000-0000-4000-8000-000000000001'
    and classroom_id='c1000000-0000-4000-8000-000000000001';
set local role authenticated;
select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms),
  1,
  'C16-020 restored teacher may read one class again'
);

select extensions.is(
  (select count(*)::integer from aa_c16_isolated.classrooms),
  0,
  'C16-019 revoked teacher loses existing class immediately'
);
reset role;

select extensions.finish();
rollback;
