begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(12);

create function pg_temp.exec_row_count(p_sql text)
returns integer
language plpgsql
as $fn$
declare
  v_count integer;
begin
  execute p_sql;
  get diagnostics v_count = row_count;
  return v_count;
end;
$fn$;

insert into auth.users (id, email)
values
  ('ae000000-0000-4000-8000-000000000001', 'qa-cover-owner-a@example.test'),
  ('ae000000-0000-4000-8000-000000000002', 'qa-cover-owner-b@example.test');

-- Metadata-only rows in the disposable local DB; no product media is created.
insert into storage.objects (id, bucket_id, name, owner_id, metadata)
values
  ('af000000-0000-4000-8000-000000000001', 'grimoire-covers', 'ae000000-0000-4000-8000-000000000001/cover-a.png', 'ae000000-0000-4000-8000-000000000001', '{"mimetype":"image/png","size":68}'::jsonb),
  ('af000000-0000-4000-8000-000000000002', 'grimoire-covers', 'ae000000-0000-4000-8000-000000000002/cover-b.png', 'ae000000-0000-4000-8000-000000000002', '{"mimetype":"image/png","size":68}'::jsonb);

select extensions.ok(
  (select not public from storage.buckets where id = 'grimoire-covers'),
  'grimoire cover bucket remains private'
);
select extensions.is(
  (select file_size_limit::bigint from storage.buckets where id = 'grimoire-covers'),
  5242880::bigint,
  'grimoire cover bucket retains 5 MiB file limit'
);
select extensions.is(
  (select allowed_mime_types::text from storage.buckets where id = 'grimoire-covers'),
  '{image/jpeg,image/png,image/webp,image/avif}'::text,
  'grimoire cover bucket accepts only the approved image formats'
);
select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'storage.objects'::regclass),
  'Storage objects RLS is enabled'
);

set local role anon;
select extensions.results_eq(
  $sql$select id from storage.objects where bucket_id = 'grimoire-covers' order by id$sql$,
  $expected$select null::uuid where false$expected$,
  'anonymous users cannot read private cover objects'
);
reset role;

select set_config('request.jwt.claim.sub', 'ae000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"ae000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.results_eq(
  $sql$select id from storage.objects where bucket_id = 'grimoire-covers' order by id$sql$,
  $expected$values ('af000000-0000-4000-8000-000000000001'::uuid)$expected$,
  'cover owner A reads only their own object'
);
select extensions.is(
  pg_temp.exec_row_count(
    $$insert into storage.objects (bucket_id, name, owner_id, metadata)
      values ('grimoire-covers', 'ae000000-0000-4000-8000-000000000001/new-cover.png',
              'ae000000-0000-4000-8000-000000000001', '{"mimetype":"image/png","size":68}'::jsonb)$$
  ),
  1,
  'cover owner A can insert metadata under their own user folder'
);
select extensions.throws_ok(
  $sql$insert into storage.objects (bucket_id, name, owner_id, metadata)
       values ('grimoire-covers', 'ae000000-0000-4000-8000-000000000002/forged.png',
               'ae000000-0000-4000-8000-000000000001', '{"mimetype":"image/png","size":68}'::jsonb)$sql$,
  '42501',
  null,
  'cover owner A cannot create an object in user B folder'
);
select extensions.throws_ok(
  $sql$update storage.objects set name = 'ae000000-0000-4000-8000-000000000002/moved.png'
       where id = 'af000000-0000-4000-8000-000000000001'$sql$,
  '42501',
  null,
  'cover owner A cannot move their object into user B folder'
);
select extensions.is(
  pg_temp.exec_row_count(
    $$delete from storage.objects where id = 'af000000-0000-4000-8000-000000000002'$$
  ),
  0,
  'cover owner A cannot delete user B object'
);

reset role;
select set_config('request.jwt.claim.sub', 'ae000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"ae000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;
select extensions.results_eq(
  $sql$select id from storage.objects where bucket_id = 'grimoire-covers' order by id$sql$,
  $expected$values ('af000000-0000-4000-8000-000000000002'::uuid)$expected$,
  'cover owner B reads only their own object'
);
select extensions.ok(
  (select count(*)::integer = 1 from storage.objects where id = 'af000000-0000-4000-8000-000000000002'),
  'user B metadata was not modified by user A attempts'
);

select * from extensions.finish();
rollback;
