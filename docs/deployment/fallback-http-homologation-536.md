# P0 #536 — Historical HTTP Auth, SSR cookies, RLS and Storage homologation

Status: **isolation-only CI validation PASSED on commit `3f1a16b61ff9506e4f0263f0dd83fd4122f97205`**, **NO-GO for production**, 2026-10-09. Document-only changes after this commit require their own exact-head CI results.

## Provenance and scope

Immutable last-LIVE app code `17fb81477fbd3eed14b93103641004a766eb9ac1` checked out in `historical/` with historical package lock, 24 historical SQL migrations and pinned Supabase CLI v2.118.0. New synthetic test `scripts/security/test-local-http-auth-storage-536.mjs` copied from this draft branch into the temporary historical checkout; all *tracked* historical app files remain unchanged. Workflow `.github/workflows/fallback-historical-http-536.yml` uses a GitHub-hosted disposable runner with `supabase start`, creates synthetic accounts and PNGs in the local stack, and uses `supabase stop --no-backup` in `if: always()`.

All test requests are restricted to the default **http://127.0.0.1:54321** local gateway, fail-closed otherwise. The test obtains only the disposable local `ANON_KEY`, **never** the service-role key. No hosted project URL, live Render URL, production user, production bucket, GitHub secret, Docker artifact or registry push is part of the job.

## Exact executable acceptance cases

1. GoTrue Auth HTTP: create **two local synthetic password users A and B**, compare identities and access tokens through `GET /auth/v1/user`, deny unauthenticated user lookup.
2. SSR cookie contract: use the actual historical version-locked `@supabase/ssr` package with the `getAll/setAll` cookie adapter; sign in synthetic A, persist cookie jar, create a separate server client, verify `getClaims` and `getUser`, clear cookies, confirm unauthenticated denial. Only memory-based cookie simulation, not an actual Next.js HTTP route or browser.
3. PostgREST HTTP/RLS: create grimoire per account; read via `GET /rest/v1/grimoires` and verify A sees only A and B sees only B; anonymous has no owned rows; reject owner impersonation on INSERT and cross-user UPDATE.
4. Private Storage HTTP: upload a tiny synthetic **image/png** within each user's UUID folder under `grimoire-covers`; verify A downloads own bytes but B and anonymous cannot download A's image, B cannot upload into A's folder or overwrite A's image; verify A can update/delete own object and B delete own object. The tracked bucket only accepts `image/jpeg/png/webp/avif`, never `text/plain`.
5. Authentication revocation and cookie/redirect unit suites already exist in separate workflows, but this new run does not claim full OAuth identity-provider, browser cookie secure-flag or actual Next.js protected-route validation.

**Evidence gate:** only mark HTTP tests PASS when the run for the exact final HEAD is `completed/success`; otherwise preserve the failure and improve the test within the same draft PR. Do not loosen bucket policies or other security gates merely to make a test pass.

## Privileged function audit (read-only structural findings)

Remote project `fichnalpbcfjywwhixid`: four internal `private` `SECURITY DEFINER` functions observed. Each has fixed empty `search_path` and `anon EXECUTE = false`. The three application helpers for task rewards and educational attempts check `auth.uid()` at some points; the fourth is an insert/update criterion-protection trigger. `public` API wrappers for rewards, page movement and practice attempts are `SECURITY INVOKER`, `anon EXECUTE = false`. These catalog observations do **not** establish that internal authorization branches, dependency functions and permissions are completely safe; perform dedicated independent source review before cutover.

## Executed HTTP evidence and exact observables (verified 2026-10-09)

At reviewed commit `3f1a16b61ff9506e4f0263f0dd83fd4122f97205`, all **12/12 GitHub Actions runs** completed successfully including `Academia Arcana P0 536 Isolated HTTP Auth RLS Storage`, run https://github.com/arcana-academy/academiaarcana/actions/runs/37985594328 (job `114006671210`). Its log contains all **five PASS markers**: synthetic account creation; JWT identity and anonymous rejection; SSR cookie persistence/replay/getClaims/getUser plus rejection without cookie; two-account PostgREST RLS and unauthorized INSERT/UPDATE denial; private Storage upload/read/replace/delete plus cross-account read/write rejection. Disposable Supabase shutdown also completed successfully. All tests used **real local HTTP endpoints**, not mocked PostgREST or SQL-only RLS tests.

The cookie check uses the historical locked `@supabase/ssr` adapter and in-memory `getAll/setAll` cookie transport. It does not measure actual Next.js HTTP Set-Cookie headers, `Secure`, `SameSite`, TLS, browser redirects, or OAuth provider callbacks. No physical fallback OCI image was deployed during this test.

## Privileged function structural security review (read-only production metadata)

- **Internal schema:** four `private.*` `SECURITY DEFINER` functions, all owned by `postgres`, `SET search_path TO ''`; no dynamic `EXECUTE` identified in these four function bodies. `anon EXECUTE=false` on all. Three authenticated callable internal business helpers each initialize identity with `auth.uid()`, reject null users, and constrain target resource records to that owner. A fourth trigger `private.prevent_criterion_item_mutation_after_evidence` blocks mutation after criterion evidence and has no direct `authenticated EXECUTE` privilege. These are *observed code-control properties*; further independent semantic testing and review of all invocation pathways remain necessary.
- **Public-facing wrappers:** four user RPCs are `SECURITY INVOKER`; `anon EXECUTE=false` and `authenticated EXECUTE=true`; these do not independently guarantee business authorization without the internal checks above. `private` schema has USAGE for the `authenticated` database role, so internal functions have a legitimate execution surface to review even where Data API exposure is restricted.
- **Automatic RLS event trigger:** `public.rls_auto_enable()` is `SECURITY DEFINER`, `SET search_path TO 'pg_catalog'`, and its DDL event trigger `ensure_rls` is enabled. It uses formatted dynamic `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for new tables in `public`, but catches failures with `WHEN OTHERS THEN RAISE LOG`, **rather than failing DDL closed**. All 15 current public application tables were RLS-enabled when checked; no current unprotected table was proven. Future DDL review must independently assert RLS and deliberate explicit REST `GRANT` permissions; do not rely solely on automatic protection.
- **Supabase Security Advisor (production metadata only):** the external `auth_leaked_password_protection` advisor reports **WARN: Leaked Password Protection Disabled**. Treat as a separately owner-reviewed security improvement (P1 candidate), not an authorized change to Auth settings. It does not change the NO-GO reasons listed below.
- **Storage catalog:** `grimoire-covers` is private; four `storage.objects` policies require authenticated ownership, and INSERT additionally restricts the first folder path segment to the current user's id. Local HTTP tested these deny/allow flows only with synthetic accounts.

**Review limitations:** structural catalog checks and passing sandbox behavioral tests are not a full third-party penetration test, production RLS proof or a risk-free certification. No production secrets, user rows or private document data were accessed.

## Remaining risks and exact release gates

- [ ] Remote ledger **26** applied versions vs **24** source files; educational P1.5 record has `NULL statements`. Need isolated schema-rebuild comparison of full remote ledger and function bodies, not production `migration repair`.
- [ ] Live Feedback `user_id NOT NULL` + `ON DELETE SET NULL` conflicts with source CASCADE. Product/privacy retention decision and independently reviewed forward migration (tested on sterile DB) required.
- [ ] Actual Next.js HTTP endpoints, browser cookies, OAuth redirects, cookie refresh across page loads, account revocation, isolated authenticated E2E using historic application image against nonproduction Supabase: not proven by this direct gateway/SSR adapter test.
- [x] **Local disposable** private Storage upload/download/replace/delete and cross-user denial: HTTP run `37985594328` PASS. This proves sandbox-only behavior, not remote production Storage access.
- [ ] Render/Supabase public build vars match **currently by owner confirmation**, not a proof of values in historic rendered JS.
- [ ] A second independently pullable OCI manifest digest, enforced retention, independent secure backup and restore drill still absent.
- [ ] Explicit independent approvals for schema migration, merge, registry publication, Render source change and production deployment absent.

**Approval boundary:** NO modifications to hosted Supabase, runtime secrets, current Render Free Git service, Auto Deploy OFF, GHCR packages, PR #584 or protected `main`. #536 remains OPEN / NO-GO.
