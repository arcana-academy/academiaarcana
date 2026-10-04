begin;

create extension if not exists pgtap with schema extensions;

select extensions.no_plan();

select extensions.ok(
  to_regprocedure('public.move_workspace_page(uuid,text)') is not null,
  'a RPC move_workspace_page existe'
);
select extensions.is(
  (select proc.provolatile from pg_proc as proc
   where proc.oid = to_regprocedure('public.move_workspace_page(uuid,text)')),
  'v',
  'a RPC é VOLATILE'
);
select extensions.ok(
  not (select proc.prosecdef from pg_proc as proc
       where proc.oid = to_regprocedure('public.move_workspace_page(uuid,text)')),
  'a RPC é SECURITY INVOKER'
);
select extensions.ok(
  exists (
    select 1 from pg_proc as proc
    where proc.oid = to_regprocedure('public.move_workspace_page(uuid,text)')
      and proc.proconfig @> array['search_path=""']
  ),
  'a RPC fixa search_path vazio'
);
select extensions.ok(
  has_function_privilege(
    'authenticated', 'public.move_workspace_page(uuid,text)', 'execute'
  ),
  'authenticated pode executar a RPC'
);
select extensions.ok(
  not has_function_privilege(
    'anon', 'public.move_workspace_page(uuid,text)', 'execute'
  ),
  'anon não pode executar a RPC'
);
select extensions.ok(
  not has_function_privilege(
    'service_role', 'public.move_workspace_page(uuid,text)', 'execute'
  ),
  'service_role não pode executar a RPC'
);
select extensions.ok(
  not exists (
    select 1 from pg_constraint as constraint_row
    where constraint_row.conrelid = 'public.pages'::regclass
      and constraint_row.contype = 'u'
      and pg_get_constraintdef(constraint_row.oid) ilike '%chapter_id%'
      and pg_get_constraintdef(constraint_row.oid) ilike '%position%'
  ),
  'não existe UNIQUE(chapter_id, position)'
);

insert into auth.users (id, email)
values
  ('00000000-0000-4000-8000-000000000001', 'move-owner-1@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'move-owner-2@example.com');

insert into public.grimoires (id, owner_id, title)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Owner 1'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Owner 2');

insert into public.notebooks (id, grimoire_id, title, position)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Notebook 1', 0),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Notebook 2', 0);

insert into public.chapters (id, notebook_id, title, position)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Chapter 1', 0),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Chapter 2', 0);

insert into public.pages (id, chapter_id, title, position)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Page 1', 0),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'Page 2', 1),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'Page 3', 2),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'Other owner', 0);

select set_config(
  'request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select set_config(
  'move_test.result',
  public.move_workspace_page(
    '40000000-0000-4000-8000-000000000001', 'down'
  )::text,
  true
);
select extensions.is(
  current_setting('move_test.result')::jsonb #>> '{moved_page,id}',
  '40000000-0000-4000-8000-000000000001',
  'movimento para baixo identifica moved_page'
);
select extensions.is(
  current_setting('move_test.result')::jsonb #>> '{moved_page,position}',
  '1',
  'movimento para baixo retorna a nova posição'
);
select extensions.is(
  current_setting('move_test.result')::jsonb #>> '{swapped_page,id}',
  '40000000-0000-4000-8000-000000000002',
  'movimento para baixo identifica swapped_page'
);
select extensions.is(
  current_setting('move_test.result')::jsonb #>> '{swapped_page,position}',
  '0',
  'movimento para baixo retorna a posição trocada'
);
select extensions.is(
  (select string_agg(position::text, ',' order by position)
   from public.pages
   where chapter_id = '30000000-0000-4000-8000-000000000001'),
  '0,1,2',
  'swap para baixo persiste posições únicas'
);

select set_config(
  'move_test.result',
  public.move_workspace_page(
    '40000000-0000-4000-8000-000000000001', 'up'
  )::text,
  true
);
select extensions.is(
  current_setting('move_test.result')::jsonb #>> '{moved_page,position}',
  '0',
  'movimento para cima retorna a nova posição'
);
select extensions.is(
  current_setting('move_test.result')::jsonb #>> '{swapped_page,position}',
  '1',
  'movimento para cima retorna a posição trocada'
);


select set_config(
  'move_test.result',
  public.move_workspace_page(
    '40000000-0000-4000-8000-000000000001', 'up'
  )::text,
  true
);
select extensions.is(
  current_setting('move_test.result')::jsonb #>> '{moved_page,position}',
  '0',
  'primeiro item mantém posição no limite superior'
);
select extensions.is(
  current_setting('move_test.result')::jsonb -> 'swapped_page',
  'null'::jsonb,
  'primeiro item retorna swapped_page nulo'
);

select set_config(
  'move_test.result',
  public.move_workspace_page(
    '40000000-0000-4000-8000-000000000003', 'down'
  )::text,
  true
);
select extensions.is(
  current_setting('move_test.result')::jsonb #>> '{moved_page,position}',
  '2',
  'último item mantém posição no limite inferior'
);
select extensions.is(
  current_setting('move_test.result')::jsonb -> 'swapped_page',
  'null'::jsonb,
  'último item retorna swapped_page nulo'
);

select set_config(
  'move_test.result',
  public.move_workspace_page(
    '49999999-9999-4999-8999-999999999999', 'down'
  )::text,
  true
);
select extensions.is(
  current_setting('move_test.result')::jsonb -> 'moved_page',
  'null'::jsonb,
  'página inexistente retorna moved_page nulo'
);

reset role;
select set_config(
  'request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select set_config(
  'move_test.result',
  public.move_workspace_page(
    '40000000-0000-4000-8000-000000000001', 'down'
  )::text,
  true
);
select extensions.is(
  current_setting('move_test.result')::jsonb -> 'moved_page',
  'null'::jsonb,
  'RLS oculta página de outro owner'
);

select set_config(
  'move_test.result',
  public.move_workspace_page(
    '40000000-0000-4000-8000-000000000004', 'down'
  )::text,
  true
);
select extensions.is(
  current_setting('move_test.result')::jsonb #>> '{moved_page,id}',
  '40000000-0000-4000-8000-000000000004',
  'owner correto consegue mover sua página'
);

select extensions.throws_ok(
  $$select public.move_workspace_page(
    '40000000-0000-4000-8000-000000000004', 'sideways'
  )$$,
  '22023',
  'Direção de movimento inválida.',
  'direção inválida falha explicitamente'
);

reset role;
update public.pages
set position = 0
where id = '40000000-0000-4000-8000-000000000002';

select set_config(
  'request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.throws_ok(
  $$select public.move_workspace_page(
    '40000000-0000-4000-8000-000000000001', 'down'
  )$$,
  '23514',
  'Capítulo contém posições duplicadas.',
  'estado inconsistente falha explicitamente'
);
select extensions.is(
  (select position from public.pages
   where id = '40000000-0000-4000-8000-000000000001'),
  0,
  'falha por duplicatas não move a página solicitada'
);
select extensions.is(
  (select position from public.pages
   where id = '40000000-0000-4000-8000-000000000002'),
  0,
  'falha por duplicatas não altera a página vizinha'
);

reset role;
update public.pages
set position = 1
where id = '40000000-0000-4000-8000-000000000002';

create function pg_temp.fail_move_workspace_page_test()
returns trigger
language plpgsql
as $$
begin
  raise exception 'falha controlada durante swap'
    using errcode = 'P0001';
end;
$$;

create trigger move_workspace_page_test_failure
after update on public.pages
for each row
when (new.id = '40000000-0000-4000-8000-000000000002')
execute function pg_temp.fail_move_workspace_page_test();

select set_config(
  'request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.throws_ok(
  $$select public.move_workspace_page(
    '40000000-0000-4000-8000-000000000001', 'down'
  )$$,
  'P0001',
  'falha controlada durante swap',
  'falha controlada aborta a operação'
);
select extensions.is(
  (select position from public.pages
   where id = '40000000-0000-4000-8000-000000000001'),
  0,
  'rollback preserva posição original da página movida'
);
select extensions.is(
  (select position from public.pages
   where id = '40000000-0000-4000-8000-000000000002'),
  1,
  'rollback preserva posição original da página vizinha'
);

reset role;
drop trigger move_workspace_page_test_failure on public.pages;

select extensions.finish();
rollback;
