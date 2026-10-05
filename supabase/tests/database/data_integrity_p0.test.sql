begin;

select extensions.no_plan();

-- QA / Data Integrity P0
-- Behavioral constraint rejection, ownership consistency, cascade/orphan
-- prevention, and transactional rollback coverage. Corruption is performed
-- only inside this transaction and rolled back.

insert into auth.users (id, email)
values
  ('b1000000-0000-4000-8000-000000000001', 'integrity-owner-a@example.test'),
  ('b1000000-0000-4000-8000-000000000002', 'integrity-owner-b@example.test'),
  ('b1000000-0000-4000-8000-000000000003', 'integrity-cascade@example.test');

insert into public.grimoires (id, owner_id, title)
values
  ('b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Integrity A'),
  ('b2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'Integrity B'),
  ('b2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 'Cascade owner');

insert into public.notebooks (id, grimoire_id, title, position)
values
  ('b3000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', 'Notebook A', 0),
  ('b3000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000002', 'Notebook B', 0);

insert into public.chapters (id, notebook_id, title, position)
values
  ('b4000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'Chapter A', 0),
  ('b4000000-0000-4000-8000-000000000002', 'b3000000-0000-4000-8000-000000000002', 'Chapter B', 0);

insert into public.pages (id, chapter_id, title, position)
values
  ('b5000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'Page A', 0),
  ('b5000000-0000-4000-8000-000000000002', 'b4000000-0000-4000-8000-000000000002', 'Page B', 0);

insert into public.page_progress (id, owner_id, page_id, status)
values (
  'b6000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'b5000000-0000-4000-8000-000000000001',
  'in-progress'
);

insert into public.study_tasks (id, owner_id, title)
values (
  'b7000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'Integrity task'
);

insert into public.gamification_profiles (owner_id, xp, streak_days)
values ('b1000000-0000-4000-8000-000000000001', 10, 1);

insert into public.missions (id, owner_id, code, title, reward_xp, target_date)
values (
  'b8000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'integrity',
  'Integrity mission',
  10,
  date '2026-10-05'
);

insert into public.focus_sessions (id, owner_id, duration_seconds, started_at)
values (
  'b9000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  1500,
  timestamptz '2026-10-05 12:00:00+00'
);

insert into public.friend_connections (id, requester_id, recipient_id, status)
values (
  'ba000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002',
  'pending'
);

insert into public.integration_credentials (
  owner_id, provider_id, access_token_ciphertext, refresh_token_ciphertext, access_expires_at
)
values (
  'b1000000-0000-4000-8000-000000000001',
  'integrity-provider',
  'cipher-a',
  'refresh-a',
  now() + interval '1 hour'
);

insert into public.external_document_sources (
  id, owner_id, provider_id, site_id, drive_id, item_id, name
)
values (
  'bb000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'integrity-provider',
  'site-a',
  'drive-a',
  'item-a',
  'Integrity source'
);

insert into public.feedback_responses (id, user_id, email, feedback)
values (
  'bc000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'owner-a@example.test',
  'Integrity feedback'
);

insert into public.educational_practice_items (
  id, owner_id, page_id, prompt, reference_answer, explanation, difficulty
)
values (
  'bd000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'b5000000-0000-4000-8000-000000000001',
  'Prompt A',
  'Answer A',
  'Explanation A',
  3
);

insert into public.educational_practice_attempts (
  id, owner_id, practice_item_id, answer, outcome, evidence_score, confidence, feedback
)
values (
  'be000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'bd000000-0000-4000-8000-000000000001',
  'Answer A',
  'strong',
  1.0,
  'strong',
  'Good'
);

-- PK / FK / CHECK / NOT NULL / UNIQUE behavioral rejection.

select extensions.throws_ok(
  $$insert into public.grimoires (id, owner_id, title)
    values ('b2000000-0000-4000-8000-000000000001',
            'b1000000-0000-4000-8000-000000000001', 'Duplicate')$$,
  '23505', null, 'duplicate primary key is rejected'
);

select extensions.throws_ok(
  $$insert into public.grimoires (owner_id, title)
    values ('b1ffffff-ffff-4fff-8fff-ffffffffffff', 'Missing owner')$$,
  '23503', null, 'nonexistent grimoire owner FK is rejected'
);

select extensions.throws_ok(
  $$insert into public.notebooks (grimoire_id, title, position)
    values ('b2ffffff-ffff-4fff-8fff-ffffffffffff', 'Missing parent', 0)$$,
  '23503', null, 'nonexistent notebook parent FK is rejected'
);

select extensions.throws_ok(
  $$insert into public.notebooks (grimoire_id, title, position)
    values ('b2000000-0000-4000-8000-000000000001', 'Negative position', -1)$$,
  '23514', null, 'negative notebook position is rejected'
);

select extensions.throws_ok(
  $$insert into public.chapters (notebook_id, title, position)
    values ('b3ffffff-ffff-4fff-8fff-ffffffffffff', 'Missing parent', 0)$$,
  '23503', null, 'nonexistent chapter parent FK is rejected'
);

select extensions.throws_ok(
  $$insert into public.chapters (notebook_id, title, position)
    values ('b3000000-0000-4000-8000-000000000001', 'Negative position', -1)$$,
  '23514', null, 'negative chapter position is rejected'
);

select extensions.throws_ok(
  $$insert into public.pages (chapter_id, title, position)
    values ('b4ffffff-ffff-4fff-8fff-ffffffffffff', 'Missing parent', 0)$$,
  '23503', null, 'nonexistent page parent FK is rejected'
);

select extensions.throws_ok(
  $$insert into public.pages (chapter_id, title, position)
    values ('b4000000-0000-4000-8000-000000000001', 'Negative position', -1)$$,
  '23514', null, 'negative page position is rejected'
);

select extensions.throws_ok(
  $$insert into public.page_progress (owner_id, page_id, status)
    values ('b1000000-0000-4000-8000-000000000001',
            'b5000000-0000-4000-8000-000000000001', 'completed')$$,
  '23505', null, 'duplicate owner/page progress is rejected'
);

select extensions.throws_ok(
  $$insert into public.page_progress (owner_id, page_id, status)
    values ('b1000000-0000-4000-8000-000000000001',
            'b5000000-0000-4000-8000-000000000002', 'invalid')$$,
  '23514', null, 'invalid progress status is rejected'
);

select extensions.throws_ok(
  $$insert into public.page_progress (owner_id, page_id, status)
    values ('b1ffffff-ffff-4fff-8fff-ffffffffffff',
            'b5000000-0000-4000-8000-000000000001', 'in-progress')$$,
  '23503', null, 'nonexistent progress owner FK is rejected'
);

select extensions.throws_ok(
  $$insert into public.study_tasks (owner_id, title)
    values ('b1000000-0000-4000-8000-000000000001', null)$$,
  '23502', null, 'null study task title is rejected'
);

select extensions.throws_ok(
  $$insert into public.study_tasks (owner_id, title)
    values ('b1000000-0000-4000-8000-000000000001', '   ')$$,
  '23514', null, 'blank study task title is rejected'
);

select extensions.throws_ok(
  $$insert into public.study_tasks (owner_id, title, status)
    values ('b1000000-0000-4000-8000-000000000001', 'Bad status', 'invalid')$$,
  '23514', null, 'invalid study task status is rejected'
);

select extensions.throws_ok(
  $$update public.gamification_profiles set xp = -1
    where owner_id = 'b1000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'negative XP is rejected'
);

select extensions.throws_ok(
  $$update public.gamification_profiles set streak_days = -1
    where owner_id = 'b1000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'negative streak is rejected'
);

select extensions.throws_ok(
  $$insert into public.missions (owner_id, code, title, reward_xp, target_date)
    values ('b1000000-0000-4000-8000-000000000001',
            'bad-reward', 'Bad reward', -1, date '2026-10-06')$$,
  '23514', null, 'negative mission reward is rejected'
);

select extensions.throws_ok(
  $$insert into public.missions (owner_id, code, title, reward_xp, target_date)
    values ('b1000000-0000-4000-8000-000000000001',
            'integrity', 'Duplicate mission', 10, date '2026-10-05')$$,
  '23505', null, 'duplicate daily mission identity is rejected'
);

select extensions.throws_ok(
  $$insert into public.focus_sessions (owner_id, duration_seconds, started_at)
    values ('b1000000-0000-4000-8000-000000000001', 59, now())$$,
  '23514', null, 'focus duration below minimum is rejected'
);

select extensions.throws_ok(
  $$insert into public.focus_sessions
      (owner_id, duration_seconds, started_at, completed_at)
    values ('b1000000-0000-4000-8000-000000000001', 60,
            timestamptz '2026-10-05 13:00:00+00',
            timestamptz '2026-10-05 12:59:59+00')$$,
  '23514', null, 'focus completion before start is rejected'
);

select extensions.throws_ok(
  $$insert into public.friend_connections (requester_id, recipient_id)
    values ('b1000000-0000-4000-8000-000000000001',
            'b1000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'self friendship is rejected'
);

select extensions.throws_ok(
  $$insert into public.friend_connections (requester_id, recipient_id)
    values ('b1000000-0000-4000-8000-000000000002',
            'b1000000-0000-4000-8000-000000000001')$$,
  '23505', null, 'reverse duplicate friendship pair is rejected'
);

select extensions.throws_ok(
  $$insert into public.integration_credentials
      (owner_id, provider_id, access_token_ciphertext,
       refresh_token_ciphertext, access_expires_at)
    values ('b1000000-0000-4000-8000-000000000001',
            '   ', 'cipher', 'refresh', now() + interval '1 hour')$$,
  '23514', null, 'blank credential provider is rejected'
);

select extensions.throws_ok(
  $$insert into public.integration_credentials
      (owner_id, provider_id, access_token_ciphertext,
       refresh_token_ciphertext, access_expires_at)
    values ('b1000000-0000-4000-8000-000000000001',
            'integrity-provider', 'cipher', 'refresh', now() + interval '1 hour')$$,
  '23505', null, 'duplicate owner/provider credential is rejected'
);

select extensions.throws_ok(
  $$insert into public.external_document_sources
      (owner_id, provider_id, source_type, site_id, drive_id, item_id)
    values ('b1000000-0000-4000-8000-000000000001',
            'p', 'invalid', 's', 'd', 'i')$$,
  '23514', null, 'invalid external source type is rejected'
);

select extensions.throws_ok(
  $$insert into public.external_document_sources
      (owner_id, provider_id, site_id, drive_id, item_id, status)
    values ('b1000000-0000-4000-8000-000000000001',
            'p', 's', 'd', 'i', 'invalid')$$,
  '23514', null, 'invalid external source status is rejected'
);

select extensions.throws_ok(
  $$insert into public.external_document_sources
      (owner_id, provider_id, site_id, drive_id, item_id)
    values ('b1000000-0000-4000-8000-000000000001',
            'integrity-provider', 'site-a', 'drive-a', 'item-a')$$,
  '23505', null, 'duplicate external document identity is rejected'
);

select extensions.throws_ok(
  $$insert into public.feedback_responses (user_id, email, feedback)
    values ('b1000000-0000-4000-8000-000000000001', '', 'Feedback')$$,
  '23514', null, 'invalid feedback email length is rejected'
);

select extensions.throws_ok(
  $$insert into public.feedback_responses (user_id, email, feedback)
    values ('b1000000-0000-4000-8000-000000000001',
            'owner-a@example.test', '   ')$$,
  '23514', null, 'blank feedback body is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_items
      (owner_id, page_id, prompt, reference_answer)
    values ('b1000000-0000-4000-8000-000000000001',
            'b5000000-0000-4000-8000-000000000001', '   ', 'A')$$,
  '23514', null, 'blank educational prompt is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_items
      (owner_id, page_id, prompt, reference_answer, difficulty)
    values ('b1000000-0000-4000-8000-000000000001',
            'b5000000-0000-4000-8000-000000000001', 'P', 'A', 6)$$,
  '23514', null, 'educational difficulty outside range is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_items
      (owner_id, page_id, prompt, reference_answer, evidence_mode)
    values ('b1000000-0000-4000-8000-000000000001',
            'b5000000-0000-4000-8000-000000000001', 'P', 'A', 'invalid')$$,
  '23514', null, 'invalid evidence mode is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_items
      (owner_id, page_id, prompt, reference_answer, minimum_evidence)
    values ('b1000000-0000-4000-8000-000000000001',
            'b5000000-0000-4000-8000-000000000001', 'P', 'A', 0)$$,
  '23514', null, 'minimum evidence below range is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_items
      (owner_id, page_id, prompt, reference_answer)
    values ('b1000000-0000-4000-8000-000000000001',
            'b5ffffff-ffff-4fff-8fff-ffffffffffff', 'P', 'A')$$,
  '23503', null, 'nonexistent educational page FK is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_attempts
      (owner_id, practice_item_id, answer, outcome, evidence_score, confidence, feedback)
    values ('b1000000-0000-4000-8000-000000000001',
            'bd000000-0000-4000-8000-000000000001',
            'A', 'invalid', 0.5, 'strong', 'F')$$,
  '23514', null, 'invalid educational outcome is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_attempts
      (owner_id, practice_item_id, answer, outcome, evidence_score, confidence, feedback)
    values ('b1000000-0000-4000-8000-000000000001',
            'bd000000-0000-4000-8000-000000000001',
            'A', 'strong', 1.1, 'strong', 'F')$$,
  '23514', null, 'evidence score above range is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_attempts
      (owner_id, practice_item_id, answer, outcome, evidence_score, confidence, feedback)
    values ('b1000000-0000-4000-8000-000000000001',
            'bd000000-0000-4000-8000-000000000001',
            'A', 'strong', 1.0, 'invalid', 'F')$$,
  '23514', null, 'invalid educational confidence is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_attempts
      (owner_id, practice_item_id, answer, outcome, evidence_score, confidence, feedback, evidence_type)
    values ('b1000000-0000-4000-8000-000000000001',
            'bd000000-0000-4000-8000-000000000001',
            'A', 'strong', 1.0, 'strong', 'F', 'invalid')$$,
  '23514', null, 'invalid evidence type is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_attempts
      (owner_id, practice_item_id, answer, outcome, evidence_score, confidence, feedback, criterion_result)
    values ('b1000000-0000-4000-8000-000000000001',
            'bd000000-0000-4000-8000-000000000001',
            'A', 'strong', 1.0, 'strong', 'F', 'invalid')$$,
  '23514', null, 'invalid criterion result is rejected'
);

select extensions.throws_ok(
  $$insert into public.educational_practice_attempts
      (owner_id, practice_item_id, answer, outcome, evidence_score, confidence, feedback)
    values ('b1000000-0000-4000-8000-000000000001',
            'bdffffff-ffff-4fff-8fff-ffffffffffff',
            'A', 'strong', 1.0, 'strong', 'F')$$,
  '23503', null, 'nonexistent practice item FK is rejected'
);

-- Relational ownership consistency is enforced behaviorally through RLS.
select set_config(
  'request.jwt.claim.sub',
  'b1000000-0000-4000-8000-000000000001',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.throws_ok(
  $$insert into public.educational_practice_items
      (owner_id, page_id, prompt, reference_answer)
    values ('b1000000-0000-4000-8000-000000000001',
            'b5000000-0000-4000-8000-000000000002',
            'Cross-owner', 'Forbidden')$$,
  '42501', null, 'owner cannot bind educational item to another owner page'
);

reset role;

-- Atomicity: force page_progress to fail after the attempt insert. The RPC
-- statement must roll back the already-created attempt.
insert into public.educational_practice_items (
  id, owner_id, page_id, prompt, reference_answer, explanation, difficulty
)
values (
  'bd000000-0000-4000-8000-000000000010',
  'b1000000-0000-4000-8000-000000000001',
  'b5000000-0000-4000-8000-000000000001',
  'Atomic self assessment',
  'Atomic answer',
  'Atomic explanation',
  3
);

insert into public.educational_practice_items (
  id, owner_id, page_id, prompt, reference_answer, explanation, difficulty,
  evidence_mode, criterion, criterion_version
)
values (
  'bd000000-0000-4000-8000-000000000011',
  'b1000000-0000-4000-8000-000000000001',
  'b5000000-0000-4000-8000-000000000001',
  'Atomic criterion',
  'Criterion answer',
  'Atomic explanation',
  3,
  'criterion_exact_match',
  'normalized exact match',
  'v1'
);

create function pg_temp.fail_data_integrity_progress_write()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id = 'b1000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'qa forced progress failure' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger data_integrity_progress_failure
before insert or update on public.page_progress
for each row
execute function pg_temp.fail_data_integrity_progress_write();

select set_config(
  'request.jwt.claim.sub',
  'b1000000-0000-4000-8000-000000000001',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.throws_ok(
  $$select public.record_educational_practice_attempt(
      'bd000000-0000-4000-8000-000000000010',
      'Atomic answer', 'strong', 1.0, 'strong', 'Feedback'
    )$$,
  'P0001',
  'qa forced progress failure',
  'self-assessment RPC rolls back when progress persistence fails'
);

reset role;

select extensions.is(
  (select count(*)::integer
     from public.educational_practice_attempts
    where practice_item_id = 'bd000000-0000-4000-8000-000000000010'),
  0,
  'failed self-assessment RPC leaves no partial attempt'
);

select set_config(
  'request.jwt.claim.sub',
  'b1000000-0000-4000-8000-000000000001',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.throws_ok(
  $$select public.record_criterion_referenced_practice_attempt(
      'bd000000-0000-4000-8000-000000000011',
      'Criterion answer'
    )$$,
  'P0001',
  'qa forced progress failure',
  'criterion RPC rolls back when progress persistence fails'
);

reset role;

select extensions.is(
  (select count(*)::integer
     from public.educational_practice_attempts
    where practice_item_id = 'bd000000-0000-4000-8000-000000000011'),
  0,
  'failed criterion RPC leaves no partial attempt'
);

drop trigger data_integrity_progress_failure on public.page_progress;

-- Hierarchy cascade/orphan prevention: deleting the root must leave no
-- descendants or educational/page-progress orphans.
delete from public.grimoires
where id = 'b2000000-0000-4000-8000-000000000001';

select extensions.is(
  (select count(*)::integer from public.notebooks
    where id = 'b3000000-0000-4000-8000-000000000001'),
  0, 'grimoire deletion cascades notebook'
);

select extensions.is(
  (select count(*)::integer from public.chapters
    where id = 'b4000000-0000-4000-8000-000000000001'),
  0, 'grimoire deletion leaves no chapter orphan'
);

select extensions.is(
  (select count(*)::integer from public.pages
    where id = 'b5000000-0000-4000-8000-000000000001'),
  0, 'grimoire deletion leaves no page orphan'
);

select extensions.is(
  (select count(*)::integer from public.page_progress
    where id = 'b6000000-0000-4000-8000-000000000001'),
  0, 'page deletion cascades page progress'
);

select extensions.is(
  (select count(*)::integer from public.educational_practice_items
    where id in (
      'bd000000-0000-4000-8000-000000000001',
      'bd000000-0000-4000-8000-000000000010',
      'bd000000-0000-4000-8000-000000000011'
    )),
  0, 'page deletion cascades educational practice items'
);

select extensions.is(
  (select count(*)::integer from public.educational_practice_attempts
    where id = 'be000000-0000-4000-8000-000000000001'),
  0, 'practice item deletion cascades educational attempts without orphans'
);

-- Auth-owner cascade across direct user-owned surfaces.
insert into public.study_tasks (id, owner_id, title)
values ('bf000000-0000-4000-8000-000000000001',
        'b1000000-0000-4000-8000-000000000003', 'Cascade task');

insert into public.gamification_profiles (owner_id)
values ('b1000000-0000-4000-8000-000000000003');

insert into public.missions (id, owner_id, code, title, reward_xp, target_date)
values ('bf000000-0000-4000-8000-000000000002',
        'b1000000-0000-4000-8000-000000000003',
        'cascade', 'Cascade mission', 1, date '2026-10-05');

insert into public.focus_sessions (id, owner_id, duration_seconds, started_at)
values ('bf000000-0000-4000-8000-000000000003',
        'b1000000-0000-4000-8000-000000000003',
        60, now());

insert into public.integration_credentials (
  owner_id, provider_id, access_token_ciphertext, refresh_token_ciphertext, access_expires_at
)
values ('b1000000-0000-4000-8000-000000000003',
        'cascade-provider', 'cipher', 'refresh', now() + interval '1 hour');

insert into public.external_document_sources (
  id, owner_id, provider_id, site_id, drive_id, item_id
)
values ('bf000000-0000-4000-8000-000000000004',
        'b1000000-0000-4000-8000-000000000003',
        'cascade-provider', 'site', 'drive', 'item');

insert into public.feedback_responses (id, user_id, email, feedback)
values ('bf000000-0000-4000-8000-000000000005',
        'b1000000-0000-4000-8000-000000000003',
        'cascade@example.test', 'Cascade feedback');

insert into public.friend_connections (id, requester_id, recipient_id)
values ('bf000000-0000-4000-8000-000000000006',
        'b1000000-0000-4000-8000-000000000003',
        'b1000000-0000-4000-8000-000000000002');

delete from auth.users
where id = 'b1000000-0000-4000-8000-000000000003';

select extensions.is(
  (select count(*)::integer from public.grimoires
    where id = 'b2000000-0000-4000-8000-000000000003'),
  0, 'user deletion cascades owned grimoire'
);

select extensions.is(
  (select count(*)::integer from public.study_tasks
    where id = 'bf000000-0000-4000-8000-000000000001'),
  0, 'user deletion cascades study tasks'
);

select extensions.is(
  (select count(*)::integer from public.gamification_profiles
    where owner_id = 'b1000000-0000-4000-8000-000000000003'),
  0, 'user deletion cascades gamification profile'
);

select extensions.is(
  (select count(*)::integer from public.missions
    where id = 'bf000000-0000-4000-8000-000000000002'),
  0, 'user deletion cascades missions'
);

select extensions.is(
  (select count(*)::integer from public.focus_sessions
    where id = 'bf000000-0000-4000-8000-000000000003'),
  0, 'user deletion cascades focus sessions'
);

select extensions.is(
  (select count(*)::integer from public.integration_credentials
    where owner_id = 'b1000000-0000-4000-8000-000000000003'),
  0, 'user deletion cascades integration credentials'
);

select extensions.is(
  (select count(*)::integer from public.external_document_sources
    where id = 'bf000000-0000-4000-8000-000000000004'),
  0, 'user deletion cascades external document sources'
);

select extensions.is(
  (select count(*)::integer from public.feedback_responses
    where id = 'bf000000-0000-4000-8000-000000000005'),
  0, 'user deletion cascades feedback responses'
);

select extensions.is(
  (select count(*)::integer from public.friend_connections
    where id = 'bf000000-0000-4000-8000-000000000006'),
  0, 'user deletion cascades social connections involving the user'
);

select extensions.finish();

rollback;
