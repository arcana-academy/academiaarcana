# Academia Arcana — Authentication Contract

## Status
Current authentication contract for the Next.js + Supabase implementation.
Provider-side settings that are not versioned in GitHub remain external configuration and must be verified separately.

## 1. Components
| Layer | Component | Responsibility |
| --- | --- | --- |
| UI | `src/components/auth/AuthForm.tsx` | Collects email/password and invokes Supabase Auth from the browser |
| Browser adapter | `src/infrastructure/supabase/browser.ts` | Creates the browser Supabase client with the public URL and publishable key |
| Server adapter | `src/infrastructure/supabase/server.ts` | Creates the server Supabase client and connects it to Next.js cookies |
| Session proxy | `proxy.ts` + `src/infrastructure/supabase/session.ts` | Synchronizes the Supabase session with request/response cookies and refreshes claims |
| Auth guard | `src/lib/auth/require-authenticated-user.ts` | Verifies authenticated claims server-side and redirects unauthenticated requests |
| Callback | `src/app/auth/callback/route.ts` | Exchanges a one-time authorization code for a session and allows only same-origin relative destinations |
| Server actions | `src/app/workspace/actions.ts` | Require authenticated claims before mutations |
| Identity adapter | `src/lib/identity/resolve-subject-id-server.ts` | Resolves the authenticated subject from verified claims |
| Database | Supabase Auth + Postgres RLS | Authenticates identities and enforces ownership at the data boundary |

## 2. Runtime configuration
The application reads only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for its Supabase client configuration.

They are intentionally public runtime configuration. The repository does not use `SUPABASE_SERVICE_ROLE_KEY` in application code. The publishable key is not an administrative credential; authorization is enforced by the authenticated session and Postgres RLS.

No password, access token, refresh token, database password, or service-role secret is stored in `.env.example`.

## 3. Login flow
```text
Browser
  | email + password
  v
AuthForm
  | supabase.auth.signInWithPassword(...)
  v
Supabase Auth
  | authenticated session
  v
Supabase SSR cookie/session state
  |
  v
Next.js protected route
  | createServerClient() + auth.getClaims()
  v
requireAuthenticatedUser()
  | claims.sub
  v
Application / repository
  |
  v
Supabase Postgres + RLS
```

The browser submits the password to Supabase Auth through the Supabase client. The application does not persist or log the password.

## 4. Signup and recovery
`AuthForm` uses Supabase Auth for signup, email confirmation, password recovery, and password update. The application does not implement its own password store.

Password recovery deliberately returns a generic success message so the form does not enumerate accounts.

## 5. Callback and code exchange
The callback receives a short-lived authorization `code`. A missing `code` is rejected. For the optional `next` destination, invalid values—including absolute URLs, protocol-relative paths such as `//evil.example`, malformed input, and destinations whose resolved origin differs from the application origin—are normalized to `/` before the callback continues.

Only after that destination normalization does the server call `supabase.auth.exchangeCodeForSession(code)`. Failed code exchanges redirect to `/login?error=auth`.

## 6. Session and token handling
The repository delegates session and token lifecycle to `@supabase/ssr` and Supabase Auth.

- Browser: `createBrowserClient()` uses the public project URL and publishable key.
- Server: `createServerClient()` reads the Supabase session through Next.js cookies.
- Proxy: `proxy.ts` invokes `updateSupabaseSession()`, which reads request cookies, calls `auth.getClaims()`, propagates cookie changes, and marks the response `Cache-Control: private, no-store`.
- The application does not manually parse, sign, persist, rotate, or log JWTs.

## 7. Authorization boundary
Authentication is not treated as authorization.

```text
request
  -> authenticated claims
  -> subject id (claims.sub)
  -> application operation
  -> Supabase query
  -> PostgreSQL RLS
  -> owner/context validation
```

Workspace RLS uses `auth.uid()` to enforce ownership through the hierarchy Grimoire → Notebook → Chapter → Page.

## 8. Server-side mutation contract
Workspace Server Actions call `requireAuthenticatedUser()` before accessing repositories. Client-supplied IDs are not trusted as proof of ownership; RLS remains the database-level authorization boundary.

## 9. Logout (P1 remote-first candidate — branch only)
The previous global sign-out action used \`supabase.auth.signOut({ scope: "global" })\`; auth-js 2.117.2 removes SSR session storage even after some remote errors.

The isolated P1 candidate uses a server-only \`supabase.auth.admin.signOut(accessToken, "global")\` call with the current request's access token. This call performs the remote revocation without local storage side effects. Only once the provider confirms success does a separate SSR cookie-expiration helper run. It uses the public \`clearAuthCookiesAtScopes\` helper from @supabase/ssr 0.12.7, with the same storage key as the server/proxy clients.

- No password, service-role credential, JWT, or refresh token is provided by the form or logged.
- Remote error: retain available credentials and display a safe retry state. Timeouts may have succeeded on the provider, so they are classified as indeterminate.
- Remote success followed by cookie-expiration failure: do not claim local sign-out success; provide an explicit local-only recovery action, never a second remote revocation inferred from client-provided state.
- The user can independently choose to leave only the current device, explicitly acknowledging that other sessions may remain active.
- \`redirect("/login")\` runs only after cookie expiration reports no server-side errors.
- Access JWTs from revoked sessions may remain valid until their expiry (\`exp\`).
- E2E validation with a real browser is required before merge: emitted cookie writes are not proof of browser application, and concurrent refresh responses might reintroduce stale cookies.
- The helper is documented upstream primarily for cookie-scope migrations, so its routine-logout use is conditional on integration and browser E2E verification.

This candidate is NOT approved for production until the P1 acceptance checklist and hosted QA gates are satisfied.

## 10. Credential and secret invariants
1. Never introduce `SUPABASE_SERVICE_ROLE_KEY` into browser code.
2. Never put database passwords or service-role secrets in `NEXT_PUBLIC_*` variables.
3. Never log passwords, access tokens, refresh tokens, authorization codes, or cookies.
4. Never persist passwords in application tables.
5. Never use authentication as a substitute for RLS/ownership checks.
6. Never accept an arbitrary external callback destination.
7. Never return provider error text directly when it can disclose authentication-sensitive information.
8. Keep provider credentials in environment/provider configuration rather than source control.

## 11. External provider checks
The repository cannot by itself prove the target Supabase environment's email-confirmation setting, leaked-password protection, abuse/rate-limit settings, production redirect allow-list, production environment variables, or operational Auth backup/restore capability.

Those are external configuration/evidence items and must not be marked verified from source code alone.

## 12. Validation
Authentication changes must pass typecheck, lint, unit/component tests, accessibility tests, production build, callback redirect safety tests, and E2E tests when dedicated non-production authentication credentials are available. Ownership-sensitive operations must also pass database/RLS tests.

Static builds and repository unit tests must not require production secrets.