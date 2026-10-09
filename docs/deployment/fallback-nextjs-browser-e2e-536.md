# P0 #536 — Consolidated historical Next.js browser E2E (production-mode binary, disposable local Supabase)

**Status: validation on new PR HEAD pending. NO-GO for production. Date: 2026-10-09.**

## One canonical CI workflow, no redundant development-mode job

Primary isolated browser workflow: `.github/workflows/fallback-historical-nextjs-e2e-536.yml`. The previous experimental DEV-mode runner `fallback-historical-next-e2e-536.yml` and `test-local-nextjs-browser-536.mjs` were **removed** to avoid duplicate CI and an unrepresentative Turbopack/webpack development-server startup failure. The canonical E2E harness is now `scripts/security/test-local-nextjs-browser-e2e-536.mjs`.

The canonical workflow checks out **immutable last-LIVE app** `17fb81477fbd3eed14b93103641004a766eb9ac1` separately from PR branch tests, copies only an untracked browser harness, installs historical lockfile dependencies and pinned Supabase CLI v2.118.0, starts a fully disposable Supabase local stack, and builds/serves **actual Next.js 16 in production mode** on `127.0.0.1:3100` against **local** `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and local `ANON_KEY`.

**Sandbox-only build guard exception:** The Next build is invoked as `./node_modules/.bin/next build --webpack` directly because the application's original production prebuild validator *correctly* requires an HTTPS Supabase URL and a production-format `sb_publishable_*` key; this controlled disposable test uses an HTTP localhost URL and a local legacy anon key. **The original application config and production build guard remain unchanged.** The sandbox green result does not validate production public HTTPS config, the Render historical image or cloud Auth credentials.

**CSP limitation:** The historical CSP allows `connect-src 'self' https: wss:` and therefore cannot authorize a separate localhost Supabase API on HTTP port 54321. The browser contexts use `bypassCSP: true` **in this disposable test only**; the app CSP code and its HTTP response header are unchanged. This test does **not** prove CSP enforcement, `Secure/SameSite` behavior over TLS, real third-party OAuth, or compatibility with the hosted Supabase.

## Executable acceptance scenarios

1. Two randomly generated `@example.test` accounts A/B and each account's synthetic grimoire seeded via local Supabase auth and RLS.
2. Chromium guest can fetch the genuine Next `/login` route (200 with CSP header), but is redirected by protected `/academia` to `/login`.
3. Two isolated Chromium contexts submit the **real historical Next.js login form** and reach authenticated `/santuario`, load `/academia` and hold distinct browser auth cookies.
4. Server-rendered `/grimorios` includes A's own title but excludes B for A, and vice versa for B; **reloading A** must preserve the authenticated SSR identity and exclude B.
5. Real local private Storage HTTP requests from browser-context request clients: own owner-scoped PNG download allowed, cross-owner and anonymous reads denied; synthetic local storage object cleaned up.
6. **Actual Next.js server action `Sair`** signs A out, redirects to `/login`, denies reentry to `/academia`; B's independent browser session still accesses its own grimoire.
7. Teardown `supabase stop --no-backup` is in `if:always()`, and no hosted URLs, production user data, GHCR registry operations or Render hooks are used.

## Evidence classification and safe gate

The earlier canonical workflow run `37995796957` was **successful** at historical-only source SHA on PR head `f5cd5d8c8544ad213335beddeaad0af3277839d8`; it covered the base browser login/HTTP/RLS/Storage and clearing cookies, but not the newly added reload and real sign-out test. The **new exact PR HEAD must separately pass this expanded workflow**, standard Quality Gates and relevant external statuses. Never inherit green from a previous HEAD.

A development-mode duplicate initially failed on configuration mismatch `Turbopack` vs Webpack before authentication, was corrected to `next dev --webpack`, but later failed waiting for redirect. Because the production-mode test independently succeeded and is more representative of release execution, the experimental redundant runner was removed rather than weakening the production-mode auth contract. No conclusion about real Render failure follows from the discarded DEV harness.

## External NO-GO boundaries

- Live Supabase schema ledger has 26 records while versioned source has 24 migration files; one P1.5 record lacks SQL text, and Feedback `user_id NOT NULL` with `ON DELETE SET NULL` contradicts source CASCADE.
- No owner-approved retention policy, hosted auth/RLS/Storage cross-account session test in authorized nonproduction project or production HTTPS/CSP behavior demonstrated.
- No persistent alternate GHCR OCI manifest digest, independent archive or restore drill; no signed release/rollback authorization.
- Current Render Free stays Git-backed, Auto Deploy OFF, with LIVE historic source pinned; PR #585 stays DRAFT and P0 #536 remains OPEN/NO-GO.

