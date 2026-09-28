insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('grimoire-covers','grimoire-covers',false,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "grimoire covers are readable by owner" on storage.objects for select to authenticated
using (bucket_id='grimoire-covers' and owner_id=(select auth.uid()::text));

create policy "grimoire covers are writable by owner" on storage.objects for insert to authenticated
with check (bucket_id='grimoire-covers' and (storage.foldername(name))[1]=(select auth.uid()::text));

create policy "grimoire covers are updatable by owner" on storage.objects for update to authenticated
using (bucket_id='grimoire-covers' and owner_id=(select auth.uid()::text))
with check (bucket_id='grimoire-covers' and owner_id=(select auth.uid()::text));

create policy "grimoire covers are deletable by owner" on storage.objects for delete to authenticated
using (bucket_id='grimoire-covers' and owner_id=(select auth.uid()::text));