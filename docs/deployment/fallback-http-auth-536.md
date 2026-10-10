# P0 #536 — Historical LIVE HTTP Auth, cookie, RLS, Storage homologation

State: **PROPOSED / ISOLATED VALIDATION**, prepared 2026-10-09; no production authorization.

## Experiment boundary and evidence

Workflow `.github/workflows/fallback-historical-http-536.yml` independently checks out the **immutable LIVE app `17fb81477fbd3eed14b93103641004a766eb9ac1`**, then the current exact branch HEAD for only the test harness. The runner builds a *fully disposable local Supabase stack* with database, REST, Auth, and private Storage APIs (`supabase start`), applies the pinned 24 migrations, and installs historical lockfile dependencies without scripts. All network targets in the harness must be HTTP on **127.0.0.1:54321**; it rejects remote host URLs and any preconfigured `SUPABASE_URL` / `SUPABASE_ACCESS_TOKEN` / `SUPABASE_SERVICE_ROLE_KEY` / `DATABASE_URL`. The service-role key is obtained **only from the locally generated Supabase CLI status output in-process**, never persisted or logged, solely for creation of two synthetic confirmed test users. No hosted project access, real user or hosted service-role value is used.

Test harness: `scripts/security/test-historical-supabase-http-536.mjs` in the review branch, copied as an untracked artifact to the temporary historical checkout. It calls real local HTTP Auth endpoints to sign in artificial users A and B, then verifies that `@supabase/ssr` cookies can authenticate a freshly constructed server client using `auth.getUser()` and `auth.getClaims()`. It sends HTTP requests through `supabase-js`/PostgREST against `grimoires` and `feedback_responses` to prove each user's RLS ownership and reject forgery / anonymous read. It exercises the private `grimoire-covers` Storage API for owner upload and download, denial of cross-owner/anonymous reads and spoofed paths, safe owner replacement (upsert requires SELECT+UPDATE+INSERT), then tests logout and session-cookie invalidation.

**Pass must come from the exact HEAD's completed GitHub Actions job and its step logs**, not source review or previous runs. Failures must be registered without claiming success.

## Explicitly not proven

- This tests the historical project's **Supabase client packages and SSR cookie adapter** against a local HTTP backend; it does **NOT** boot or drive an actual Next.js 16 server, Render or an actual browser through full OAuth or signed-in user navigation.
- It does not validate Google/GitHub OAuth providers, redirect allowlists, SameSite/Secure flags in a deployed HTTPS context, cross-origin behavior, password-reset flow, or remote token revocation guarantees.
- It reconstructs the **24 historical repo migrations**, NOT the exact 26 remote-applied SQL ledger; the objective evidence ledger row lacks SQL text and the live Feedback FK differs materially (`SET NULL+NOT NULL` vs versioned `CASCADE`).
- It uses locally issued service-role credentials for **test fixture creation only**; these are never browser-publishable or production credentials.
- It does not produce a second pullable OCI digest, copy GHCR layers, grant retention/delete protection or restore from offline backup.

## Privileged database function review (metadata only)

Connected Supabase production metadata shows four private `SECURITY DEFINER` functions, each has explicit `SET search_path = ''`. Three RPC implementations call `auth.uid()`; a fourth function is a trigger that protects changes to evidence items and has no direct anonymous/authenticated EXECUTE permission. No dynamic `EXECUTE` expression or `raw_user_meta_data` reference was found in the **limited metadata/text scan**. A public `SECURITY DEFINER` function `rls_auto_enable` has `search_path=pg_catalog` and is not directly executable by `anon` or `authenticated`. This is **risk reduction**, not proof of all internal authorization branches, safe schema grants or runtime security. Production security advisor reports **leaked-password protection disabled** (WARN); remediation is an independent auth-configuration change and not approved in this audit. https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Gate / decision matrix

| Gate | Required to close | State |
|---|---|---|
| Historical migration 24/24 + pgTAP | Previous green pinned run | PASS |
| HTTP Auth + SSR cookie bridge | New workflow green | PENDING NEW CI |
| HTTP PostgREST RLS cross-user/anonymous | New workflow green | PENDING NEW CI |
| Private Storage ownership/upsert | New workflow green | PENDING NEW CI |
| Real Next.js+browser HTTPS login/cookie/OAuth | Authorized nonproduction app deployment & users | NOT TESTED |
| 26 migration applied-vs-source equivalence | Reviewed remote-ledger reconstruction (1 missing SQL) | NO-GO |
| Feedback retention and FK repair | Product/privacy decision, approved forward migration | NO-GO |
| Privileged `SECURITY DEFINER` code/role review | Full manual implementation review and sandbox probes | PARTIAL |
| Leaked-password detection | Security owner review and independent change approval | OPEN WARN |
| Docker OCI fallback restore | Second registry digest plus isolated independent backup/recovery drill | NO-GO |
| Render cutover & merge | Explicit, separate human authorization | NOT AUTHORIZED |

Never change Render, production Supabase Auth, database schema, user records, repository main, GHCR or Auto Deploy under this approval.
