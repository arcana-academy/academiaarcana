-- Refuse to enforce the invariant if existing data needs an explicit repair.
-- The migration deliberately does not reorder or rewrite user pages.
do $$
begin
  if exists (
    select 1
    from public.pages
    group by chapter_id, position
    having count(*) > 1
  ) then
    raise exception using
      errcode = '23505',
      message = 'Cannot add pages_chapter_id_position_unique: duplicate page positions exist.';
  end if;
end;
$$;

alter table public.pages
  add constraint pages_chapter_id_position_unique
  unique (chapter_id, position)
  deferrable initially immediate;
create or replace function public.move_workspace_page(
  p_page_id uuid,
  p_direction text
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_chapter_id uuid;
  v_locked_chapter_id uuid;
  v_pages jsonb[] := array[]::jsonb[];
  v_page_found boolean := false;
  v_moved_index integer := 0;
  v_target_index integer;
  v_moved_id uuid;
  v_target_id uuid;
  v_moved_position integer;
  v_target_position integer;
  v_duplicate_positions integer;
  v_updated_count integer;
  v_updated_pages jsonb;
begin
  if p_direction is null or p_direction not in ('up', 'down') then
    raise exception using
      errcode = '22023',
      message = 'Direção de movimento inválida.';
  end if;

  select page.chapter_id
  into v_chapter_id
  from public.pages as page
  where page.id = p_page_id;

  if not found then
    return jsonb_build_object(
      'moved_page', null,
      'swapped_page', null
    );
  end if;

  select chapter.id
  into v_locked_chapter_id
  from public.chapters as chapter
  where chapter.id = v_chapter_id
  for update;

  if not found then
    return jsonb_build_object(
      'moved_page', null,
      'swapped_page', null
    );
  end if;

  perform page.id
  from public.pages as page
  where page.chapter_id = v_locked_chapter_id
  order by page.id
  for update;

  select
    count(*) - count(distinct page.position),
    coalesce(
      array_agg(to_jsonb(page) order by page.position, page.id),
      array[]::jsonb[]
    )
  into v_duplicate_positions, v_pages
  from public.pages as page
  where page.chapter_id = v_locked_chapter_id;

  if v_duplicate_positions > 0 then
    raise exception using
      errcode = '23514',
      message = 'Capítulo contém posições duplicadas.';
  end if;

  while not v_page_found
    and v_moved_index < coalesce(array_length(v_pages, 1), 0) loop
    v_moved_index := v_moved_index + 1;

    if (v_pages[v_moved_index] ->> 'id')::uuid = p_page_id then
      v_page_found := true;
    end if;
  end loop;

  if not v_page_found then
    return jsonb_build_object(
      'moved_page', null,
      'swapped_page', null
    );
  end if;

  v_moved_id := (v_pages[v_moved_index] ->> 'id')::uuid;
  v_moved_position := (v_pages[v_moved_index] ->> 'position')::integer;
  v_target_index := case
    when p_direction = 'up' then v_moved_index - 1
    else v_moved_index + 1
  end;

  if v_target_index < 1
    or v_target_index > coalesce(array_length(v_pages, 1), 0) then
    return jsonb_build_object(
      'moved_page', v_pages[v_moved_index],
      'swapped_page', null
    );
  end if;

  v_target_id := (v_pages[v_target_index] ->> 'id')::uuid;
  v_target_position := (v_pages[v_target_index] ->> 'position')::integer;

  set constraints public.pages_chapter_id_position_unique deferred;

  with desired(page_id, position) as (
    values
      (v_moved_id, v_target_position),
      (v_target_id, v_moved_position)
  ),
  updated as (
    update public.pages as page
    set position = desired.position
    from desired
    where page.id = desired.page_id
      and page.chapter_id = v_locked_chapter_id
    returning
      page.id,
      to_jsonb(page) as page_data
  )
  select
    count(*),
    coalesce(jsonb_object_agg(id, page_data), '{}'::jsonb)
  into v_updated_count, v_updated_pages
  from updated;

  set constraints public.pages_chapter_id_position_unique immediate;

  if v_updated_count <> 2 then
    raise exception using
      errcode = '23514',
      message = 'Não foi possível validar o swap de páginas.';
  end if;

  return jsonb_build_object(
    'moved_page', v_updated_pages -> v_moved_id::text,
    'swapped_page', v_updated_pages -> v_target_id::text
  );
end;
$$;

revoke all on function public.move_workspace_page(uuid, text)
  from public, anon, service_role;

grant execute on function public.move_workspace_page(uuid, text)
  to authenticated;

