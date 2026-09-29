-- Per-user encrypted OAuth credentials for external integrations.
-- Token plaintext is encrypted by the application before persistence.

create table public.integration_credentials (
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null check (length(trim(provider_id)) > 0),
  access_token_ciphertext text not null,
  refresh_token_ciphertext text not null,
  access_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, provider_id)
);

alter table public.integration_credentials enable row level security;

create policy "integration_credentials_select_own"
  on public.integration_credentials
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "integration_credentials_insert_own"
  on public.integration_credentials
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "integration_credentials_update_own"
  on public.integration_credentials
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "integration_credentials_delete_own"
  on public.integration_credentials
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.integration_credentials from anon, authenticated;
grant select, insert, update, delete on public.integration_credentials to authenticated;
