begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(18);

insert into auth.users(id,email) values
('97000000-0000-4000-8000-000000000001','objective-owner@example.test'),
('97000000-0000-4000-8000-000000000002','objective-other@example.test');

insert into public.grimoires(id,owner_id,title) values
('97100000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001','Objective Grimoire');
insert into public.notebooks(id,grimoire_id,title,position) values
('97200000-0000-4000-8000-000000000001','97100000-0000-4000-8000-000000000001','Notebook',0);
insert into public.chapters(id,notebook_id,title,position) values
('97300000-0000-4000-8000-000000000001','97200000-0000-4000-8000-000000000001','Chapter',0);
insert into public.pages(id,chapter_id,title,position) values
('97400000-0000-4000-8000-000000000001','97300000-0000-4000-8000-000000000001','Objective Page',0);

select set_config('request.jwt.claim.sub','97000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"97000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

insert into public.educational_objective_assessments(
 id,owner_id,page_id,prompt,reference_answer,criterion,scoring_policy,minimum_evidence,validity_scope,criterion_version
) values (
 '97500000-0000-4000-8000-000000000001',
 '97000000-0000-4000-8000-000000000001',
 '97400000-0000-4000-8000-000000000001',
 'Qual é a resposta?',
 'Resposta correta',
 'A resposta deve corresponder à referência após normalização de caixa e espaços.',
 'normalized-exact-match',2,'page',1
);

select extensions.is((select count(*)::integer from public.educational_objective_assessments),1,'owner sees own objective assessment');

select extensions.is(
 (select (public.record_educational_objective_attempt(
   '97500000-0000-4000-8000-000000000001','  RESPOSTA   CORRETA '
 )).outcome),
 'pass',
 'server evaluates normalized exact match'
);

select extensions.is(
 (select (public.record_educational_objective_attempt(
   '97500000-0000-4000-8000-000000000001','Outra resposta'
 )).outcome),
 'fail',
 'server records failed criterion'
);

select extensions.is((select count(*)::integer from public.educational_objective_attempts),2,'two immutable objective attempts exist');
select extensions.is((select count(*)::integer from public.educational_objective_attempts where criterion_version=1),2,'criterion version is persisted');
select extensions.is((select count(*)::integer from public.educational_objective_attempts where confidence='strong'),2,'objective evidence has strong bounded confidence');

reset role;
select set_config('request.jwt.claim.sub','97000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"97000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select extensions.is((select count(*)::integer from public.educational_objective_assessments),0,'other owner cannot see objective assessment');
select extensions.is((select count(*)::integer from public.educational_objective_attempts),0,'other owner cannot see objective attempts');

select extensions.throws_ok(
 $$select public.record_educational_objective_attempt(
 '97500000-0000-4000-8000-000000000001','unauthorized')$$,
 'P0002',
 'Avaliação objetiva não encontrada.',
 'other owner cannot submit objective evidence'
);

reset role;
select extensions.ok(not has_table_privilege('anon','public.educational_objective_assessments','SELECT'),'anon cannot read objective assessments');
select extensions.ok(not has_table_privilege('anon','public.educational_objective_attempts','SELECT'),'anon cannot read objective attempts');
select extensions.ok(not has_table_privilege('authenticated','public.educational_objective_attempts','INSERT'),'attempts cannot be inserted directly');
select extensions.ok(not has_function_privilege('anon','public.record_educational_objective_attempt(uuid,text)','EXECUTE'),'anon cannot execute objective RPC');
select extensions.ok(not has_function_privilege('service_role','public.record_educational_objective_attempt(uuid,text)','EXECUTE'),'service role cannot execute objective RPC');
select extensions.ok(not prosecdef from pg_proc where pronamespace='public'::regnamespace and proname='record_educational_objective_attempt' and pronargs=2,'public objective RPC is invoker');
select extensions.ok(prosecdef from pg_proc where pronamespace='private'::regnamespace and proname='record_educational_objective_attempt' and pronargs=2,'private objective implementation is definer');
select extensions.ok(to_regclass('public.idx_educational_objective_assessments_owner_page') is not null,'assessment ownership index exists');
select extensions.ok(to_regclass('public.idx_educational_objective_attempts_owner_assessment_created') is not null,'attempt history index exists');

select extensions.finish();
rollback;
