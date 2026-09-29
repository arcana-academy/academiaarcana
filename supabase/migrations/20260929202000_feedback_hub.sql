-- Feedback Hub: authenticated, user-owned feedback submissions.
create table if not exists public.feedback_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text check (name is null or char_length(trim(name)) between 1 and 120),
  email text not null check (char_length(trim(email)) between 3 and 320),
  feedback text not null check (char_length(trim(feedback)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_responses_user_created
  on public.feedback_responses(user_id, created_at desc);

alter table public.feedback_responses enable row level security;

drop policy if exists "feedback_responses_select_own" on public.feedback_responses;
create policy "feedback_responses_select_own"
  on public.feedback_responses
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "feedback_responses_insert_own" on public.feedback_responses;
create policy "feedback_responses_insert_own"
  on public.feedback_responses
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

revoke all on table public.feedback_responses from anon;
revoke all on table public.feedback_responses from authenticated;
grant select, insert on table public.feedback_responses to authenticated;
