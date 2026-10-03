-- P1.5 objective evidence V1.
-- Extends the existing educational practice model; it does not create a
-- parallel assessment/attempt source of truth.
--
-- Objective evaluation is deliberately bounded to normalized exact matching.
-- The database computes pass/fail and evidence score server-side.

alter table public.educational_practice_items
  add column if not exists evidence_mode text
    not null default 'self_assessment';

alter table public.educational_practice_items
  add column if not exists criterion text;

alter table public.educational_practice_items
  add column if not exists criterion_version text;

alter table public.educational_practice_items
  add column if not exists minimum_evidence smallint
    not null default 2;

alter table public.educational_practice_items
  drop constraint if exists educational_practice_items_evidence_mode_check;

alter table public.educational_practice_items
  add constraint educational_practice_items_evidence_mode_check
  check (
    evidence_mode = any (
      array[
        'self_assessment'::text,
        'criterion_exact_match'::text
      ]
    )
  );

alter table public.educational_practice_items
  drop constraint if exists educational_practice_items_minimum_evidence_check;

alter table public.educational_practice_items
  add constraint educational_practice_items_minimum_evidence_check
  check (minimum_evidence >= 1 and minimum_evidence <= 20);

alter table public.educational_practice_attempts
  add column if not exists evidence_type text
    not null default 'self-assessment';

alter table public.educational_practice_attempts
  add column if not exists criterion text;

alter table public.educational_practice_attempts
  add column if not exists criterion_version text;

alter table public.educational_practice_attempts
  add column if not exists criterion_result text;

alter table public.educational_practice_attempts
  add column if not exists criterion_scope text;

alter table public.educational_practice_attempts
  add column if not exists criterion_reference text;

alter table public.educational_practice_attempts
  drop constraint if exists educational_practice_attempts_evidence_type_check;

alter table public.educational_practice_attempts
  add constraint educational_practice_attempts_evidence_type_check
  check (
    evidence_type = any (
      array[
        'self-assessment'::text,
        'criterion-referenced'::text
      ]
    )
  );

alter table public.educational_practice_attempts
  drop constraint if exists educational_practice_attempts_criterion_result_check;

alter table public.educational_practice_attempts
  add constraint educational_practice_attempts_criterion_result_check
  check (
    criterion_result is null
    or criterion_result = any (array['pass'::text, 'fail'::text])
  );

create index if not exists idx_educational_practice_attempts_owner_item_type_created
  on public.educational_practice_attempts
  using btree (owner_id, practice_item_id, evidence_type, created_at desc);

create or replace function private.prevent_criterion_item_mutation_after_evidence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if (
    new.evidence_mode is distinct from old.evidence_mode
    or new.criterion is distinct from old.criterion
    or new.criterion_version is distinct from old.criterion_version
    or new.minimum_evidence is distinct from old.minimum_evidence
    or new.reference_answer is distinct from old.reference_answer
  )
  and exists (
    select 1
      from public.educational_practice_attempts
     where practice_item_id = old.id
       and evidence_type = 'criterion-referenced'
  ) then
    raise exception using
      errcode = '55000',
      message = 'O critério objetivo não pode ser alterado depois que já houver evidência objetiva registrada.';
  end if;

  return new;
end;
$function$;

drop trigger if exists educational_practice_items_protect_criterion
  on public.educational_practice_items;

create trigger educational_practice_items_protect_criterion
before update on public.educational_practice_items
for each row
execute function private.prevent_criterion_item_mutation_after_evidence();

create or replace function private.record_criterion_referenced_practice_attempt(
  p_practice_item_id uuid,
  p_answer text
)
returns public.educational_practice_attempts
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_owner_id uuid := (select auth.uid());
  v_page_id uuid;
  v_reference_answer text;
  v_criterion text;
  v_criterion_version text;
  v_evidence_mode text;
  v_normalized_answer text;
  v_normalized_reference text;
  v_pass boolean;
  v_attempt public.educational_practice_attempts;
begin
  if v_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'Não autenticado.';
  end if;

  if p_answer is null
    or pg_catalog.char_length(pg_catalog.btrim(p_answer)) = 0 then
    raise exception using
      errcode = '22023',
      message = 'A resposta é obrigatória.';
  end if;

  select page_id, evidence_mode, criterion, criterion_version, reference_answer
    into v_page_id, v_evidence_mode, v_criterion, v_criterion_version, v_reference_answer
    from public.educational_practice_items
   where id = p_practice_item_id
     and owner_id = v_owner_id
     and active = true;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Atividade de prática não encontrada.';
  end if;

  if v_evidence_mode <> 'criterion_exact_match' then
    raise exception using
      errcode = '22023',
      message = 'Esta atividade usa autoavaliação, não avaliação objetiva.';
  end if;

  v_normalized_answer := pg_catalog.lower(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(p_answer),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );

  v_normalized_reference := pg_catalog.lower(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(v_reference_answer),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );

  v_pass := v_normalized_answer = v_normalized_reference;

  insert into public.educational_practice_attempts (
    owner_id,
    practice_item_id,
    answer,
    outcome,
    evidence_score,
    confidence,
    feedback,
    evidence_type,
    criterion,
    criterion_version,
    criterion_result,
    criterion_scope,
    criterion_reference
  )
  values (
    v_owner_id,
    p_practice_item_id,
    pg_catalog.btrim(p_answer),
    case when v_pass then 'strong' else 'insufficient' end,
    case when v_pass then 1.0 else 0.0 end,
    'strong',
    case
      when v_pass
        then 'A resposta atendeu ao critério objetivo desta atividade por correspondência exata normalizada.'
      else
        'A resposta não atendeu ao critério objetivo desta atividade. Consulte a referência e tente novamente.'
    end,
    'criterion-referenced',
    v_criterion,
    v_criterion_version,
    case when v_pass then 'pass' else 'fail' end,
    'practice-item',
    pg_catalog.btrim(v_reference_answer)
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

revoke all
  on function private.record_criterion_referenced_practice_attempt(uuid, text)
  from public, anon, service_role;

grant execute
  on function private.record_criterion_referenced_practice_attempt(uuid, text)
  to authenticated;

create or replace function public.record_criterion_referenced_practice_attempt(
  p_practice_item_id uuid,
  p_answer text
)
returns public.educational_practice_attempts
language plpgsql
security invoker
set search_path = public, pg_catalog
as $function$
declare
  v_attempt public.educational_practice_attempts;
begin
  select *
    into v_attempt
    from private.record_criterion_referenced_practice_attempt(
      p_practice_item_id,
      p_answer
    );

  return v_attempt;
end;
$function$;

revoke all
  on function public.record_criterion_referenced_practice_attempt(uuid, text)
  from public, anon, service_role;

grant execute
  on function public.record_criterion_referenced_practice_attempt(uuid, text)
  to authenticated;
