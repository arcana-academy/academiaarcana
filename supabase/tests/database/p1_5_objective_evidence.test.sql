begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(24);

insert into auth.users (id, email)
values
  ('91000000-0000-4000-8000-000000000011', 'p15-owner-1@example.test'),
  ('91000000-0000-4000-8000-000000000012', 'p15-owner-2@example.test');

insert into public.grimoires (id, owner_id, title)
values (
  '92000000-0000-4000-8000-000000000011',
  '91000000-0000-4000-8000-000000000011',
  'P1.5 Grimoire'
);

insert into public.notebooks (id, grimoire_id, title, position)
values (
  '93000000-0000-4000-8000-000000000011',
  '92000000-0000-4000-8000-000000000011',
  'P1.5 Notebook',
  0
);

insert into public.chapters (id, notebook_id, title, position)
values (
  '94000000-0000-4000-8000-000000000011',
  '93000000-0000-4000-8000-000000000011',
  'P1.5 Chapter',
  0
);

insert into public.pages (id, chapter_id, title, position)
values (
  '95000000-0000-4000-8000-000000000011',
  '94000000-0000-4000-8000-000000000011',
  'P1.5 Page',
  0
);

insert into public.educational_objective_assessments (
  id, owner_id, page_id, prompt, reference_answer, criterion,
  scoring_policy, minimum_evidence, validity_scope, criterion_version
)
values (
  '96000000-0000-4000-8000-000000000011',
  '91000000-0000-4000-8000-000000000011',
  '95000000-0000-4000-8000-000000000011',
  'Qual é a resposta objetiva?',
  'Resposta correta',
  'A resposta deve corresponder à referência após normalização de caixa e espaços.',
  'normalized-exact-match',
  2,
  'page',
  1
);

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000011', true);
select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-8000-000000000011","role":"authenticated"}', true);
set local role authenticated;

select extensions.is(
  (select count(*)::integer from public.educational_objective_assessments),
  1,
  'owner enxerga sua avaliação objetiva'
);

select extensions.is(
  (select count(*)::integer from public.educational_objective_attempts),
  0,
  'owner começa sem evidência objetiva'
);

select extensions.is(
  (select (public.record_educational_objective_attempt(
    '96000000-0000-4000-8000-000000000011',
    '  RESPOSTA   CORRETA '
  )).outcome),
  'pass',
  'critério normalizado aceita caixa e espaços diferentes'
);

select extensions.is(
  (select evidence_score from public.educational_objective_attempts),
  1::numeric,
  'resposta aprovada recebe evidência objetiva 1'
);

select extensions.is(
  (select confidence from public.educational_objective_attempts),
  'strong',
  'evidência objetiva recebe confiança forte'
);

select extensions.is(
  (select criterion_version from public.educational_objective_attempts),
  1,
  'tentativa preserva a versão do critério'
);

select extensions.is(
  (select (public.record_educational_objective_attempt(
    '96000000-0000-4000-8000-000000000011',
    'Outra resposta'
  )).outcome),
  'fail',
  'resposta divergente falha o critério'
);

select extensions.is(
  (select count(*)::integer from public.educational_objective_attempts),
  2,
  'cada avaliação produz uma tentativa imutável'
);

reset role;

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000012', true);
select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-8000-000000000012","role":"authenticated"}', true);
set local role authenticated;

select extensions.is(
  (select count(*)::integer from public.educational_objective_assessments),
  0,
  'outro owner não enxerga avaliação alheia'
);

select extensions.is(
  (select count(*)::integer from public.educational_objective_attempts),
  0,
  'outro owner não enxerga evidência alheia'
);

select extensions.throws_ok(
  $$select public.record_educational_objective_attempt(
    '96000000-0000-4000-8000-000000000011',
    'Tentativa indevida'
  )$$,
  'P0002',
  'Avaliação objetiva não encontrada.',
  'outro owner não pode registrar evidência objetiva alheia'
);

select extensions.is(
  (select count(*)::integer from public.educational_objective_attempts),
  0,
  'tentativa não autorizada não produz evidência'
);

reset role;

select extensions.ok(
  not has_table_privilege('anon', 'public.educational_objective_assessments', 'SELECT'),
  'anon cannot read objective assessments'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.educational_objective_attempts', 'SELECT'),
  'anon cannot read objective attempts'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_objective_attempts', 'INSERT'),
  'authenticated cannot bypass objective evidence RPC'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.record_educational_objective_attempt(uuid, text)',
    'EXECUTE'
  ),
  'authenticated can execute objective evidence RPC'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.record_educational_objective_attempt(uuid, text)',
    'EXECUTE'
  ),
  'anon cannot execute objective evidence RPC'
);

select extensions.ok(
  not prosecdef
  from pg_proc
  where pronamespace = 'public'::regnamespace
    and proname = 'record_educational_objective_attempt'
    and pronargs = 2,
  'public objective RPC is SECURITY INVOKER'
);

select extensions.ok(
  prosecdef
  from pg_proc
  where pronamespace = 'private'::regnamespace
    and proname = 'record_educational_objective_attempt'
    and pronargs = 2,
  'private objective implementation is SECURITY DEFINER'
);

select extensions.ok(
  to_regclass('public.idx_educational_objective_assessments_owner_page') is not null,
  'objective assessment owner/page index exists'
);

select extensions.ok(
  to_regclass('public.idx_educational_objective_attempts_owner_assessment_created') is not null,
  'objective attempt owner/assessment index exists'
);

select extensions.finish();

rollback;
