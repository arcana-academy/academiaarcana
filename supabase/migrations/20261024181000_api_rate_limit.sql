-- Durable per-user rate limiting for the expensive API surfaces.
--
-- Counters and policies live in the `private` schema so the Data API can never
-- read or write them: the only reachable entry point is the SECURITY DEFINER
-- routine below, and it derives the subject from `auth.uid()` instead of a
-- client argument. A signed-in user therefore cannot raise its own quota by
-- calling the RPC directly with a larger limit: the policy row is the single
-- source of truth for both the application and any direct caller.

create schema if not exists private;

create table if not exists private.api_rate_limit_policies (
  bucket text primary key,
  window_seconds integer not null check (window_seconds between 1 and 86400),
  max_requests integer not null check (max_requests between 1 and 100000)
);

create table if not exists private.api_rate_limit_counters (
  bucket text not null
    references private.api_rate_limit_policies (bucket) on delete cascade,
  subject_id uuid not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (bucket, subject_id, window_start)
);

-- Supports pruning of stale windows without scanning the whole table.
create index if not exists api_rate_limit_counters_window_start_idx
  on private.api_rate_limit_counters (window_start);

insert into private.api_rate_limit_policies (bucket, window_seconds, max_requests)
values
  ('mestre-arcano', 60, 10),
  ('feedback', 3600, 10)
on conflict (bucket) do nothing;

create or replace function public.consume_api_rate_limit(p_bucket text)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_subject_id uuid := (select auth.uid());
  v_policy private.api_rate_limit_policies;
  v_window_start timestamptz;
  v_request_count integer;
  v_retry_after_seconds integer;
begin
  if v_subject_id is null then
    raise exception using errcode = '42501', message = 'Não autenticado.';
  end if;

  select policies.*
    into v_policy
    from private.api_rate_limit_policies as policies
   where policies.bucket = p_bucket;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'Bucket de limite desconhecido.';
  end if;

  -- Fixed window aligned to the epoch, so every caller in the same period
  -- increments the same row.
  v_window_start := pg_catalog.to_timestamp(
    pg_catalog.floor(
      extract(epoch from pg_catalog.now()) / v_policy.window_seconds
    ) * v_policy.window_seconds
  );

  -- The upsert takes the row lock, so concurrent requests serialize and the
  -- counter can never lose an increment.
  insert into private.api_rate_limit_counters as counters (
    bucket,
    subject_id,
    window_start,
    request_count
  )
  values (p_bucket, v_subject_id, v_window_start, 1)
  on conflict (bucket, subject_id, window_start)
  do update set request_count = counters.request_count + 1
  returning counters.request_count into v_request_count;

  -- Bounded housekeeping: this subject's older windows are no longer relevant.
  delete from private.api_rate_limit_counters as counters
   where counters.bucket = p_bucket
     and counters.subject_id = v_subject_id
     and counters.window_start < v_window_start;

  v_retry_after_seconds := greatest(
    pg_catalog.ceil(
      extract(
        epoch from (
          (v_window_start + pg_catalog.make_interval(
            0, 0, 0, 0, 0, 0, v_policy.window_seconds::double precision
          )) - pg_catalog.now()
        )
      )
    )::integer,
    1
  );

  return query
    select
      v_request_count <= v_policy.max_requests,
      greatest(v_policy.max_requests - v_request_count, 0),
      case
        when v_request_count <= v_policy.max_requests then 0
        else v_retry_after_seconds
      end;
end;
$function$;

-- The counters are not part of the client-visible contract.
revoke all on table private.api_rate_limit_policies from public;
revoke all on table private.api_rate_limit_policies from anon;
revoke all on table private.api_rate_limit_policies from authenticated;
revoke all on table private.api_rate_limit_policies from service_role;

revoke all on table private.api_rate_limit_counters from public;
revoke all on table private.api_rate_limit_counters from anon;
revoke all on table private.api_rate_limit_counters from authenticated;
revoke all on table private.api_rate_limit_counters from service_role;

revoke all on function public.consume_api_rate_limit(text) from public;
revoke all on function public.consume_api_rate_limit(text) from anon;
revoke all on function public.consume_api_rate_limit(text) from service_role;
grant execute on function public.consume_api_rate_limit(text) to authenticated;
