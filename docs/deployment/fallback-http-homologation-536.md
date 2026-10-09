# P0 #536 — Historical HTTP Auth, SSR cookies, RLS and Storage homologation

Status: **isolation-only CI validation**, **NO-GO for production**, 2026-10-09.

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

## Remaining risks and exact release gates

- [ ] Remote ledger **26** applied versions vs **24** source files; educational P1.5 record has `NULL statements`. Need isolated schema-rebuild comparison of full remote ledger and function bodies, not production `migration repair`.
- [ ] Live Feedback `user_id NOT NULL` + `ON DELETE SET NULL` conflicts with source CASCADE. Product/privacy retention decision and independently reviewed forward migration (tested on sterile DB) required.
- [ ] Actual Next.js HTTP endpoints, browser cookies, OAuth redirects, cookie refresh across page loads, account revocation, isolated authenticated E2E using historic application image against nonproduction Supabase: not proven by this direct gateway/SSR adapter test.
- [ ] Private Storage upsert and download behavior across cross-owner accounts: evidence awaited from isolated CI; production policy structures read-only already checked.
- [ ] Render/Supabase public build vars match **currently by owner confirmation**, not a proof of values in historic rendered JS.
- [ ] A second independently pullable OCI manifest digest, enforced retention, independent secure backup and restore drill still absent.
- [ ] Explicit independent approvals for schema migration, merge, registry publication, Render source change and production deployment absent.

**Approval boundary:** NO modifications to hosted Supabase, runtime secrets, current Render Free Git service, Auto Deploy OFF, GHCR packages, PR #584 or protected `main`. #536 remains OPEN / NO-GO.
