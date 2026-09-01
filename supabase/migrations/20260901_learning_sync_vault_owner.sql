create or replace function public.add_learning_vault_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.learning_vault_members(vault_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists learning_vault_owner_membership on public.learning_vaults;
create trigger learning_vault_owner_membership
after insert on public.learning_vaults
for each row execute function public.add_learning_vault_owner();
