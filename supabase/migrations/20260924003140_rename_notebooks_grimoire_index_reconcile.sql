-- Reconcile the historical index name after the live database was already
-- in the renamed state while the migration history was missing the step.
DO $$
BEGIN
  IF to_regclass('public.idx_notebooks_grimoires_id') IS NOT NULL
     AND to_regclass('public.idx_notebooks_grimoire_id') IS NOT NULL THEN
    RAISE EXCEPTION
      'Ambiguous index state: both idx_notebooks_grimoires_id and idx_notebooks_grimoire_id exist';
  ELSIF to_regclass('public.idx_notebooks_grimoires_id') IS NOT NULL THEN
    ALTER INDEX public.idx_notebooks_grimoires_id
      RENAME TO idx_notebooks_grimoire_id;
  ELSIF to_regclass('public.idx_notebooks_grimoire_id') IS NULL THEN
    RAISE EXCEPTION
      'Expected either idx_notebooks_grimoires_id or idx_notebooks_grimoire_id';
  END IF;
END
$$;
