-- P1.5 objective evidence: deterministic, criterion-referenced evaluation.
--
-- The first supported criterion is required phrases. This intentionally avoids
-- opaque semantic grading and persists provenance for every objective result.

alter table public.educational_practice_items
  add column assessment_mode text not null default 'self-assessment',
  add column criterion_phrases text[] not null default '{}',
  add column criterion_version integer not null default 1,
  add column minimum_objective_attempts smallint not null default 1;

alter table public.educational_practice_items
  add constraint educational_practice_items_assessment_mode_check
    check (assessment_mode in ('self-assessment', 'criterion-referenced')),
  add constraint educational_practice_items_criterion_version_check
    check (criterion_version >= 1),
  add constraint educational_practice_items_minimum_objective_attempts_check
    check (minimum_objective_attempts between 1 and 10),
  add constraint educational_practice_items_criterion_config_check
    check (
      (assessment_mode = 'self-assessment' and cardinality(criterion_phrases) = 0)
      or
      (assessment_mode = 'criterion-referenced' and cardinality(criterion_phrases) >= 1)
    );

create table public.educational_objective_evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  practice_attempt_id uuid not null
    references public.educational_practice_attempts(id) on delete cascade,
  practice_item_id uuid not null
    references public.educational_practice_items(id) on delete cascade,
  evidence_type text not null default 'criterion-referenced'
    check (evidence_type = 'criterion-referenced'),
  state text not null
    check (state in ('insufficient', 'developing', 'criteria-satisfied', 'confirmed', 'conflicting')),
  score numeric(4,3) not null check (score >= 0 and score <= 1),
  matched_criteria integer not null check (matched_criteria >= 0),
  total_criteria integer not null check (total_criteria >= 1),
  confidence text not null
    check (confidence in ('strong', 'partial', 'insufficient')),
  criterion_version integer not null check (criterion_version >= 1),
  created_at timestamptz not null default now(),
  constraint educational_objective_evidence_attempt_unique
    unique (practice_attempt_id),
  constraint educational_objective_evidence_counts_check
    check (matched_criteria <= total_criteria)
);

create index idx_educational_objective_evidence_owner_item_created
  on public.educational_objective_evidence(owner_id, practice_item_id, created_at desc);

create index idx_educational_objective_evidence_item_version
  on public.educational_objective_evidence(practice_item_id, criterion_version, created_at desc);

alter table public.educational_objective_evidence enable row level security;

create policy "educational_objective_evidence_select_own"
  on public.educational_objective_evidence
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all
  on public.educational_objective_evidence
  from anon, authenticated;

grant select
  on public.educational_objective_evidence
  to authenticated;

create or replace function private.record_educational_practice_attempt(
  p_practice_item_id uuid,
  p_answer text,
  p_outcome text,
  p_evidence_score numeric,
  p_confidence text,
  p_feedback text
)
returns public.educational_practice_attempts
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_owner_id uuid := (select auth.uid());
  v_page_id uuid;
  v_attempt public.educational_practice_attempts;
  v_assessment_mode text;
  v_criterion_phrases text[];
  v_criterion_version integer;
  v_minimum_objective_attempts integer;
  v_normalized_answer text;
  v_normalized_phrase text;
  v_phrase text;
  v_total_criteria integer;
  v_matched_criteria integer := 0;
  v_objective_attempt_count integer;
  v_objective_score numeric(4,3);
  v_objective_state text;
  v_objective_confidence text;
begin
  if v_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'Não autenticado.';
  end if;

  select
    page_id,
    assessment_mode,
    criterion_phrases,
    criterion_version,
    minimum_objective_attempts
    into
      v_page_id,
      v_assessment_mode,
      v_criterion_phrases,
      v_criterion_version,
      v_minimum_objective_attempts
    from public.educational_practice_items
   where id = p_practice_item_id
     and owner_id = v_owner_id
     and active = true;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Atividade de prática não encontrada.';
  end if;

  insert into public.educational_practice_attempts (
    owner_id,
    practice_item_id,
    answer,
    outcome,
    evidence_score,
    confidence,
    feedback
  )
  values (
    v_owner_id,
    p_practice_item_id,
    pg_catalog.btrim(p_answer),
    p_outcome,
    p_evidence_score,
    p_confidence,
    pg_catalog.btrim(p_feedback)
  )
  returning * into v_attempt;

  if v_assessment_mode = 'criterion-referenced' then
    v_normalized_answer := pg_catalog.lower(
      pg_catalog.btrim(
        pg_catalog.regexp_replace(p_answer, '[^[:alnum:]]+', ' ', 'g')
      )
    );
    v_normalized_answer := pg_catalog.regexp_replace(
      v_normalized_answer,
      '\s+',
      ' ',
      'g'
    );
    v_total_criteria := pg_catalog.cardinality(v_criterion_phrases);

    foreach v_phrase in array v_criterion_phrases loop
      v_normalized_phrase := pg_catalog.lower(
        pg_catalog.btrim(
          pg_catalog.regexp_replace(v_phrase, '[^[:alnum:]]+', ' ', 'g')
        )
      );
      v_normalized_phrase := pg_catalog.regexp_replace(
        v_normalized_phrase,
        '\s+',
        ' ',
        'g'
      );

      if v_normalized_phrase <> ''
        and pg_catalog.strpos(
          ' ' || v_normalized_answer || ' ',
          ' ' || v_normalized_phrase || ' '
        ) > 0 then
        v_matched_criteria := v_matched_criteria + 1;
      end if;
    end loop;

    v_objective_score :=
      round(v_matched_criteria::numeric / v_total_criteria::numeric, 3);

    select count(*)::integer + 1
      into v_objective_attempt_count
      from public.educational_objective_evidence
     where owner_id = v_owner_id
       and practice_item_id = p_practice_item_id
       and criterion_version = v_criterion_version;

    if v_matched_criteria = v_total_criteria
      and v_objective_attempt_count >= v_minimum_objective_attempts then
      v_objective_state := 'criteria-satisfied';
      v_objective_confidence := 'strong';
    elsif v_objective_score >= 0.5 then
      v_objective_state := 'developing';
      v_objective_confidence := 'partial';
    else
      v_objective_state := 'insufficient';
      v_objective_confidence := 'insufficient';
    end if;

    insert into public.educational_objective_evidence (
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
    )
    values (
      v_owner_id,
      v_attempt.id,
      p_practice_item_id,
      'criterion-referenced',
      v_objective_state,
      v_objective_score,
      v_matched_criteria,
      v_total_criteria,
      v_objective_confidence,
      v_criterion_version
    );
  end if;

  insert into public.page_progress (
    owner_id,
    page_id,
    status,
    completed_at,
    updated_at
  )
  values (
    v_owner_id,
    v_page_id,
    'in-progress',
    null,
    pg_catalog.now()
  )
  on conflict (owner_id, page_id)
  do update
     set status = case
       when public.page_progress.status = 'completed' then 'completed'
       else 'in-progress'
     end,
     completed_at = case
       when public.page_progress.status = 'completed'
         then public.page_progress.completed_at
       else null
     end,
     updated_at = pg_catalog.now();

  return v_attempt;
end;
$function$;

revoke all on function private.record_educational_practice_attempt(
  uuid, text, text, numeric, text, text
) from public, anon, service_role;

grant execute on function private.record_educational_practice_attempt(
  uuid, text, text, numeric, text, text
) to authenticated;
