-- Prevent participants from changing the requester/recipient columns of a friend connection.
--
-- The already-applied product_social_focus migration grants authenticated users
-- UPDATE at table scope. Restrict UPDATE to mutable workflow columns so the
-- participant relationship remains immutable after insertion.

revoke update on public.friend_connections from authenticated;
grant update (status, updated_at) on public.friend_connections to authenticated;

drop policy if exists "friend_connections_update_participant" on public.friend_connections;

create policy "friend_connections_update_participant"
  on public.friend_connections
  for update
  to authenticated
  using (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  )
  with check (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  );
