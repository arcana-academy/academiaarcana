# P0 #536 — Historical Next.js browser end-to-end, disposable CI only

**State: proposed and pending new exact-HEAD CI proof (2026-10-09). NO-GO for production.**

## Intent and immutability

A pinned checkout of the **last LIVE Render source**, `17fb81477fbd3eed14b93103641004a766eb9ac1`, is not modified at tracked paths. This PR adds only a separate browser E2E harness copied into the historical checkout at runtime and a one-branch GitHub Actions workflow, `.github/workflows/fallback-historical-next-e2e-536.yml`.

The GitHub runner installs historical lockfile dependencies and pinned Supabase CLI, starts a disposable **local** full Supabase stack (`supabase start`) and boots actual **Next.js 16 in development mode** on `127.0.0.1:3000`. The application gets **local** `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and the local legacy `ANON_KEY` in process memory; it deliberately does *not* call the production prebuild validator because this validator correctly rejects an HTTP local URL. No historical source file or existing production deployment guard is changed. This test is **not equivalent to a production-mode Next.js build**, which must continue to use HTTPS Supabase public project configuration. The existing separate historical Docker build/smoke workflow covers production packaging but not authenticated browser interactions.

No GitHub secrets, production project URL, hosted credentials, remote database, registry push, Render deploy hook, GHCR artifact, human account or personally identifiable user data are used. Accounts/files are synthetically generated and thrown away using `supabase stop --no-backup`. Each HTTP browser request is limited to `http://127.0.0.1:{3000,54321}`; any off-host request is blocked in Chromium. The runner uses only `contents:read`.

## Executable browser and HTTP assertions

1. **Real historical Next.js process:** `/api/health` on loopback returns the immutable last-LIVE revision; fail if Next.js cannot start.
2. **No-session redirect:** anonymous Chromium context navigating `/grimorios` is redirected to `/login`, with no user data.
3. **Real login UI:** separate Chromium browser contexts A and B log in using the historical `AuthForm` email/password form against the local Supabase Auth service; they reach the authenticated sanctuary.
4. **Actual browser cookie and SSR boundary:** both browser contexts have distinct `sb-*` auth cookies, and the historical `/grimorios` server-rendered route displays only each account's own synthetic grimoire. Reloading preserves A's session while preventing either account from seeing the other's owned grimoire.
5. **Private Storage at same account identities:** local HTTP/SDK upload + download in own UUID folder works; cross-account download, cross-owner upload and anonymous download are denied by bucket rules. This storage check exercises *real local Storage service* with the same accounts, but not a Next.js file upload UI (none assumed).
6. **Server-action sign-out and revocation:** historical `Sair` server action sends A to login and subsequent protected navigation is denied; context B remains authenticated.
7. **Non-authorized effects:** no remote database, no alteration of the true Render runtime, no deployment or image publication. Tests use generated email `@example.test`, random password and 1×1 PNG only.

## Acceptance and limitations

Treat as PASS **only** when the new workflow run and final checks for the exact PR HEAD show `completed/success`; otherwise record failures and improve the test without weakening actual auth/RLS policies.

Passing means the **historical Next.js development server**, Chromium UI login, real SSR route cookies, separate users, local PostgREST/Storage and server-side logout work together under disposable local Supabase. It **does not prove** OAuth provider callbacks, HTTPS cookie flags, real Render production routes, production mode build of historical Next.js against local HTTP, a schema-equivalent replay of the 26 remote-applied migrations, a resolved live Feedback FK, an OCI digest, persistent fallback or recoverability.

External release gates remain independent: reconcile migration history (including applied entry with NULL SQL), ratify Feedback data retention, production-mode/built-image real nonproduction compatibility, independently recoverable OCI backup/restore, and explicit human production authorization. **P0 #536 stays OPEN / NO-GO, PR #585 stays DRAFT, Render auto-deploy OFF.**
