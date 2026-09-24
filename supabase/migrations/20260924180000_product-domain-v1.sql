-- Product domain v1: learning progress, study planning and gamification.
--
-- All records are user-owned and exposed only to authenticated users through
-- explicit CRUD grants plus ownership RLS.

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
    owner_id = auth.uid()
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = auth.uid()
    )
  );

create policy "page_progress_insert_own"
  on public.page_progress for insert to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = auth.uid()
    )
  );

create policy "page_progress_update_own"
  on public.page_progress for update to authenticated
  using (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = auth.uid()
    )
  )
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = page_progress.page_id
        and g.owner_id = auth.uid()
    )
  );

create policy "page_progress_delete_own"
  on public.page_progress for delete to authenticated
  using (owner_id = auth.uid());

create policy "study_tasks_select_own"
  on public.study_tasks for select to authenticated
  using (owner_id = auth.uid());

create policy "study_tasks_insert_own"
  on public.study_tasks for insert to authenticated
  with check (owner_id = auth.uid());

create policy "study_tasks_update_own"
  on public.study_tasks for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "study_tasks_delete_own"
  on public.study_tasks for delete to authenticated
  using (owner_id = auth.uid());

create policy "gamification_profiles_select_own"
  on public.gamification_profiles for select to authenticated
  using (owner_id = auth.uid());

create policy "gamification_profiles_insert_own"
  on public.gamification_profiles for insert to authenticated
  with check (owner_id = auth.uid());

create policy "gamification_profiles_update_own"
  on public.gamification_profiles for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "gamification_profiles_delete_own"
  on public.gamification_profiles for delete to authenticated
  using (owner_id = auth.uid());

create policy "missions_select_own"
  on public.missions for select to authenticated
  using (owner_id = auth.uid());

create policy "missions_insert_own"
  on public.missions for insert to authenticated
  with check (owner_id = auth.uid());

create policy "missions_update_own"
  on public.missions for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "missions_delete_own"
  on public.missions for delete to authenticated
  using (owner_id = auth.uid());

grant select, insert, update, delete
  on public.page_progress, public.study_tasks,
     public.gamification_profiles, public.missions
  to authenticated;
