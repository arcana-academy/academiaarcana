-- P1 educational core: native practice, retrieval evidence and secure ownership.
--
-- Practice items are authored by the student and bound to their own page.
-- Attempts store only the minimum educational evidence needed for feedback,
-- review scheduling, mastery projections and statistics.

create table public.educational_practice_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  page_id uuid not null references public.pages(id) on delete cascade,
  prompt text not null check (char_length(trim(prompt)) between 1 and 1000),
  reference_answer text not null check (char_length(trim(reference_answer)) between 1 and 5000),
  explanation text,
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.educational_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  practice_item_id uuid not null references public.educational_practice_items(id) on delete cascade,
  answer text not null check (char_length(trim(answer)) between 1 and 5000),
  outcome text not null check (outcome in ('strong', 'partial', 'insufficient')),
  evidence_score numeric(4,3) not null check (evidence_score >= 0 and evidence_score <= 1),
  confidence text not null check (confidence in ('strong', 'partial', 'insufficient')),
  feedback text not null check (char_length(trim(feedback)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index idx_educational_practice_items_owner_page
  on public.educational_practice_items(owner_id, page_id);

create index idx_educational_practice_attempts_owner_item_created
  on public.educational_practice_attempts(owner_id, practice_item_id, created_at desc);

alter table public.educational_practice_items enable row level security;
alter table public.educational_practice_attempts enable row level security;

create policy "educational_practice_items_select_own"
  on public.educational_practice_items for select to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = educational_practice_items.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "educational_practice_items_insert_own"
  on public.educational_practice_items for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = educational_practice_items.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "educational_practice_items_update_own"
  on public.educational_practice_items for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.pages p
      join public.chapters c on c.id = p.chapter_id
      join public.notebooks n on n.id = c.notebook_id
      join public.grimoires g on g.id = n.grimoire_id
      where p.id = educational_practice_items.page_id
        and g.owner_id = (select auth.uid())
    )
  );

create policy "educational_practice_items_delete_own"
  on public.educational_practice_items for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "educational_practice_attempts_select_own"
  on public.educational_practice_attempts for select to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.educational_practice_items item
      where item.id = educational_practice_attempts.practice_item_id
        and item.owner_id = (select auth.uid())
    )
  );

create policy "educational_practice_attempts_insert_own"
  on public.educational_practice_attempts for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.educational_practice_items item
      where item.id = educational_practice_attempts.practice_item_id
        and item.owner_id = (select auth.uid())
    )
  );

revoke all
  on public.educational_practice_items, public.educational_practice_attempts
  from anon, authenticated;

grant select, insert, update, delete
  on public.educational_practice_items
  to authenticated;

grant select
  on public.educational_practice_attempts
  to authenticated;
