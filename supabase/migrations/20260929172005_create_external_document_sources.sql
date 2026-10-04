create table public.external_document_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null,
  source_type text not null default 'external_document'
    check (source_type = 'external_document'),
  site_id text not null,
  drive_id text not null,
  item_id text not null,
  name text,
  mime_type text,
  web_url text,
  last_modified_at timestamptz,
  size_bytes bigint,
  status text not null default 'active'
    check (status in ('active', 'stale', 'revoked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, provider_id, site_id, drive_id, item_id)
);

create index idx_external_document_sources_owner_id
  on public.external_document_sources (owner_id);

create index idx_external_document_sources_provider
  on public.external_document_sources (owner_id, provider_id);

alter table public.external_document_sources enable row level security;

create policy "Users can view their external document sources"
  on public.external_document_sources
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can create their external document sources"
  on public.external_document_sources
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Users can update their external document sources"
  on public.external_document_sources
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users can delete their external document sources"
  on public.external_document_sources
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.external_document_sources from anon;
grant select, insert, update, delete on public.external_document_sources to authenticated;
