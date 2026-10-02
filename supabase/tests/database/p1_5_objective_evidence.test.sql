begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(23);

insert into auth.users (id, email)
values
  ('97000000-0000-4000-8000-000000000001', 'p15-owner-1@example.test'),
  ('97000000-0000-4000-8000-000000000002', 'p15-owner-2@example.test');

insert into public.grimoires (id, owner_id, title)
values (
  '97100000-0000-4000-8000-000000000001',
  '97000000-0000-4000-8000-000000000001',
  'P1.5 Grimoire'
);

insert into public.notebooks (id, grimoire_id, title, position)
values (
  '97200000-0000-4000-8000-000000000001',
  '97100000-0000-4000-8000-000000000001',
  'P1.5 Notebook',
  0
);

insert into public.chapters (id, notebook_id, title, position)
values (
  '97300000-0000-4000-8000-000000000001',
  '97200000-0000-4000-8000-000000000001',
  'P1.5 Chapter',
  0
);

insert into public.pages (id, chapter_id, title, position)
values (
  '97400000-0000-4000-8000-000000000001',
  '97300000-0000-4000-8000-000000000001',
  'P1.5 Page',
  0
);

insert into public.educational_practice_items (
  id,
  owner_id,
  page_id,
  prompt,
  reference_answer,
  evidence_mode,
  criterion,
  criterion_version,
  minimum_evidence,
  difficulty
)
values (
  '97500000-0000-4000-8000-000000000001',
  '97000000-0000-4000-8000-000000000001',
  '97400000-0000-4000-8000-000000000001',
  'Qual é a resposta objetiva?',
  'Resposta correta',
  'criterion_exact_match',
  'A resposta normalizada deve coincidir exatamente com a resposta de referência.',
  'criterion_exact_match_v1',
  2,
  3
);

select set_config(
  'request.jwt.claim.sub',
  '97000000-0000-4000-8000-000000000001',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

set local role authenticated;

select extensions.is(
  (
    select (public.record_criterion_referenced_practice_attempt(
      '97500000-0000-4000-8000-000000000001',
      '  RESPOSTA    CORRETA '
    )).criterion_result
  ),
  'pass',
  'objective RPC evaluates normalized exact-match response on the server'
);

select extensions.is(
  (
    select evidence_type
    from public.educational_practice_attempts
    where practice_item_id = '97500000-0000-4000-8000-000000000001'
  ),
  'criterion-referenced',
  'objective attempt is persisted as criterion-referenced evidence'
);

select extensions.is(
  (
    select evidence_score
    from public.educational_practice_attempts
    where practice_item_id = '97500000-0000-4000-8000-000000000001'
  ),
  1.0::numeric,
  'passing objective attempt stores full evidence score'
);

select extensions.is(
  (
    select criterion_version
    from public.educational_practice_attempts
    where practice_item_id = '97500000-0000-4000-8000-000000000001'
  ),
  'criterion_exact_match_v1',
  'objective attempt stores criterion version provenance'
);

select extensions.is(
  (
    select (public.record_criterion_referenced_practice_attempt(
      '97500000-0000-4000-8000-000000000001',
      'Resposta diferente'
    )).criterion_result
  ),
  'fail',
  'objective RPC records a failing criterion result'
);

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_attempts
    where practice_item_id = '97500000-0000-4000-8000-000000000001'
      and evidence_type = 'criterion-referenced'
  ),
  2,
  'both objective attempts are persisted'
);

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_attempts
    where practice_item_id = '97500000-0000-4000-8000-000000000001'
      and criterion_result = 'pass'
  ),
  1,
  'only the matching response is marked as passing'
);

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_attempts
    where practice_item_id = '97500000-0000-4000-8000-000000000001'
      and criterion = 'A resposta normalizada deve coincidir exatamente com a resposta de referência.'
  ),
  2,
  'criterion snapshot is persisted with both attempts'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'public.educational_practice_attempts',
    'INSERT'
  ),
  'authenticated cannot bypass objective evidence RPC with direct insert'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.record_criterion_referenced_practice_attempt(uuid, text)',
    'EXECUTE'
  ),
  'authenticated can execute the public objective evidence operation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.record_criterion_referenced_practice_attempt(uuid, text)',
    'EXECUTE'
  ),
  'anon cannot execute the public objective evidence operation'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    'public.record_criterion_referenced_practice_attempt(uuid, text)',
    'EXECUTE'
  ),
  'service_role cannot execute the public objective evidence operation'
);

select extensions.ok(
  not prosecdef,
  'public objective evidence operation is SECURITY INVOKER'
)
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'record_criterion_referenced_practice_attempt'
  and pronargs = 2;

select extensions.ok(
  prosecdef,
  'private objective evidence implementation is SECURITY DEFINER'
)
from pg_proc
where pronamespace = 'private'::regnamespace
  and proname = 'record_criterion_referenced_practice_attempt'
  and pronargs = 2;

select extensions.throws_ok(
  $$select public.record_criterion_referenced_practice_attempt(
    '97500000-0000-4000-8000-000000000001',
    'Outra tentativa'
  )$$,
  '22023',
  'Esta atividade usa autoavaliação, não avaliação objetiva.',
  'objective RPC refuses an activity configured for self-assessment'
);

select extensions.throws_ok(
  $$update public.educational_practice_items
      set criterion_version = 'criterion_exact_match_v2'
    where id = '97500000-0000-4000-8000-000000000001'$$,
  '55000',
  'O critério objetivo não pode ser alterado depois que já houver evidência objetiva registrada.',
  'criterion configuration is immutable after objective evidence exists'
);

reset role;

select set_config(
  'request.jwt.claim.sub',
  '97000000-0000-4000-8000-000000000002',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

set local role authenticated;

select extensions.throws_ok(
  $$select public.record_criterion_referenced_practice_attempt(
    '97500000-0000-4000-8000-000000000001',
    'Resposta correta'
  )$$,
  'P0002',
  'Atividade de prática não encontrada.',
  'other owner cannot create objective evidence for another learner'
);

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_attempts
    where owner_id = '97000000-0000-4000-8000-000000000002'
  ),
  0,
  'unauthorized owner does not create evidence'
);

reset role;

select extensions.finish();

rollback;
