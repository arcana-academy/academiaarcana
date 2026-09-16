create extension if not exists "pgcrypto";

create table public.grimoires (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  cover text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  grimoire_id uuid not null references public.grimoires(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.notebooks(id) on delete cascade,
  title text not null,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  content jsonb not null default '{"type":"document","blocks":[]}'::jsonb,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_grimoires_owner_id
  on public.grimoires(owner_id);

create index idx_notebooks_grimoires_id
  on public.notebooks(grimoire_id);

create index idx_notebooks_grimoire_position
  on public.notebooks(grimoire_id, position);

create index idx_chapters_notebook_id
  on public.chapters(notebook_id);

create index idx_chapters_notebook_position
  on public.chapters(notebook_id, position);

create index idx_pages_chapter_id
  on public.pages(chapter_id);

create index idx_pages_chapter_position
  on public.pages(chapter_id, position);

alter table public.grimoires enable row level security;
alter table public.notebooks enable row level security;
alter table public.chapters enable row level security;
alter table public.pages enable row level security;

create policy "grimoires_select_own"
  on public.grimoires for select
  to authenticated
  using (owner_id = auth.uid());

create policy "grimoires_insert_own"
  on public.grimoires for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "grimoires_update_own"
  on public.grimoires for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "grimoires_delete_own"
  on public.grimoires for delete
  to authenticated
  using (owner_id = auth.uid());

create policy "notebooks_select_owned_grimoire"
  on public.notebooks for select
  to authenticated
  using (
    exists (
      select 1
      from public.grimoires g
      where g.id = notebooks.grimoire_id
        and g.owner_id = auth.uid()
    )
  );

create policy "notebooks_insert_owned_grimoire"
  on public.notebooks for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.grimoires g
      where g.id = notebooks.grimoire_id
        and g.owner_id = auth.uid()
    )
  );

create policy "notebooks_update_owned_grimoire"
  on public.notebooks for update
  to authenticated
  using (
    exists (
      select 1
      from public.grimoires g
      where g.id = notebooks.grimoire_id
        and g.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.grimoires g
      where g.id = notebooks.grimoire_id
        and g.owner_id = auth.uid()
    )
  );

create policy "notebooks_delete_owned_grimoire"
  on public.notebooks for delete
  to authenticated
  using (
    exists (
      select 1
      from public.grimoires g
      where g.id = notebooks.grimoire_id
        and g.owner_id = auth.uid()
    )
  );

create policy "chapters_select_owned_grimoire"
  on public.chapters for select
  to authenticated
  using (
    exists (
      select 1
      from public.notebooks n
      join public.grimoires g on g.id = n.grimoire_id
      where n.id = chapters.notebook_id
        and g.owner_id = auth.uid()
    )
  );

create policy "chapters_insert_owned_grimoire"
  on public.chapters for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.notebooks n
      join public.grimoires g on g.id = n.grimoire_id
      where n.id = chapters.notebook_id
        and g.owner_id = auth.uid()
    )
  );

create policy "chapters_update_owned_grimoire"
  on public.chapters for update
  to authenticated
  using (
    exists (
      select 1
      from public.notebooks n
      join public.grimoires g on g.id = n.grimoire_id
      where n.id = chapters.notebook_id
        and g.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.notebooks n
      join public.grimoires g on g.id = n.grimoire_id
      where n.id = chapters.notebook_id
        and g.owner_id = auth.uid()
    )
  );

create policy "chapters_delete_owned_grimoire"
  on public.chapters for delete
  to authenticated
  using (
    exists (
      select 1
      from public.notebooks n
      join public.grimoires g on g.id = n.grimoire_id
      where n.id = chapters.notebook_id
        and g.owner_id = auth.uid()
    )
  );

create policy "pages_select_owned_grimoire"
  on public.pages for select
  to authenticated
  using (
    exists (
      select 1
      from public.chapters c
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where c.id = pages.chapter_id
        and g.owner_id = auth.uid()
    )
  );

create policy "pages_insert_owned_grimoire"
  on public.pages for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.chapters c
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where c.id = pages.chapter_id
        and g.owner_id = auth.uid()
    )
  );

create policy "pages_update_owned_grimoire"
  on public.pages for update
  to authenticated
  using (
    exists (
      select 1
      from public.chapters c
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where c.id = pages.chapter_id
        and g.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.chapters c
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where c.id = pages.chapter_id
        and g.owner_id = auth.uid()
    )
  );

create policy "pages_delete_owned_grimoire"
  on public.pages for delete
  to authenticated
  using (
    exists (
      select 1
      from public.chapters c
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where c.id = pages.chapter_id
        and g.owner_id = auth.uid()
    )
  );

grant select, insert, update, delete
  on public.grimoires, public.notebooks, public.chapters, public.pages
  to authenticated;
