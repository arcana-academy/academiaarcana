begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(14);

insert into auth.users (id, email)
values
  ('97000000-0000-4000-8000-000000000001', 'objective-owner-1@example.test'),
  ('97000000-0000-4000-8000-000000000002', 'objective-owner-2@example.test');

insert into public.grimoires (id, owner_id, title)
values (
  '97100000-0000-4000-8000-000000000001',
  '97000000-0000-4000-8000-000000000001',
  'Objective Grimoire'
);

insert into public.notebooks (id, grimoire_id, title, position)
values (
  '97200000-0000-4000-8000-000000000001',
  '97100000-0000-4000-8000-000000000001',
  'Objective Notebook',
  0
);

insert into public.chapters (id, notebook_id, title, position)
values (
  '97300000-0000-4000-8000-000000000001',
  '97200000-0000-4000-8000-000000000001',
  'Objective Chapter',
  0
);

insert into public.pages (id, chapter_id, title, position)
values (
  '97400000-0000-4000-8000-000000000001',
  '97300000-0000-4000-8000-000000000001',
  'Objective Page',
  0
);

insert into public.educational_practice_items (
  id,
  owner_id,
  page_id,
  prompt,
  reference_answer,
  difficulty,
  assessment_mode,
  criterion_phrases,
  criterion_version,
  minimum_objective_attempts
)
values (
  '97500000-0000-4000-8000-000000000001',
  '97000000-0000-4000-8000-000000000001',
  '97400000-0000-4000-8000-000000000001',
  'Explique os requisitos essenciais.',
  'ATP e contração muscular são termos essenciais.',
  3,
  'criterion-referenced',
  array['ATP', 'contração muscular'],
  1,
  2
);

select extensions.ok(
  relrowsecurity,
  'objective evidence has row level security enabled'
)
from pg_class
where oid = 'public.educational_objective_evidence'::regclass;

select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_objective_evidence', 'SELECT'),
  'authenticated can read own objective evidence through RLS'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_objective_evidence', 'INSERT'),
  'authenticated cannot forge objective evidence rows'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_objective_evidence', 'UPDATE'),
  'authenticated cannot rewrite objective evidence'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_objective_evidence', 'DELETE'),
  'authenticated cannot delete objective evidence'
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
    select (public.record_educational_practice_attempt(
      '97500000-0000-4000-8000-000000000001',
      'A CONTRAÇÃO MUSCULAR depende de ATP.',
      'insufficient',
      0.2,
      'insufficient',
      'A autoavaliação é separada da avaliação objetiva.'
    )).id
  )::text,
  '97500000-0000-4000-8000-000000000001',
  'recording a retrieval attempt still returns the attempt'
);

select extensions.is(
  (
    select state
    from public.educational_objective_evidence
  ),
  'developing',
  'first objective pass stays developing when two attempts are required'
);

select extensions.is(
  (
    select score
    from public.educational_objective_evidence
  ),
  1.000,
  'objective score reflects all required phrases'
);

select extensions.is(
  (
    select count(*)::integer
    from public.educational_objective_evidence
  ),
  1,
  'first attempt creates one objective evidence row'
);

select extensions.is(
  (
    select (public.record_educational_practice_attempt(
      '97500000-0000-4000-8000-000000000001',
      'ATP e contração muscular aparecem na resposta.',
      'partial',
      0.6,
      'partial',
      'Verifique também sua autoavaliação.'
    )).outcome
  ),
  'partial',
  'second retrieval attempt remains a normal educational attempt'
);

select extensions.is(
  (
    select state
    from public.educational_objective_evidence
    order by created_at desc
    limit 1
  ),
  'criteria-satisfied',
  'second objective pass satisfies explicit criteria without confirming mastery'
);

select extensions.is(
  (
    select confidence
    from public.educational_objective_evidence
    order by created_at desc
    limit 1
  ),
  'strong',
  'criteria-satisfied evidence receives strong evidence quality'
);

select extensions.throws_ok(
  $$insert into public.educational_objective_evidence (
    owner_id,
    practice_attempt_id,
    practice_item_id,
    evidence_type,
    state,
    score,
    matched_criteria,
    total_criteria,
    confidence,
    criterion_version
  ) values (
    '97000000-0000-4000-8000-000000000001',
    '97500000-0000-4000-8000-000000000001',
    '97500000-0000-4000-8000-000000000001',
    'criterion-referenced',
    'confirmed',
    1,
    2,
    2,
    'strong',
    1
  )$$,
  '42501',
  null,
  'direct objective evidence writes are denied'
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
  (
    select count(*)::integer
    from public.educational_objective_evidence
  ),
  0,
  'another owner cannot read objective evidence'
);

reset role;

select extensions.finish();

rollback;
