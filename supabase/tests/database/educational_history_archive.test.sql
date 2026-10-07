begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email)
values
  ('00000000-0000-4000-8000-000000000051', 'history-owner-1@example.com'),
  ('00000000-0000-4000-8000-000000000052', 'history-owner-2@example.com');

insert into public.grimoires (id, owner_id, title)
values
  ('10000000-0000-4000-8000-000000000051', '00000000-0000-4000-8000-000000000051', 'Grimório preservado'),
  ('10000000-0000-4000-8000-000000000052', '00000000-0000-4000-8000-000000000052', 'Grimório em cascata');

insert into public.notebooks (id, grimoire_id, title, position)
values
  ('20000000-0000-4000-8000-000000000051', '10000000-0000-4000-8000-000000000051', 'Caderno 1', 0),
  ('20000000-0000-4000-8000-000000000052', '10000000-0000-4000-8000-000000000052', 'Caderno 2', 0);

insert into public.chapters (id, notebook_id, title, position)
values
  ('30000000-0000-4000-8000-000000000051', '20000000-0000-4000-8000-000000000051', 'Capítulo 1', 0),
  ('30000000-0000-4000-8000-000000000052', '20000000-0000-4000-8000-000000000052', 'Capítulo 2', 0);

insert into public.pages (id, chapter_id, title, content, position)
values
  ('40000000-0000-4000-8000-000000000051', '30000000-0000-4000-8000-000000000051', 'Página removida diretamente', '{"type":"document","blocks":[{"type":"paragraph","content":"Texto preservado."}]}', 0),
  ('40000000-0000-4000-8000-000000000052', '30000000-0000-4000-8000-000000000052', 'Página removida pela hierarquia', '{"type":"document","blocks":[{"type":"paragraph","content":"Outra evidência preservada."}]}', 0);

insert into public.page_progress (owner_id, page_id, status, completed_at)
values
  ('00000000-0000-4000-8000-000000000051', '40000000-0000-4000-8000-000000000051', 'completed', now());

insert into public.educational_practice_items (
  id, owner_id, page_id, prompt, reference_answer, difficulty
)
values
  ('50000000-0000-4000-8000-000000000051', '00000000-0000-4000-8000-000000000051', '40000000-0000-4000-8000-000000000051', 'Pergunta preservada', 'Referência preservada', 3),
  ('50000000-0000-4000-8000-000000000052', '00000000-0000-4000-8000-000000000052', '40000000-0000-4000-8000-000000000052', 'Pergunta em cascata', 'Referência em cascata', 2);

insert into public.educational_practice_attempts (
  id, owner_id, practice_item_id, answer, outcome, evidence_score, confidence, feedback
)
values
  ('60000000-0000-4000-8000-000000000051', '00000000-0000-4000-8000-000000000051', '50000000-0000-4000-8000-000000000051', 'Resposta preservada', 'strong', 0.9, 'strong', 'Feedback preservado'),
  ('60000000-0000-4000-8000-000000000052', '00000000-0000-4000-8000-000000000052', '50000000-0000-4000-8000-000000000052', 'Resposta em cascata', 'partial', 0.5, 'partial', 'Feedback em cascata');

delete from public.pages
where id = '40000000-0000-4000-8000-000000000051';

select extensions.is(
  (select count(*)::int from public.archived_page_learning_history
   where source_page_id = '40000000-0000-4000-8000-000000000051'),
  1,
  'a exclusão direta arquiva a página com evidência'
);
select extensions.is(
  (select snapshot #>> '{page,title}' from public.archived_page_learning_history
   where source_page_id = '40000000-0000-4000-8000-000000000051'),
  'Página removida diretamente',
  'o histórico preserva o título original'
);
select extensions.is(
  (select snapshot #>> '{page,content,blocks,0,content}' from public.archived_page_learning_history
   where source_page_id = '40000000-0000-4000-8000-000000000051'),
  'Texto preservado.',
  'o histórico preserva o conteúdo original'
);
select extensions.is(
  (select snapshot #>> '{practiceItems,0,attempts,0,answer}' from public.archived_page_learning_history
   where source_page_id = '40000000-0000-4000-8000-000000000051'),
  'Resposta preservada',
  'o histórico preserva a resposta da tentativa'
);
select extensions.is(
  (select snapshot #>> '{pageProgress,0,status}' from public.archived_page_learning_history
   where source_page_id = '40000000-0000-4000-8000-000000000051'),
  'completed',
  'o histórico preserva o progresso da página'
);
select extensions.is(
  (select count(*)::int from public.educational_practice_attempts
   where id = '60000000-0000-4000-8000-000000000051'),
  0,
  'a tentativa original continua sujeita à cascata, com cópia arquivada'
);

delete from public.grimoires
where id = '10000000-0000-4000-8000-000000000052';

select extensions.is(
  (select count(*)::int from public.archived_page_learning_history
   where source_page_id = '40000000-0000-4000-8000-000000000052'),
  1,
  'a exclusão da hierarquia também arquiva a página'
);
select extensions.is(
  (select snapshot #>> '{practiceItems,0,attempts,0,answer}' from public.archived_page_learning_history
   where source_page_id = '40000000-0000-4000-8000-000000000052'),
  'Resposta em cascata',
  'a cascata preserva tentativas completas'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000051', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000051","role":"authenticated"}', true);
set local role authenticated;
select extensions.is(
  (select count(*)::int from public.archived_page_learning_history),
  1,
  'cada estudante vê apenas o próprio histórico arquivado'
);
select extensions.throws_ok(
  $$insert into public.archived_page_learning_history(owner_id, source_page_id, snapshot)
    values ('00000000-0000-4000-8000-000000000051', '70000000-0000-4000-8000-000000000051', '{}'::jsonb)$$,
  '42501',
  null,
  'estudantes não podem inserir registros de histórico diretamente'
);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000052', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000052","role":"authenticated"}', true);
set local role authenticated;
select extensions.is(
  (select count(*)::int from public.archived_page_learning_history),
  1,
  'o histórico de outra conta não é visível'
);
reset role;

select extensions.finish();
rollback;

