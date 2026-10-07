-- Preserve learner-owned progress and practice evidence when a workspace page
-- is deleted directly or through a parent hierarchy cascade.
create table public.archived_page_learning_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_page_id uuid not null,
  archived_at timestamptz not null default now(),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object')
);

create index archived_page_learning_history_owner_archived_idx
  on public.archived_page_learning_history(owner_id, archived_at desc);

alter table public.archived_page_learning_history enable row level security;

create policy archived_page_learning_history_select_own
  on public.archived_page_learning_history
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.archived_page_learning_history from public, anon, authenticated;
grant select on public.archived_page_learning_history to authenticated;

create function public.archive_page_learning_history_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  for v_owner_id in
    select item.owner_id
    from public.educational_practice_items as item
    where item.page_id = old.id
    union
    select progress.owner_id
    from public.page_progress as progress
    where progress.page_id = old.id
  loop
    insert into public.archived_page_learning_history (
      owner_id,
      source_page_id,
      snapshot
    )
    values (
      v_owner_id,
      old.id,
      jsonb_build_object(
        'page', to_jsonb(old),
        'practiceItems', coalesce(
          (
            select jsonb_agg(
              to_jsonb(item) || jsonb_build_object(
                'attempts', coalesce(
                  (
                    select jsonb_agg(to_jsonb(attempt) order by attempt.created_at, attempt.id)
                    from public.educational_practice_attempts as attempt
                    where attempt.practice_item_id = item.id
                      and attempt.owner_id = v_owner_id
                  ),
                  '[]'::jsonb
                )
              )
              order by item.created_at, item.id
            )
            from public.educational_practice_items as item
            where item.page_id = old.id
              and item.owner_id = v_owner_id
          ),
          '[]'::jsonb
        ),
        'pageProgress', coalesce(
          (
            select jsonb_agg(to_jsonb(progress) order by progress.updated_at, progress.id)
            from public.page_progress as progress
            where progress.page_id = old.id
              and progress.owner_id = v_owner_id
          ),
          '[]'::jsonb
        )
      )
    );
  end loop;

  return old;
end;
$$;

revoke all on function public.archive_page_learning_history_before_delete()
  from public, anon, authenticated;

create trigger pages_archive_learning_history_before_delete
before delete on public.pages
for each row
execute function public.archive_page_learning_history_before_delete();

