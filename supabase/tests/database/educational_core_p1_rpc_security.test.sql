begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(4);

select extensions.ok(
        not prosecdef,
        'public educational attempt RPC is SECURITY INVOKER'
)
from pg_proc
where pronamespace = 'public'::regnamespace
    and proname = 'record_educational_practice_attempt'
    and pronargs = 6;

select extensions.ok(
        prosecdef,
        'private educational attempt implementation is SECURITY DEFINER'
)
from pg_proc
where pronamespace = 'private'::regnamespace
    and proname = 'record_educational_practice_attempt'
    and pronargs = 6;

select extensions.ok(
        array_to_string(proconfig, ',') = 'search_path=public, pg_catalog',
        'public educational attempt RPC uses a safe search_path'
)
from pg_proc
where pronamespace = 'public'::regnamespace
    and proname = 'record_educational_practice_attempt'
    and pronargs = 6;

select extensions.ok(
        array_to_string(proconfig, ',') = 'search_path=""',
        'private educational attempt implementation uses an empty search_path'
)
from pg_proc
where pronamespace = 'private'::regnamespace
    and proname = 'record_educational_practice_attempt'
    and pronargs = 6;

select extensions.finish();

rollback;
