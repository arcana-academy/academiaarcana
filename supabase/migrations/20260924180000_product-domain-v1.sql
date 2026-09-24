-- Product domain v1: learning progress, study planning and gamification.
--
-- User-owned records are protected by RLS. Study-task completion and
-- gamification rewards use one atomic database operation so a reward cannot
-- be separated from the task transition.

create table public.page_progress (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  page_id uuid not null references public.pages(id) on delete cascade,
  status text not null check (status in ('not-started', 'in-progress', 'completed')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(owner_id, page_id)
);

create table public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  due_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gamification_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  last_active_on date,
  updated_at timestamptz not null default now()
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  title text not null,
  reward_xp integer not null check (reward_xp >= 0),
  target_date date not null,
  completed_at timestamptz,
  unique(owner_id, code, target_date)
);

create index idx_page_progress_owner on public.page_progress(owner_id);
create index idx_page_progress_page on public.page_progress(page_id);
create index idx_study_tasks_owner_status_due
  on public.study_tasks(owner_id, status, due_at);
create index idx_missions_owner_date
  on public.missions(owner_id, target_date);

alter table public.page_progress enable row level security;
alter table public.study_tasks enable row level security;
alter table public.gamification_profiles enable row level security;
alter table public.missions enable row level security;

create policy "page_progress_select_own"
  on public.page_progress for select to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "page_progress_insert_own"
  on public.page_progress for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "page_progress_update_own"
  on public.page_progress for update to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "page_progress_delete_own"
  on public.page_progress for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "page_progress_update_own"
  on public.page_progress for update to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "study_tasks_select_own"
  on public.study_tasks for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "study_tasks_insert_own"
  on public.study_tasks for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "study_tasks_delete_own"
  on public.study_tasks for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "gamification_profiles_select_own"
  on public.gamification_profiles for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "missions_select_own"
  on public.missions for select to authenticated
  using (owner_id = (select auth.uid()));

grant select, insert, update, delete
  on public.page_progress
  to authenticated;

grant select, insert, delete
  on public.study_tasks
  to authenticated;

grant select
  on public.gamification_profiles, public.missions
  to authenticated;

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
  xp integer,
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

      update public.gamification_profiles
         set xp = xp + v_mission.reward_xp,
             streak_days = case
               when last_active_on = v_active_on then streak_days
               when last_active_on = v_active_on - 1 then streak_days + 1
               else 1
             end,
             last_active_on = v_active_on,
             updated_at = v_now
       where owner_id = v_owner_id
       returning * into v_profile;
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

revoke all on function public.complete_study_task_with_reward(uuid) from public;
revoke all on function public.complete_study_task_with_reward(uuid) from anon;
grant execute on function public.complete_study_task_with_reward(uuid) to authenticated;
