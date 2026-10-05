begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(16);

select extensions.is(
  (select evidence_mode from public.educational_practice_items
   where id = 'b6000000-0000-4000-8000-000000000001'),
  'self_assessment',
  'existing practice item receives self_assessment default'
);

select extensions.is(
  (select minimum_evidence from public.educational_practice_items
   where id = 'b6000000-0000-4000-8000-000000000001'),
  2::smallint,
  'existing practice item receives minimum_evidence default'
);

select extensions.is(
  (select criterion from public.educational_practice_items
   where id = 'b6000000-0000-4000-8000-000000000001'),
  null::text,
  'existing practice item keeps criterion null'
);

select extensions.is(
  (select evidence_type from public.educational_practice_attempts
   where id = 'b7000000-0000-4000-8000-000000000001'),
  'self-assessment',
  'existing attempt receives self-assessment evidence type'
);

select extensions.is(
  (select criterion_result from public.educational_practice_attempts
   where id = 'b7000000-0000-4000-8000-000000000001'),
  null::text,
  'existing attempt keeps criterion result null'
);

select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.educational_practice_items'::regclass
      and conname = 'educational_practice_items_evidence_mode_check'
  ),
  'evidence mode constraint exists after upgrade'
);

select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.educational_practice_items'::regclass
      and conname = 'educational_practice_items_minimum_evidence_check'
  ),
  'minimum evidence constraint exists after upgrade'
);

select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.educational_practice_attempts'::regclass
      and conname = 'educational_practice_attempts_evidence_type_check'
  ),
  'attempt evidence type constraint exists after upgrade'
);

select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.educational_practice_attempts'::regclass
      and conname = 'educational_practice_attempts_criterion_result_check'
  ),
  'criterion result constraint exists after upgrade'
);

select extensions.ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'idx_educational_practice_attempts_owner_item_type_created'
  ),
  'objective evidence index exists after upgrade'
);

select extensions.ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.educational_practice_items'::regclass
      and tgname = 'educational_practice_items_protect_criterion'
      and not tgisinternal
  ),
  'criterion protection trigger exists after upgrade'
);

select extensions.ok(
  to_regprocedure('public.record_criterion_referenced_practice_attempt(uuid,text)') is not null,
  'public objective evidence RPC exists after upgrade'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.record_criterion_referenced_practice_attempt(uuid,text)',
    'EXECUTE'
  ),
  'authenticated can execute objective evidence RPC'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.record_criterion_referenced_practice_attempt(uuid,text)',
    'EXECUTE'
  ),
  'anon cannot execute objective evidence RPC'
);

select extensions.ok(
  not has_function_privilege(
    'service_role',
    'public.record_criterion_referenced_practice_attempt(uuid,text)',
    'EXECUTE'
  ),
  'service_role cannot execute objective evidence RPC'
);

select extensions.ok(
  (select relrowsecurity
   from pg_class
   where oid = 'public.educational_practice_attempts'::regclass),
  'RLS remains enabled after upgrade'
);

select * from extensions.finish();
rollback;
