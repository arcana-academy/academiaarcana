-- Cover the foreign keys introduced by the P1 educational core.
create index idx_educational_practice_items_page_id
  on public.educational_practice_items(page_id);

create index idx_educational_practice_attempts_practice_item_id
  on public.educational_practice_attempts(practice_item_id);
