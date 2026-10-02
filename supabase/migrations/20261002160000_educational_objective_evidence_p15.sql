-- P1.5 objective evidence: deterministic criterion-referenced exact-match assessment.
--
-- This is intentionally narrower than semantic evaluation. The server computes
-- pass/fail and score; clients cannot submit objective outcomes or scores.

create table public.educational_objective_assessments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  page_id uuid not null references public.pages(id) on delete cascade,
  prompt text not null check (char_length(trim(prompt)) between 1 and 1000),
  reference_answer text not null check (char_length(trim(reference_answer)) between 1 and 5000),
  criterion text not null check (char_length(trim(criterion)) between 1 and 2000),
  scoring_policy text not null default 'normalized-exact-match'
    check (scoring_policy = 'normalized-exact-match'),
  minimum_evidence smallint not null default 2
    check (minimum_evidence between 1 and 5),
  validity_scope text not null default 'page'
    check (validity_scope = 'page'),
  criterion_version integer not null default 1
    check (criterion_version >= 1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.educational_objective_attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.educational_objective_assessments(id) on delete cascade,
  answer text not null check (char_length(trim(answer)) between 1 and 5000),
  outcome text not null check (outcome in ('pass', 'fail')),
  evidence_score numeric(4,3) not null check (evidence_score in (0, 1)),
  confidence text not null check (confidence = 'strong'),
  feedback text not null check (char_length(trim(feedback)) between 1 and 2000),
  criterion_version integer not null check (criterion_version >= 1),
  created_at timestamptz not null default now()
);

create index idx_educational_objective_assessments_owner_page
  on public.educational_objective_assessments(owner_id, page_id);

create index idx_educational_objective_attempts_owner_assessment_created
  on public.educational_objective_attempts(owner_id, assessment_id, created_at desc);

alter table public.educational_objective_assessments enable row level security;
alter table public.educational_objective_attempts enable row level security;

create policy "educational_objective_assessments_select_own"
  on public.educational_objective_assessments for select to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = educational_objective_assessments.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "educational_objective_assessments_insert_own"
  on public.educational_objective_assessments for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = educational_objective_assessments.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "educational_objective_assessments_update_own"
  on public.educational_objective_assessments for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = educational_objective_assessments.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "educational_objective_assessments_delete_own"
  on public.educational_objective_assessments for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "educational_objective_attempts_select_own"
  on public.educational_objective_attempts for select to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.educational_objective_assessments assessment
      where assessment.id = educational_objective_attempts.assessment_id
        and assessment.owner_id = (select auth.uid())
    )
  );

revoke all
  on public.educational_objective_assessments,
     public.educational_objective_attempts
  from anon, authenticated;

grant select, insert, update, delete
  on public.educational_objective_assessments
  to authenticated;

grant select
  on public.educational_objective_attempts
  to authenticated;

create or replace function private.record_educational_objective_attempt(
  p_assessment_id uuid,
  p_answer text
)
returns public.educational_objective_attempts
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_owner_id uuid := (select auth.uid());
  v_reference_answer text;
  v_page_id uuid;
  v_criterion_version integer;
  v_outcome text;
  v_score numeric := 0;
  v_feedback text;
  v_attempt public.educational_objective_attempts;
begin
  if v_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'Não autenticado.';
  end if;

  select reference_answer, page_id, criterion_version
    into v_reference_answer, v_page_id, v_criterion_version
    from public.educational_objective_assessments
   where id = p_assessment_id
     and owner_id = v_owner_id
     and active = true;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Avaliação objetiva não encontrada.';
  end if;

  if pg_catalog.regexp_replace(pg_catalog.lower(pg_catalog.btrim(p_answer)), '\\s+', ' ', 'g')
     = pg_catalog.regexp_replace(pg_catalog.lower(pg_catalog.btrim(v_reference_answer)), '\\s+', ' ', 'g')
  then
    v_outcome := 'pass';
    v_score := 1;
    v_feedback := 'A resposta satisfez o critério de correspondência exata normalizada.';
  else
    v_outcome := 'fail';
    v_feedback :=
      'A resposta não satisfez o critério de correspondência exata normalizada. Isso é evidência sobre esta tarefa, não uma conclusão global sobre sua aprendizagem.';
  end if;

  insert into public.educational_objective_attempts (
    owner_id,
    assessment_id,
    answer,
    outcome,
    evidence_score,
    confidence,
    feedback,
    criterion_version
  )
  values (
    v_owner_id,
    p_assessment_id,
    pg_catalog.btrim(p_answer),
    v_outcome,
    v_score,
    'strong',
    v_feedback,
    v_criterion_version
  )
  returning * into v_attempt;

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

revoke all on function private.record_educational_objective_attempt(uuid, text)
  from public, anon, service_role;

grant execute on function private.record_educational_objective_attempt(uuid, text)
  to authenticated;

create or replace function public.record_educational_objective_attempt(
  p_assessment_id uuid,
  p_answer text
)
returns public.educational_objective_attempts
language plpgsql
security invoker
set search_path = public, pg_catalog
as $function$
declare
  v_attempt public.educational_objective_attempts;
begin
  select *
    into v_attempt
    from private.record_educational_objective_attempt(
      p_assessment_id,
      p_answer
    );

  return v_attempt;
end;
$function$;

revoke all on function public.record_educational_objective_attempt(uuid, text)
  from public, anon, service_role;

grant execute on function public.record_educational_objective_attempt(uuid, text)
  to authenticated;
