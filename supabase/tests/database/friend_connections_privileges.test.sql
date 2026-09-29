begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(8);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'public.friend_connections',
    'UPDATE'
  ),
  'authenticated has no table-wide UPDATE privilege on friend connections'
);

select extensions.ok(
  has_column_privilege(
    'authenticated',
    'public.friend_connections',
    'status',
    'UPDATE'
  ),
  'authenticated can update friend connection status'
);

select extensions.ok(
  has_column_privilege(
    'authenticated',
    'public.friend_connections',
    'updated_at',
    'UPDATE'
  ),
  'authenticated can update friend connection timestamps'
);

select extensions.ok(
  not has_column_privilege(
    'authenticated',
    'public.friend_connections',
    'requester_id',
    'UPDATE'
  ),
  'authenticated cannot update the friend connection requester'
);

select extensions.ok(
  not has_column_privilege(
    'authenticated',
    'public.friend_connections',
    'recipient_id',
    'UPDATE'
  ),
  'authenticated cannot update the friend connection recipient'
);

select extensions.ok(
  not has_column_privilege(
    'authenticated',
    'public.friend_connections',
    'id',
    'UPDATE'
  ),
  'authenticated cannot update the friend connection id'
);

select extensions.ok(
  not has_column_privilege(
    'anon',
    'public.friend_connections',
    'status',
    'UPDATE'
  ),
  'anon cannot update friend connection status'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'public.friend_connections',
    'UPDATE'
  ),
  'anon has no table-wide UPDATE privilege on friend connections'
);

select * from extensions.finish();

rollback;
