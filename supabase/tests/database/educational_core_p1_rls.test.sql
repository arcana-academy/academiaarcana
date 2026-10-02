begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(11);

insert into auth.users (id, email)
values
  ('91000000-0000-4000-8000-000000000001', 'p1-owner-1@example.test'),
  ('91000000-0000-4000-8000-000000000002', 'p1-owner-2@example.test');

insert into public.grimoires (id, owner_id, title)
values (
  '92000000-0000-4000-8000-000000000001',
  '91000000-0000-4000-8000-000000000001',
  'P1 Grimoire'
);

insert into public.notebooks (id, grimoire_id, title, position)
values (
  '93000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  'P1 Notebook',
  0
);

insert into public.chapters (id, notebook_id, title, position)
values (
  '94000000-0000-4000-8000-000000000001',
  '93000000-0000-4000-8000-000000000001',
  'P1 Chapter',
  0
);

insert into public.pages (id, chapter_id, title, position)
values (
  '95000000-0000-4000-8000-000000000001',
  '94000000-0000-4000-8000-000000000001',
  'P1 Page',
  0
);

insert into public.educational_practice_items (
  id,
  owner_id,
  page_id,
  prompt,
  reference_answer,
  difficulty
)
values (
  '96000000-0000-4000-8000-000000000001',
  '91000000-0000-4000-8000-000000000001',
  '95000000-0000-4000-8000-000000000001',
  'Explique a ideia central.',
  'A resposta de referência permanece protegida até a tentativa.',
  3
);

insert into public.page_progress (
  owner_id,
  page_id,
  status,
  completed_at
)
values (
  '91000000-0000-4000-8000-000000000001',
  '95000000-0000-4000-8000-000000000001',
  'completed',
  '2026-09-30T00:00:00Z'
);

select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000001',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

set local role authenticated;

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_items
  ),
  1,
  'owner enxerga apenas sua atividade de prática'
);

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_attempts
  ),
  0,
  'owner começa sem tentativas registradas'
);

select extensions.is(
  (
    select (public.record_educational_practice_attempt(
      '96000000-0000-4000-8000-000000000001',
      'Minha resposta recuperada.',
      'strong',
      1.0,
      'strong',
      'Compare com a referência.'
    )).outcome
  ),
  'strong',
  'owner pode registrar a recuperação pela RPC'
);

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_attempts
  ),
  1,
  'RPC cria exatamente uma tentativa'
);

select extensions.is(
  (
    select answer
    from public.educational_practice_attempts
  ),
  'Minha resposta recuperada.',
  'RPC persiste a resposta da tentativa'
);

select extensions.is(
  (
    select status
    from public.page_progress
    where page_id = '95000000-0000-4000-8000-000000000001'
  ),
  'completed',
  'RPC preserva progresso já concluído'
);

reset role;

select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000002',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

set local role authenticated;

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_items
  ),
  0,
  'outro owner não enxerga atividades alheias'
);

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_attempts
  ),
  0,
  'outro owner não enxerga tentativas alheias'
);

select extensions.throws_ok(
  $$select public.record_educational_practice_attempt(
    '96000000-0000-4000-8000-000000000001',
    'Tentativa indevida.',
    'strong',
    1.0,
    'strong',
    'Não deve ser persistida.'
  )$$,
  'P0002',
  'Atividade de prática não encontrada.',
  'outro owner não pode registrar tentativa em atividade alheia'
);

select extensions.is(
  (
    select count(*)::integer
    from public.educational_practice_attempts
  ),
  0,
  'tentativa não autorizada não produz evidência'
);

reset role;

select extensions.finish();

rollback;
