-- Persisted focus sessions and explicit social connections for authenticated users.
-- Both tables are server-backed product state and are protected by RLS.

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  duration_seconds integer not null check (duration_seconds between 60 and 14400),
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);

create index idx_focus_sessions_owner_started
  on public.focus_sessions(owner_id, started_at desc);

alter table public.focus_sessions enable row level security;

create policy "focus_sessions_select_own"
  on public.focus_sessions for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "focus_sessions_insert_own"
  on public.focus_sessions for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "focus_sessions_update_own"
  on public.focus_sessions for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "focus_sessions_delete_own"
  on public.focus_sessions for delete to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.focus_sessions from anon, authenticated;
grant select, insert, update, delete on public.focus_sessions to authenticated;

create table public.friend_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> recipient_id)
);

create unique index uq_friend_connections_pair
  on public.friend_connections(
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id)
  );

create index idx_friend_connections_requester
  on public.friend_connections(requester_id, status);

create index idx_friend_connections_recipient
  on public.friend_connections(recipient_id, status);

alter table public.friend_connections enable row level security;

create policy "friend_connections_select_participant"
  on public.friend_connections for select to authenticated
  using (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  );

create policy "friend_connections_insert_requester"
  on public.friend_connections for insert to authenticated
  with check (requester_id = (select auth.uid()));

create policy "friend_connections_update_participant"
  on public.friend_connections for update to authenticated
  using (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  )
  with check (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  );

create policy "friend_connections_delete_participant"
  on public.friend_connections for delete to authenticated
  using (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  );

revoke all on public.friend_connections from anon, authenticated;
grant select, insert, update, delete on public.friend_connections to authenticated;

-- Relationship endpoints are immutable after creation. Only workflow state
-- and its timestamp can be changed by authenticated participants.
revoke update on public.friend_connections from authenticated;
grant update (status, updated_at) on public.friend_connections to authenticated;

drop policy if exists "friend_connections_update_participant" on public.friend_connections;

create policy "friend_connections_update_participant"
  on public.friend_connections for update to authenticated
  using (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  )
  with check (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  );
