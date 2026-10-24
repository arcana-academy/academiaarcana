begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(14);

insert into auth.users (id, email)
values
  ('ad000000-0000-4000-8000-000000000001', 'qa-ai-rate-limit-a@example.test'),
  ('ad000000-0000-4000-8000-000000000002', 'qa-ai-rate-limit-b@example.test');

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.open_source_ai_rate_limits'::regclass),
  'rate-limit state has RLS enabled'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.open_source_ai_rate_limits', 'SELECT'),
  'authenticated users cannot read rate-limit state directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.open_source_ai_rate_limits', 'INSERT,UPDATE,DELETE'),
  'authenticated users cannot modify rate-limit state directly'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.open_source_ai_rate_limits', 'SELECT,INSERT,UPDATE,DELETE'),
  'anonymous users have no rate-limit table access'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.consume_open_source_ai_rate_limit()', 'EXECUTE'),
  'anonymous users cannot execute the rate-limit RPC'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.consume_open_source_ai_rate_limit()', 'EXECUTE'),
  'authenticated users can execute the narrow rate-limit RPC'
);

select set_config('request.jwt.claim.sub', 'ad000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"ad000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.ok(
  (select allowed from public.consume_open_source_ai_rate_limit()),
  'first request for user A is allowed'
);
-- A set-returning, no-argument LATERAL call can be evaluated once and its
-- result duplicated across generate_series rows. Invoke it in PL/pgSQL so each
-- loop iteration is a real request against the durable counter.
do $test$
declare
  request_number integer;
begin
  for request_number in 1..19 loop
    perform public.consume_open_source_ai_rate_limit();
  end loop;
end;
$test$;
select extensions.is(
  (select remaining from public.consume_open_source_ai_rate_limit()),
  0,
  'user A exhausts the remaining 19 requests in the window'
);
select extensions.ok(
  not (select allowed from public.consume_open_source_ai_rate_limit()),
  'user A is denied after 20 requests in the fixed window'
);
select extensions.ok(
  (select retry_after_seconds between 1 and 60
   from public.consume_open_source_ai_rate_limit()),
  'denied request receives a bounded retry delay'
);

reset role;
select set_config('request.jwt.claim.sub', 'ad000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"ad000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;
select extensions.ok(
  (select allowed from public.consume_open_source_ai_rate_limit()),
  'user B has an independent rate-limit window'
);
select extensions.is(
  (select remaining from public.consume_open_source_ai_rate_limit()),
  18,
  'user B counter advances independently'
);

reset role;
select set_config('request.jwt.claim.sub', 'ad000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"ad000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;
select extensions.ok(
  not (select allowed from public.consume_open_source_ai_rate_limit()),
  'user A remains limited after user B makes a request'
);

reset role;
select extensions.is(
  (select count(*)::integer from public.open_source_ai_rate_limits),
  2,
  'only one durable counter row is kept per synthetic account'
);

select * from extensions.finish();
rollback;
