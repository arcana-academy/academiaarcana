-- Learning synchronization foundation.
-- RLS is enabled by default for every protected table.

create table if not exists public.learning_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  vault_id uuid,
  title text not null,
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.learning_documents(id) on delete cascade,
  version integer not null,
  content text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  change_summary text,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  unique(document_id, version)
);

create table if not exists public.learning_sync_queue (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.learning_documents(id) on delete cascade,
  device_id text not null,
  operation text not null check (operation in ('upsert','delete','restore')),
  version integer not null,
  payload jsonb not null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_vaults (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_vault_members (
  vault_id uuid not null references public.learning_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  joined_at timestamptz not null default now(),
  primary key(vault_id, user_id)
);

create index if not exists learning_documents_owner_idx on public.learning_documents(owner_id);
create index if not exists learning_documents_vault_idx on public.learning_documents(vault_id);
create index if not exists learning_versions_document_idx on public.learning_document_versions(document_id, version desc);
create index if not exists learning_sync_queue_pending_idx on public.learning_sync_queue(acknowledged_at, created_at);

alter table public.learning_documents enable row level security;
alter table public.learning_document_versions enable row level security;
alter table public.learning_sync_queue enable row level security;
alter table public.learning_vaults enable row level security;
alter table public.learning_vault_members enable row level security;

create or replace function public.can_access_learning_vault(target_vault_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.learning_vault_members
    where vault_id = target_vault_id and user_id = auth.uid()
  );
$$;

create policy "documents owner or vault member read"
on public.learning_documents for select
using (owner_id = auth.uid() or (vault_id is not null and public.can_access_learning_vault(vault_id)));

create policy "documents owner or editor write"
on public.learning_documents for insert
with check (owner_id = auth.uid());

create policy "documents owner or editor update"
on public.learning_documents for update
using (
  owner_id = auth.uid()
  or (vault_id is not null and exists (
    select 1 from public.learning_vault_members m
    where m.vault_id = learning_documents.vault_id and m.user_id = auth.uid() and m.role in ('owner','editor')
  ))
)
with check (owner_id = auth.uid() or vault_id is not null);

create policy "versions follow document access"
on public.learning_document_versions for select
using (exists (
  select 1 from public.learning_documents d
  where d.id = document_id and (d.owner_id = auth.uid() or (d.vault_id is not null and public.can_access_learning_vault(d.vault_id)))
));

create policy "versions can be created by document owner or editor"
on public.learning_document_versions for insert
with check (exists (
  select 1 from public.learning_documents d
  where d.id = document_id and (d.owner_id = auth.uid() or (d.vault_id is not null and exists (
    select 1 from public.learning_vault_members m where m.vault_id = d.vault_id and m.user_id = auth.uid() and m.role in ('owner','editor')
  )))
));

create policy "queue owner access"
on public.learning_sync_queue for all
using (exists (
  select 1 from public.learning_documents d where d.id = document_id and (d.owner_id = auth.uid() or public.can_access_learning_vault(d.vault_id))
))
with check (exists (
  select 1 from public.learning_documents d where d.id = document_id and (d.owner_id = auth.uid() or public.can_access_learning_vault(d.vault_id))
));

create policy "vault member read"
on public.learning_vaults for select
using (owner_id = auth.uid() or public.can_access_learning_vault(id));

create policy "vault owner create"
on public.learning_vaults for insert
with check (owner_id = auth.uid());

create policy "vault owner update"
on public.learning_vaults for update
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "vault member read"
on public.learning_vault_members for select
using (user_id = auth.uid() or public.can_access_learning_vault(vault_id));

create policy "vault owner manage members"
on public.learning_vault_members for all
using (exists (select 1 from public.learning_vaults v where v.id = vault_id and v.owner_id = auth.uid()))
with check (exists (select 1 from public.learning_vaults v where v.id = vault_id and v.owner_id = auth.uid()));
