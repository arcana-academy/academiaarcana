begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(1);

insert into auth.users (id, email)
values
  ('b1000000-0000-4000-8000-000000000001', 'qa-friend-requester@example.test'),
  ('b1000000-0000-4000-8000-000000000002', 'qa-friend-recipient@example.test');

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.throws_ok(
  $sql$
    insert into public.friend_connections (requester_id, recipient_id, status)
    values (
      'b1000000-0000-4000-8000-000000000001',
      'b1000000-0000-4000-8000-000000000002',
      'accepted'
    )
  $sql$,
  '42501',
  null,
  'AUTH-RLS-049 requester cannot create an already-accepted friend connection'
);

reset role;

select * from extensions.finish();
rollback;
