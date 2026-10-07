-- Require new friend requests to start in the pending state.
-- This fix-forward closes the direct INSERT path that could bypass recipient acceptance.

drop policy if exists
  "friend_connections_insert_requester"
on public.friend_connections;

create policy "friend_connections_insert_requester"
  on public.friend_connections
  for insert
  to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
  );
