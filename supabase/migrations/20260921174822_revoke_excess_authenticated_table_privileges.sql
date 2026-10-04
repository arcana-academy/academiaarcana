-- Phase 2 security hardening: minimize Data API table privileges.
-- RLS policies remain unchanged; authenticated users retain only CRUD privileges.

REVOKE TRUNCATE, TRIGGER, REFERENCES
ON TABLE public.grimoires, public.notebooks, public.chapters, public.pages
FROM authenticated;
