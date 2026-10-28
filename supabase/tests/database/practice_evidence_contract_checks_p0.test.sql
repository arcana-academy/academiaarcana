-- P0 educational evidence contracts: disposable LOCAL Supabase only.
-- Do not execute this file on hosted projects.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(6);

select extensions.is(
  (select pg_catalog.pg_get_constraintdef(c.oid, true)
     from pg_catalog.pg_constraint c
    where c.conrelid = 'public.educational_practice_items'::regclass
      and c.conname = 'educational_practice_items_criterion_contract_check'),
  $expected$CHECK (evidence_mode = 'self_assessment'::text AND criterion IS NULL AND criterion_version IS NULL OR evidence_mode = 'criterion_exact_match'::text AND char_length(TRIM(BOTH FROM criterion)) >= 1 AND char_length(TRIM(BOTH FROM criterion)) <= 1000 AND criterion_version = 'criterion_exact_match_v1'::text)$expected$,
  'Practice item criterion check matches the hosted contract'
);

select extensions.is(
  (select pg_catalog.pg_get_constraintdef(c.oid, true)
     from pg_catalog.pg_constraint c
    where c.conrelid = 'public.educational_practice_attempts'::regclass
      and c.conname = 'educational_practice_attempts_evidence_contract_check'),
  $expected$CHECK (evidence_type = 'self-assessment'::text AND criterion IS NULL AND criterion_version IS NULL AND criterion_result IS NULL AND criterion_scope IS NULL AND criterion_reference IS NULL OR evidence_type = 'criterion-referenced'::text AND char_length(TRIM(BOTH FROM criterion)) >= 1 AND char_length(TRIM(BOTH FROM criterion)) <= 1000 AND criterion_version IS NOT NULL AND criterion_result IS NOT NULL AND criterion_scope = 'practice-item'::text AND char_length(TRIM(BOTH FROM criterion_reference)) >= 1 AND char_length(TRIM(BOTH FROM criterion_reference)) <= 5000)$expected$,
  'Practice attempt evidence check matches the hosted contract'
);

select extensions.is(
  (select count(*)::integer from pg_catalog.pg_constraint
    where convalidated and (
      (conrelid = 'public.educational_practice_items'::regclass
           and conname = 'educational_practice_items_criterion_contract_check')
       or (conrelid = 'public.educational_practice_attempts'::regclass
           and conname = 'educational_practice_attempts_evidence_contract_check')
    )),
  2,
  'Both objective evidence constraints are present and validated'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.educational_practice_items', 'INSERT'),
  'Students can create their own practice items under RLS'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.educational_practice_attempts', 'INSERT'),
  'Direct evidence inserts remain denied'
);
select extensions.ok(
  exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.educational_practice_items'::regclass
      and tgname = 'educational_practice_items_protect_criterion'
      and not tgisinternal and tgenabled <> 'D'),
  'Criterion integrity trigger remains enabled'
);

select * from extensions.finish();
rollback;
