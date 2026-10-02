-- Keep the public RPC surface invoker-only while retaining the atomic write in a private SECURITY DEFINER routine.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from service_role;
grant usage on schema private to authenticated;

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
begin
  if v_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'Não autenticado.';
  end if;

  select page_id
    into v_page_id
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
) from public;
revoke all on function private.record_educational_practice_attempt(
  uuid, text, text, numeric, text, text
) from anon;
revoke all on function private.record_educational_practice_attempt(
  uuid, text, text, numeric, text, text
) from service_role;
grant execute on function private.record_educational_practice_attempt(
  uuid, text, text, numeric, text, text
) to authenticated;

create or replace function public.record_educational_practice_attempt(
  p_practice_item_id uuid,
  p_answer text,
  p_outcome text,
  p_evidence_score numeric,
  p_confidence text,
  p_feedback text
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
    from private.record_educational_practice_attempt(
      p_practice_item_id,
      p_answer,
      p_outcome,
      p_evidence_score,
      p_confidence,
      p_feedback
    );

  return v_attempt;
end;
$function$;

revoke execute on function public.record_educational_practice_attempt(
  uuid, text, text, numeric, text, text
) from public;
revoke execute on function public.record_educational_practice_attempt(
  uuid, text, text, numeric, text, text
) from anon;
revoke execute on function public.record_educational_practice_attempt(
  uuid, text, text, numeric, text, text
) from service_role;
grant execute on function public.record_educational_practice_attempt(
  uuid, text, text, numeric, text, text
) to authenticated;
