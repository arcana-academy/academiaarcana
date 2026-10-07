begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(48);

create function pg_temp.exec_row_count(p_sql text)
returns integer
language plpgsql
as $fn$
declare
  v_count integer;
begin
  execute p_sql;
  get diagnostics v_count = row_count;
  return v_count;
end;
$fn$;

insert into auth.users (id, email)
values
  ('a1000000-0000-4000-8000-000000000001', 'qa-rls-owner-a@example.test'),
  ('a1000000-0000-4000-8000-000000000002', 'qa-rls-owner-b@example.test'),
  ('a1000000-0000-4000-8000-000000000003', 'qa-rls-owner-c@example.test'),
  ('a1000000-0000-4000-8000-000000000004', 'qa-rls-owner-d@example.test');

insert into public.grimoires (id, owner_id, title)
values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'QA A'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'QA B');

insert into public.notebooks (id, grimoire_id, title, position)
values
  ('a3000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'Notebook A', 0),
  ('a3000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', 'Notebook B', 0);

insert into public.chapters (id, notebook_id, title, position)
values
  ('a4000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'Chapter A', 0),
  ('a4000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000002', 'Chapter B', 0);

insert into public.pages (id, chapter_id, title, position)
values
  ('a5000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Page A', 0),
  ('a5000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000002', 'Page B', 0);

insert into public.page_progress (id, owner_id, page_id, status)
values
  ('a6000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'a5000000-0000-4000-8000-000000000001', 'in-progress'),
  ('a6000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'a5000000-0000-4000-8000-000000000002', 'in-progress');

insert into public.study_tasks (id, owner_id, title)
values
  ('a7000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Task A'),
  ('a7000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'Task B');

insert into public.gamification_profiles (owner_id, xp, streak_days)
values
  ('a1000000-0000-4000-8000-000000000001', 10, 1),
  ('a1000000-0000-4000-8000-000000000002', 20, 2);

insert into public.missions (id, owner_id, code, title, reward_xp, target_date)
values
  ('a8000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'qa-a', 'Mission A', 10, current_date),
  ('a8000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'qa-b', 'Mission B', 10, current_date);

insert into public.focus_sessions (id, owner_id, duration_seconds, started_at)
values
  ('a9000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 1500, now()),
  ('a9000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 1500, now());

insert into public.friend_connections (id, requester_id, recipient_id, status)
values
  ('aa000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'pending'),
  ('aa000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'pending'),
  ('aa000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', 'pending');

insert into public.integration_credentials (
  owner_id, provider_id, access_token_ciphertext, refresh_token_ciphertext, access_expires_at
)
values
  ('a1000000-0000-4000-8000-000000000001', 'qa-provider-a', 'cipher-a', 'refresh-a', now() + interval '1 hour'),
  ('a1000000-0000-4000-8000-000000000002', 'qa-provider-b', 'cipher-b', 'refresh-b', now() + interval '1 hour');

insert into public.external_document_sources (
  id, owner_id, provider_id, site_id, drive_id, item_id, name
)
values
  ('ab000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'qa', 'site-a', 'drive-a', 'item-a', 'Source A'),
  ('ab000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'qa', 'site-b', 'drive-b', 'item-b', 'Source B');

insert into public.feedback_responses (id, user_id, email, feedback)
values
  ('ac000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'a@example.test', 'Feedback A'),
  ('ac000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'b@example.test', 'Feedback B');

set local role anon;

select extensions.results_eq(
  $sql$select id from public.grimoires order by id$sql$,
  $expected$select null::uuid where false$expected$,
  'AUTH-RLS-001 anon reads no workspace grimoires'
);

select extensions.throws_ok(
  $sql$select count(*) from public.focus_sessions$sql$,
  '42501',
  null,
  'AUTH-RLS-002 anon cannot read focus sessions'
);
select extensions.throws_ok(
  $sql$select count(*) from public.integration_credentials$sql$,
  '42501',
  null,
  'AUTH-RLS-003 anon cannot read integration credentials'
);
select extensions.throws_ok(
  $sql$select count(*) from public.external_document_sources$sql$,
  '42501',
  null,
  'AUTH-RLS-004 anon cannot read external document sources'
);
select extensions.throws_ok(
  $sql$select count(*) from public.feedback_responses$sql$,
  '42501',
  null,
  'AUTH-RLS-005 anon cannot read feedback responses'
);

reset role;

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select extensions.results_eq(
  $sql$select id from public.grimoires order by id$sql$,
  $expected$values ('a2000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-006 owner reads exactly Grimoire A'
);
select extensions.results_eq(
  $sql$select id from public.notebooks order by id$sql$,
  $expected$values ('a3000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-007 owner reads exactly Notebook A'
);
select extensions.results_eq(
  $sql$select id from public.chapters order by id$sql$,
  $expected$values ('a4000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-008 owner reads exactly Chapter A'
);
select extensions.results_eq(
  $sql$select id from public.pages order by id$sql$,
  $expected$values ('a5000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-009 owner reads exactly Page A'
);
select extensions.results_eq(
  $sql$select id from public.page_progress order by id$sql$,
  $expected$values ('a6000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-010 owner reads exactly Progress A'
);
select extensions.results_eq(
  $sql$select id from public.study_tasks order by id$sql$,
  $expected$values ('a7000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-011 owner reads exactly Task A'
);
select extensions.results_eq(
  $sql$select owner_id from public.gamification_profiles order by owner_id$sql$,
  $expected$values ('a1000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-012 owner reads exactly gamification profile A'
);
select extensions.results_eq(
  $sql$select id from public.missions order by id$sql$,
  $expected$values ('a8000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-013 owner reads exactly Mission A'
);
select extensions.results_eq(
  $sql$select id from public.focus_sessions order by id$sql$,
  $expected$values ('a9000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-014 owner reads exactly Focus A'
);
select extensions.results_eq(
  $sql$select id from public.friend_connections order by id$sql$,
  $expected$
    values
      ('aa000000-0000-4000-8000-000000000001'::uuid),
      ('aa000000-0000-4000-8000-000000000002'::uuid)
  $expected$,
  'AUTH-RLS-015 participant reads exactly outgoing FC-AB and incoming FC-CA'
);
select extensions.results_eq(
  $sql$select provider_id from public.integration_credentials order by provider_id$sql$,
  $expected$values ('qa-provider-a'::text)$expected$,
  'AUTH-RLS-016 owner reads exactly integration credential A'
);
select extensions.results_eq(
  $sql$select id from public.external_document_sources order by id$sql$,
  $expected$values ('ab000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-017 owner reads exactly external source A'
);
select extensions.results_eq(
  $sql$select id from public.feedback_responses order by id$sql$,
  $expected$values ('ac000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'AUTH-RLS-018 owner reads exactly feedback A'
);

select extensions.throws_ok(
  $sql$insert into public.grimoires (owner_id, title) values ('a1000000-0000-4000-8000-000000000002', 'Forbidden')$sql$,
  '42501',
  null,
  'AUTH-RLS-019 owner cannot create a grimoire for another user'
);
select extensions.throws_ok(
  $sql$insert into public.notebooks (grimoire_id, title, position) values ('a2000000-0000-4000-8000-000000000002', 'Forbidden', 1)$sql$,
  '42501',
  null,
  'AUTH-RLS-020 owner cannot create a notebook inside another user grimoire'
);
select extensions.throws_ok(
  $sql$insert into public.page_progress (owner_id, page_id, status) values ('a1000000-0000-4000-8000-000000000001', 'a5000000-0000-4000-8000-000000000002', 'in-progress')$sql$,
  '42501',
  null,
  'AUTH-RLS-021 owner cannot create progress for another user page'
);
select extensions.throws_ok(
  $sql$insert into public.study_tasks (owner_id, title) values ('a1000000-0000-4000-8000-000000000002', 'Forbidden')$sql$,
  '42501',
  null,
  'AUTH-RLS-022 owner cannot create a study task for another user'
);
select extensions.throws_ok(
  $sql$insert into public.focus_sessions (owner_id, duration_seconds, started_at) values ('a1000000-0000-4000-8000-000000000002', 1500, now())$sql$,
  '42501',
  null,
  'AUTH-RLS-023 owner cannot create a focus session for another user'
);
select extensions.throws_ok(
  $sql$insert into public.friend_connections (requester_id, recipient_id) values ('a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000004')$sql$,
  '42501',
  null,
  'AUTH-RLS-024 user cannot forge requester B to D'
);
select extensions.throws_ok(
  $sql$insert into public.integration_credentials (owner_id, provider_id, access_token_ciphertext, refresh_token_ciphertext, access_expires_at) values ('a1000000-0000-4000-8000-000000000002', 'forged', 'cipher', 'refresh', now() + interval '1 hour')$sql$,
  '42501',
  null,
  'AUTH-RLS-025 owner cannot create integration credentials for another user'
);
select extensions.throws_ok(
  $sql$insert into public.external_document_sources (owner_id, provider_id, site_id, drive_id, item_id, name) values ('a1000000-0000-4000-8000-000000000002', 'qa', 'forged-site', 'forged-drive', 'forged-item', 'Forbidden')$sql$,
  '42501',
  null,
  'AUTH-RLS-026 owner cannot create an external source for another user'
);
select extensions.throws_ok(
  $sql$insert into public.feedback_responses (user_id, email, feedback) values ('a1000000-0000-4000-8000-000000000002', 'forged@example.test', 'Forbidden')$sql$,
  '42501',
  null,
  'AUTH-RLS-027 owner cannot submit feedback under another user identity'
);

select extensions.is(
  pg_temp.exec_row_count($sql$update public.page_progress set status = 'completed' where id = 'a6000000-0000-4000-8000-000000000002'$sql$),
  0,
  'AUTH-RLS-028 owner cannot update another user page progress'
);
select extensions.is(
  pg_temp.exec_row_count($sql$delete from public.page_progress where id = 'a6000000-0000-4000-8000-000000000002'$sql$),
  0,
  'AUTH-RLS-029 owner cannot delete another user page progress'
);
select extensions.is(
  pg_temp.exec_row_count($sql$delete from public.study_tasks where id = 'a7000000-0000-4000-8000-000000000002'$sql$),
  0,
  'AUTH-RLS-030 owner cannot delete another user study task'
);
select extensions.is(
  pg_temp.exec_row_count($sql$update public.focus_sessions set completed_at = now() where id = 'a9000000-0000-4000-8000-000000000002'$sql$),
  0,
  'AUTH-RLS-031 owner cannot update another user focus session'
);
select extensions.is(
  pg_temp.exec_row_count($sql$delete from public.focus_sessions where id = 'a9000000-0000-4000-8000-000000000002'$sql$),
  0,
  'AUTH-RLS-032 owner cannot delete another user focus session'
);
select extensions.is(
  pg_temp.exec_row_count($sql$update public.friend_connections set status = 'accepted' where id = 'aa000000-0000-4000-8000-000000000003'$sql$),
  0,
  'AUTH-RLS-033 non-participant cannot update FC-BC'
);
select extensions.is(
  pg_temp.exec_row_count($sql$delete from public.friend_connections where id = 'aa000000-0000-4000-8000-000000000003'$sql$),
  0,
  'AUTH-RLS-034 non-participant cannot delete FC-BC'
);
select extensions.is(
  pg_temp.exec_row_count($sql$update public.integration_credentials set access_token_ciphertext = 'changed' where owner_id = 'a1000000-0000-4000-8000-000000000002'$sql$),
  0,
  'AUTH-RLS-035 owner cannot update another user integration credentials'
);
select extensions.is(
  pg_temp.exec_row_count($sql$delete from public.integration_credentials where owner_id = 'a1000000-0000-4000-8000-000000000002'$sql$),
  0,
  'AUTH-RLS-036 owner cannot delete another user integration credentials'
);
select extensions.is(
  pg_temp.exec_row_count($sql$update public.external_document_sources set name = 'Changed' where id = 'ab000000-0000-4000-8000-000000000002'$sql$),
  0,
  'AUTH-RLS-037 owner cannot update another user external document source'
);
select extensions.is(
  pg_temp.exec_row_count($sql$delete from public.external_document_sources where id = 'ab000000-0000-4000-8000-000000000002'$sql$),
  0,
  'AUTH-RLS-038 owner cannot delete another user external document source'
);

select extensions.throws_ok(
  $sql$update public.page_progress set owner_id = 'a1000000-0000-4000-8000-000000000003' where id = 'a6000000-0000-4000-8000-000000000001'$sql$,
  '42501',
  null,
  'AUTH-RLS-039 owner cannot reassign own page progress to C'
);
select extensions.throws_ok(
  $sql$update public.focus_sessions set owner_id = 'a1000000-0000-4000-8000-000000000003' where id = 'a9000000-0000-4000-8000-000000000001'$sql$,
  '42501',
  null,
  'AUTH-RLS-040 owner cannot reassign own focus session to C'
);
select extensions.throws_ok(
  $sql$update public.integration_credentials set owner_id = 'a1000000-0000-4000-8000-000000000003' where owner_id = 'a1000000-0000-4000-8000-000000000001' and provider_id = 'qa-provider-a'$sql$,
  '42501',
  null,
  'AUTH-RLS-041 owner cannot reassign own integration credential to C'
);
select extensions.throws_ok(
  $sql$update public.external_document_sources set owner_id = 'a1000000-0000-4000-8000-000000000003' where id = 'ab000000-0000-4000-8000-000000000001'$sql$,
  '42501',
  null,
  'AUTH-RLS-042 owner cannot reassign own external source to C'
);
select extensions.throws_ok(
  $sql$update public.grimoires set owner_id = 'a1000000-0000-4000-8000-000000000003' where id = 'a2000000-0000-4000-8000-000000000001'$sql$,
  '42501',
  null,
  'AUTH-RLS-043 owner cannot reassign own grimoire to C'
);

select extensions.is(
  pg_temp.exec_row_count($sql$update public.friend_connections set status = 'accepted' where id = 'aa000000-0000-4000-8000-000000000001'$sql$),
  0,
  'AUTH-RLS-044 requester A cannot accept outgoing FC-AB'
);
select extensions.results_eq(
  $sql$select status from public.friend_connections where id = 'aa000000-0000-4000-8000-000000000001'$sql$,
  $expected$values ('pending'::text)$expected$,
  'AUTH-RLS-045 FC-AB remains pending after requester update attempt'
);
select extensions.results_eq(
  $sql$select status from public.friend_connections where id = 'aa000000-0000-4000-8000-000000000002'$sql$,
  $expected$values ('pending'::text)$expected$,
  'AUTH-RLS-046 recipient A sees incoming FC-CA as pending'
);
select extensions.is(
  pg_temp.exec_row_count($sql$update public.friend_connections set status = 'accepted' where id = 'aa000000-0000-4000-8000-000000000002'$sql$),
  1,
  'AUTH-RLS-047 recipient A can accept incoming FC-CA'
);
select extensions.results_eq(
  $sql$select status from public.friend_connections where id = 'aa000000-0000-4000-8000-000000000002'$sql$,
  $expected$values ('accepted'::text)$expected$,
  'AUTH-RLS-048 FC-CA is accepted after recipient update'
);

reset role;

select * from extensions.finish();
rollback;