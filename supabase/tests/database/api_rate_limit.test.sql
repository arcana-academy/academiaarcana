begin;

create extension if not exists pgtap with schema extensions;

-- 4 privilege assertions + 4 window decisions + error handling + isolation.
select extensions.plan(10);

insert into auth.users (id, email)
values
  ('97000000-0000-4000-8000-000000000001', 'rate-limit-a@example.test'),
  ('97000000-0000-4000-8000-000000000002', 'rate-limit-b@example.test');

-- A disposable policy keeps the assertions independent from the production
-- quotas seeded by the migration.
insert into private.api_rate_limit_policies (bucket, window_seconds, max_requests)
values ('rate-limit-test', 3600, 2);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.consume_api_rate_limit(text)',
    'EXECUTE'
  ),
  'authenticated pode consumir o limite'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.consume_api_rate_limit(text)',
    'EXECUTE'
  ),
  'anon não pode consumir o limite'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'private.api_rate_limit_counters',
    'SELECT'
  ),
  'authenticated não lê os contadores internos'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'private.api_rate_limit_policies',
    'UPDATE'
  ),
  'authenticated não altera as políticas de limite'
);

select set_config(
  'request.jwt.claim.sub',
  '97000000-0000-4000-8000-000000000001',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

set local role authenticated;

select extensions.is(
  (
    select decision.allowed
    from public.consume_api_rate_limit('rate-limit-test') as decision
  ),
  true,
  'primeira requisição é permitida'
);

select extensions.is(
  (
    select decision.remaining
    from public.consume_api_rate_limit('rate-limit-test') as decision
  ),
  0,
  'a segunda requisição consome o saldo restante'
);

select extensions.is(
  (
    select decision.allowed
    from public.consume_api_rate_limit('rate-limit-test') as decision
  ),
  false,
  'a requisição acima do limite é bloqueada'
);

select extensions.ok(
  (
    select decision.retry_after_seconds > 0
    from public.consume_api_rate_limit('rate-limit-test') as decision
  ),
  'a resposta bloqueada informa quando tentar novamente'
);

select extensions.throws_ok(
  $$select * from public.consume_api_rate_limit('bucket-inexistente')$$,
  '22023',
  'Bucket de limite desconhecido.',
  'bucket desconhecido falha em vez de liberar sem controle'
);

reset role;

select set_config(
  'request.jwt.claim.sub',
  '97000000-0000-4000-8000-000000000002',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

set local role authenticated;

select extensions.is(
  (
    select decision.allowed
    from public.consume_api_rate_limit('rate-limit-test') as decision
  ),
  true,
  'o limite de um estudante não bloqueia outro'
);

reset role;

select extensions.finish();

rollback;
