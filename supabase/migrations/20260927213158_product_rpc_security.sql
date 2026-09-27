-- Security hardening for the product reward RPC.
-- Keep the REST-visible public RPC as SECURITY INVOKER while moving the
-- privileged implementation to a non-exposed private schema.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

create or replace function private.complete_study_task_with_reward(
  p_task_id uuid
)
returns table (
  task_id uuid,
  task_owner_id uuid,
  task_title text,
  task_due_at timestamptz,
  task_status text,
  task_completed_at timestamptz,
  task_created_at timestamptz,
  task_updated_at timestamptz,
  xp bigint,
  streak_days integer,
  last_active_on date,
  gamification_updated_at timestamptz,
  mission_completed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := (select auth.uid());
  v_now timestamptz := now();
  v_active_on date := (v_now at time zone 'UTC')::date;
  v_task public.study_tasks%rowtype;
  v_profile public.gamification_profiles%rowtype;
  v_mission public.missions%rowtype;
  v_task_completed_now boolean := false;
  v_mission_completed boolean := false;
begin
  if v_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'Não autenticado.';
  end if;

  update public.study_tasks
     set status = 'completed',
         completed_at = v_now,
         updated_at = v_now
   where id = p_task_id
     and owner_id = v_owner_id
     and status = 'pending'
   returning * into v_task;

  if found then
    v_task_completed_now := true;
  else
    select *
      into v_task
      from public.study_tasks
     where id = p_task_id
       and owner_id = v_owner_id;

    if not found then
      raise exception using
        errcode = 'P0002',
        message = 'Tarefa não encontrada.';
    end if;
  end if;

  insert into public.gamification_profiles (owner_id)
  values (v_owner_id)
  on conflict (owner_id) do nothing;

  select *
    into v_profile
    from public.gamification_profiles
   where owner_id = v_owner_id
   for update;

  if v_task_completed_now then
    insert into public.missions (
      owner_id,
      code,
      title,
      reward_xp,
      target_date
    )
    values (
      v_owner_id,
      'complete-study-task',
      'Concluir uma tarefa de estudo',
      10,
      v_active_on
    )
    on conflict (owner_id, code, target_date) do nothing;

    update public.missions
       set completed_at = v_now
     where owner_id = v_owner_id
       and code = 'complete-study-task'
       and target_date = v_active_on
       and completed_at is null
     returning * into v_mission;

    if found then
      v_mission_completed := true;

      update public.gamification_profiles as gp
         set xp = gp.xp + v_mission.reward_xp,
             streak_days = case
               when gp.last_active_on = v_active_on then gp.streak_days
               when gp.last_active_on = v_active_on - 1 then gp.streak_days + 1
               else 1
             end,
             last_active_on = v_active_on,
             updated_at = v_now
       where gp.owner_id = v_owner_id
       returning gp.* into v_profile;
    end if;
  end if;

  return query
  select
    v_task.id,
    v_task.owner_id,
    v_task.title,
    v_task.due_at,
    v_task.status,
    v_task.completed_at,
    v_task.created_at,
    v_task.updated_at,
    v_profile.xp,
    v_profile.streak_days,
    v_profile.last_active_on,
    v_profile.updated_at,
    v_mission_completed;
end;
$$;

revoke all on function private.complete_study_task_with_reward(uuid) from public;
revoke all on function private.complete_study_task_with_reward(uuid) from anon;
grant execute on function private.complete_study_task_with_reward(uuid) to authenticated;

create or replace function public.complete_study_task_with_reward(
  p_task_id uuid
)
returns table (
  task_id uuid,
  task_owner_id uuid,
  task_title text,
  task_due_at timestamptz,
  task_status text,
  task_completed_at timestamptz,
  task_created_at timestamptz,
  task_updated_at timestamptz,
  xp bigint,
  streak_days integer,
  last_active_on date,
  gamification_updated_at timestamptz,
  mission_completed boolean
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.complete_study_task_with_reward(p_task_id);
$$;

revoke all on function public.complete_study_task_with_reward(uuid) from public;
revoke all on function public.complete_study_task_with_reward(uuid) from anon;
grant execute on function public.complete_study_task_with_reward(uuid) to authenticated;
