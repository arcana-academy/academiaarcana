begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(7);

insert into auth.users (id, email)
values
  ('97000000-0000-4000-8000-000000000001', 'objective-owner-1@example.test'),
  ('97000000-0000-4000-8000-000000000002', 'objective-owner-2@example.test');

insert into public.grimoires (id, owner_id, title)
values (
  '98000000-0000-4000-8000-000000000001',
  '97000000-0000-4000-8000-000000000001',
  'Objective Grimoire'
);

insert into public.notebooks (id, grimoire_id, title, position)
values (
  '99000000-0000-4000-8000-000000000001',
  '98000000-0000-4000-8000-000000000001',
  'Objective Notebook',
  0
);

insert into public.chapters (id, notebook_id, title, position)
values (
  '9a000000-0000-4000-8000-000000000001',
  '99000000-0000-4000-8000-000000000001',
  'Objective Chapter',
  0
);

insert into public.pages (id, chapter_id, title, position)
values (
  '9b000000-0000-4000-8000-000000000001',
  '9a000000-0000-4000-8000-000000000001',
  'Objective Page',
  0
);

insert into public.educational_objective_assessments (
  id,
  owner_id,
  page_id,
  prompt,
  reference_answer,
  criterion,
  minimum_evidence
)
values (
  '9c000000-0000-4000-8000-000000000001',
  '97000000-0000-4000-8000-000000000001',
  '9b000000-0000-4000-8000-000000000001',
  'Qual é a resposta objetiva?',
  'Resposta correta',
  'A resposta deve corresponder à referência após normalização de caixa e espaços.',
  2
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
  (select count(*)::integer from public.educational_objective_assessments),
  1,
  'owner enxerga sua avaliação objetiva'
);

select extensions.is(
  (select (public.record_educational_objective_attempt(
    '9c000000-0000-4000-8000-000000000001',
    '  RESPOSTA   CORRETA '
  )).outcome),
  'pass',
  'RPC calcula aprovação por correspondência normalizada'
);

select extensions.is(
  (select (public.record_educational_objective_attempt(
    '9c000000-0000-4000-8000-000000000001',
    'Resposta diferente'
  )).evidence_score),
  0,
  'RPC calcula score objetivo no servidor'
);

select extensions.is(
  (select count(*)::integer from public.educational_objective_attempts),
  2,
  'RPC cria apenas tentativas do owner'
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

select extensions.is(
  (select count(*)::integer from public.educational_objective_assessments),
  0,
  'outro owner não enxerga avaliação objetiva alheia'
);

select extensions.throws_ok(
  $$select public.record_educational_objective_attempt(
    '9c000000-0000-4000-8000-000000000001',
    'Tentativa indevida'
  )$$,
  'P0002',
  'Avaliação objetiva não encontrada.',
  'outro owner não pode registrar evidência objetiva alheia'
);

select extensions.is(
  (select count(*)::integer from public.educational_objective_attempts),
  0,
  'evidência não autorizada não fica visível ao outro owner'
);

reset role;

select extensions.finish();

rollback;
