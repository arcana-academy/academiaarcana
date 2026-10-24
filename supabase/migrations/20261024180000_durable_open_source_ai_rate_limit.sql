-- Durable, atomic per-account throttling for the authenticated open-source AI gateway.
-- The only persistent state is one short-window counter per Auth user; no provider
-- request is made unless the database atomically grants a slot.
create table public.open_source_ai_rate_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 1 and 21)
);

alter table public.open_source_ai_rate_limits enable row level security;

-- Callers use only the narrow RPC below; never expose counters or allow direct edits.
revoke all on table public.open_source_ai_rate_limits from public, anon, authenticated, service_role;

create or replace function public.consume_open_source_ai_rate_limit()
returns table (
  allowed boolean,
  rate_limit integer,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz;
  v_window_started_at timestamptz;
  v_request_count integer;
  v_limit constant integer := 20;
  v_window_seconds constant integer := 60;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  -- Serialize the account's requests before reading the window clock, so
  -- contending requests cannot use stale timestamps or overshoot the quota.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );
  v_now := pg_catalog.clock_timestamp();

  insert into public.open_source_ai_rate_limits as current_limit (
    user_id,
    window_started_at,
    request_count
  )
  values (v_user_id, v_now, 1)
  on conflict (user_id) do update
    set window_started_at = case
          when current_limit.window_started_at <= v_now - make_interval(secs => v_window_seconds)
            then v_now
          else current_limit.window_started_at
        end,
        request_count = case
          when current_limit.window_started_at <= v_now - make_interval(secs => v_window_seconds)
            then 1
          else least(current_limit.request_count + 1, v_limit + 1)
        end
  returning current_limit.window_started_at,
            current_limit.request_count
       into v_window_started_at, v_request_count;

  return query
  select v_request_count <= v_limit,
         v_limit,
         greatest(0, v_limit - v_request_count),
         greatest(
           1,
           ceil(extract(epoch from (
             v_window_started_at + make_interval(secs => v_window_seconds) - v_now
           )))::integer
         );
end;
$function$;

revoke all on function public.consume_open_source_ai_rate_limit() from public, anon;
grant execute on function public.consume_open_source_ai_rate_limit() to authenticated;
