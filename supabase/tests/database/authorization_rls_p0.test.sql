begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(38);

insert into auth.users (id, email)
values
  ('a1000000-0000-4000-8000-000000000001', 'qa-rls-owner-a@example.test'),
  ('a1000000-0000-4000-8000-000000000002', 'qa-rls-owner-b@example.test'),
  ('a1000000-0000-4000-8000-000000000003', 'qa-rls-owner-c@example.test');

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
  ('aa000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', 'pending');

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

select extensions.ok(
  not has_table_privilege('anon', 'public.grimoires', 'SELECT'),
  'anon cannot read workspace hierarchy'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.focus_sessions', 'SELECT'),
  'anon cannot read focus sessions'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.integration_credentials', 'SELECT'),
  'anon cannot read integration credentials'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.external_document_sources', 'SELECT'),
  'anon cannot read external document sources'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.feedback_responses', 'SELECT'),
  'anon cannot read feedback responses'
);

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.is((select count(*)::integer from public.grimoires), 1, 'owner sees only own grimoires');
select extensions.is((select count(*)::integer from public.notebooks), 1, 'owner sees only notebooks in own grimoires');
select extensions.is((select count(*)::integer from public.chapters), 1, 'owner sees only chapters in own grimoires');
select extensions.is((select count(*)::integer from public.pages), 1, 'owner sees only pages in own grimoires');
select extensions.is((select count(*)::integer from public.page_progress), 1, 'owner sees only own page progress');
select extensions.is((select count(*)::integer from public.study_tasks), 1, 'owner sees only own study tasks');
select extensions.is((select count(*)::integer from public.gamification_profiles), 1, 'owner sees only own gamification profile');
select extensions.is((select count(*)::integer from public.missions), 1, 'owner sees only own missions');
select extensions.is((select count(*)::integer from public.focus_sessions), 1, 'owner sees only own focus sessions');
select extensions.is((select count(*)::integer from public.friend_connections), 1, 'participant sees own connection but not unrelated connection');
select extensions.is((select count(*)::integer from public.integration_credentials), 1, 'owner sees only own integration credentials');
select extensions.is((select count(*)::integer from public.external_document_sources), 1, 'owner sees only own external document sources');
select extensions.is((select count(*)::integer from public.feedback_responses), 1, 'owner sees only own feedback responses');

select extensions.throws_ok(
  $$insert into public.grimoires (owner_id, title)
    values ('a1000000-0000-4000-8000-000000000002', 'Forbidden')$$,
  '42501',
  null,
  'owner cannot create a grimoire for another user'
);

select extensions.throws_ok(
  $$insert into public.notebooks (grimoire_id, title, position)
    values ('a2000000-0000-4000-8000-000000000002', 'Forbidden', 1)$$,
  '42501',
  null,
  'owner cannot create a notebook inside another user grimoire'
);

select extensions.throws_ok(
  $$insert into public.page_progress (owner_id, page_id, status)
    values ('a1000000-0000-4000-8000-000000000001', 'a5000000-0000-4000-8000-000000000002', 'in-progress')$$,
  '42501',
  null,
  'owner cannot create progress for a page owned by another user'
);

select extensions.is(
  (with changed as (
    update public.page_progress set status = 'completed'
    where id = 'a6000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from changed),
  0,
  'owner cannot update another user page progress'
);

select extensions.is(
  (with removed as (
    delete from public.page_progress
    where id = 'a6000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from removed),
  0,
  'owner cannot delete another user page progress'
);

select extensions.throws_ok(
  $$insert into public.study_tasks (owner_id, title)
    values ('a1000000-0000-4000-8000-000000000002', 'Forbidden')$$,
  '42501',
  null,
  'owner cannot create a study task for another user'
);

select extensions.is(
  (with removed as (
    delete from public.study_tasks
    where id = 'a7000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from removed),
  0,
  'owner cannot delete another user study task'
);

select extensions.throws_ok(
  $$insert into public.focus_sessions (owner_id, duration_seconds, started_at)
    values ('a1000000-0000-4000-8000-000000000002', 1500, now())$$,
  '42501',
  null,
  'owner cannot create a focus session for another user'
);

select extensions.is(
  (with changed as (
    update public.focus_sessions set completed_at = now()
    where id = 'a9000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from changed),
  0,
  'owner cannot update another user focus session'
);

select extensions.is(
  (with removed as (
    delete from public.focus_sessions
    where id = 'a9000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from removed),
  0,
  'owner cannot delete another user focus session'
);

select extensions.throws_ok(
  $$insert into public.friend_connections (requester_id, recipient_id)
    values ('a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003')$$,
  '42501',
  null,
  'user cannot forge another requester identity'
);

select extensions.is(
  (with changed as (
    update public.friend_connections set status = 'accepted'
    where id = 'aa000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from changed),
  0,
  'non-participant cannot update another connection'
);

select extensions.is(
  (with removed as (
    delete from public.friend_connections
    where id = 'aa000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from removed),
  0,
  'non-participant cannot delete another connection'
);

select extensions.throws_ok(
  $$insert into public.integration_credentials (
      owner_id, provider_id, access_token_ciphertext, refresh_token_ciphertext, access_expires_at
    ) values (
      'a1000000-0000-4000-8000-000000000002', 'forged', 'cipher', 'refresh', now() + interval '1 hour'
    )$$,
  '42501',
  null,
  'owner cannot create integration credentials for another user'
);

select extensions.is(
  (with changed as (
    update public.integration_credentials set access_token_ciphertext = 'changed'
    where owner_id = 'a1000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from changed),
  0,
  'owner cannot update another user integration credentials'
);

select extensions.is(
  (with removed as (
    delete from public.integration_credentials
    where owner_id = 'a1000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from removed),
  0,
  'owner cannot delete another user integration credentials'
);

select extensions.throws_ok(
  $$update public.integration_credentials
      set owner_id = 'a1000000-0000-4000-8000-000000000003'
    where owner_id = 'a1000000-0000-4000-8000-000000000001'
      and provider_id = 'qa-provider-a'$$,
  '42501',
  null,
  'owner cannot escalate integration credential ownership'
);

select extensions.throws_ok(
  $$insert into public.external_document_sources (
      owner_id, provider_id, site_id, drive_id, item_id, name
    ) values (
      'a1000000-0000-4000-8000-000000000002', 'qa', 'forged-site', 'forged-drive', 'forged-item', 'Forbidden'
    )$$,
  '42501',
  null,
  'owner cannot create an external source for another user'
);

select extensions.is(
  (with changed as (
    update public.external_document_sources set name = 'Changed'
    where id = 'ab000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from changed),
  0,
  'owner cannot update another user external document source'
);

select extensions.is(
  (with removed as (
    delete from public.external_document_sources
    where id = 'ab000000-0000-4000-8000-000000000002'
    returning 1
  ) select count(*)::integer from removed),
  0,
  'owner cannot delete another user external document source'
);

select extensions.throws_ok(
  $$update public.external_document_sources
      set owner_id = 'a1000000-0000-4000-8000-000000000003'
    where id = 'ab000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'owner cannot escalate external source ownership'
);

select extensions.throws_ok(
  $$insert into public.feedback_responses (user_id, email, feedback)
    values ('a1000000-0000-4000-8000-000000000002', 'forged@example.test', 'Forbidden')$$,
  '42501',
  null,
  'owner cannot submit feedback under another user identity'
);

select extensions.throws_ok(
  $$update public.grimoires
      set owner_id = 'a1000000-0000-4000-8000-000000000003'
    where id = 'a2000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'owner cannot escalate grimoire ownership'
);

reset role;

select * from extensions.finish();
rollback;
