begin;

insert into auth.users (id, email)
values ('b1000000-0000-4000-8000-000000000001', 'migration-existing-state@example.test');

insert into public.grimoires (id, owner_id, title)
values ('b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Existing state');

insert into public.notebooks (id, grimoire_id, title, position)
values ('b3000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', 'Existing notebook', 0);

insert into public.chapters (id, notebook_id, title, position)
values ('b4000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'Existing chapter', 0);

insert into public.pages (id, chapter_id, title, position)
values ('b5000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'Existing page', 0);

insert into public.educational_practice_items (
  id, owner_id, page_id, prompt, reference_answer, difficulty
)
values (
  'b6000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'b5000000-0000-4000-8000-000000000001',
  'Existing prompt',
  'Existing reference',
  3
);

insert into public.educational_practice_attempts (
  id, owner_id, practice_item_id, answer, outcome, evidence_score, confidence, feedback
)
values (
  'b7000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'b6000000-0000-4000-8000-000000000001',
  'Existing answer',
  'partial',
  0.5,
  'partial',
  'Existing feedback'
);

commit;
