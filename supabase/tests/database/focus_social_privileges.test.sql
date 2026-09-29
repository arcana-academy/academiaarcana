begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(14);

select extensions.ok(
  has_table_privilege('authenticated', 'public.focus_sessions', 'SELECT'),
  'authenticated can read own focus sessions'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.focus_sessions', 'INSERT'),
  'authenticated can create focus sessions'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.focus_sessions', 'UPDATE'),
  'authenticated can complete focus sessions'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.focus_sessions', 'SELECT'),
  'anon cannot read focus sessions'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.focus_sessions', 'INSERT'),
  'anon cannot create focus sessions'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.friend_connections', 'SELECT'),
  'authenticated can read participant connections'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.friend_connections', 'INSERT'),
  'authenticated can create connection requests'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.friend_connections', 'UPDATE'),
  'authenticated has no table-wide update privilege on connections'
);
select extensions.ok(
  has_column_privilege('authenticated', 'public.friend_connections', 'status', 'UPDATE'),
  'authenticated can update connection status'
);
select extensions.ok(
  has_column_privilege('authenticated', 'public.friend_connections', 'updated_at', 'UPDATE'),
  'authenticated can update connection timestamps'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.friend_connections', 'requester_id', 'UPDATE'),
  'authenticated cannot change connection requester'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.friend_connections', 'recipient_id', 'UPDATE'),
  'authenticated cannot change connection recipient'
);
select extensions.ok(
  not has_column_privilege('anon', 'public.friend_connections', 'status', 'UPDATE'),
  'anon cannot update connection status'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.friend_connections', 'SELECT'),
  'anon cannot read connections'
);

select * from extensions.finish();
rollback;
