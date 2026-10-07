-- Restrict friend-connection state transitions to the request recipient.
-- Existing column-level UPDATE grants remain unchanged:
-- only status and updated_at are mutable.

drop policy if exists
  "friend_connections_update_participant"
on public.friend_connections;

create policy "friend_connections_update_recipient"
  on public.friend_connections
  for update
  to authenticated
  using (
    recipient_id = (select auth.uid())
  )
  with check (
    recipient_id = (select auth.uid())
  );
