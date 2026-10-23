-- C64 security regression: UPDATE previously checked owner_id but not the
-- destination folder, allowing a user to MOVE their own object under another
-- user's prefix. Tighten only the WITH CHECK for the existing private bucket.
-- Keep USING unchanged so legitimate owners retain access to their objects.
-- This migration is reviewed/tested only in an isolated branch and local DB.
alter policy "grimoire covers are updatable by owner"
on storage.objects
with check (
  bucket_id = 'grimoire-covers'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
