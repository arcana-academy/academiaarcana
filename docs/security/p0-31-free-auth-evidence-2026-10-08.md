# P0 #31 — Auth Free-first: implementation and evidence (2026-10-08)

## Invariants
- Supabase project: `fichnalpbcfjywwhixid`, organization plan: **Free**.
- **No upgrade, billing change, paid add-on, or purchase.**
- Do not modify `auth.users`, real user sessions, production credentials, or production data for a test.
- Keep blocking security issues separate from plan limitations. Do not close #31 or #268 without evidence.

## Code remediation in this branch
- Logout calls `supabase.auth.signOut({ scope: "global" })` explicitly.
- If Supabase returns `{ error }`, propagate it; **do not redirect to /login while the revocation call reports failure**.
- Unit tests cover success, an error returned in the result, and a rejected Promise.
- This code-level fix **is not evidence that sessions on other devices have been revoked**.
- Existing `supabase/tests/database/authorization_rls_p0.test.sql` uses synthetic identities and a rolled-back transaction, with 48 pgTAP assertions; `friend_request_insert_rls.test.sql` checks pending-only friend requests. These run in local Supabase in GitHub's `database-tests.yml` workflow; they must not be executed against production.

## Provider-side Auth settings — not readable/writable through the connected Supabase operations
Administrative operator should inspect the project dashboard while keeping Free:
1. Authentication > Providers > Email: check whether email confirmation is required, minimum password length, provider-side character requirements, and password change/reauthentication controls. Save screenshots or sanitized settings without tokens or personal information.
2. Authentication > URL Configuration: verify site URL and redirect allowlist; do not use wildcard domains in production without justification.
3. Authentication > Rate Limits: inspect actual limits on sign-in, signup, OTP/email, password recovery, and verification. Record numerical settings with timestamp.
4. Authentication > Bot and Abuse Protection: evaluate Cloudflare Turnstile (free tier) or hCaptcha **only after the front end passes `captchaToken` for affected flows**. Enabling provider CAPTCHA before client integration may interrupt login, signup, and recovery.
5. Evaluate TOTP MFA, especially for privileged users, and confirm recovery procedures before rollout.
6. `auth_leaked_password_protection` is Pro+ and **remains disabled** in Free. Keep as explicit commercial exception, not a fixed finding.

References:
- https://supabase.com/docs/guides/auth/password-security
- https://supabase.com/docs/guides/auth/auth-captcha
- https://supabase.com/docs/guides/auth/signout

## Controlled cross-account authorization test (non-production)
1. Run the existing database-tests GitHub workflow for this PR (Supabase local ephemeral database, no real users).
2. Verify pgTAP assertions for anonymous denial, account A versus account B owner isolation, cross-account read/write denial, friend request forgery and recipient-only update.
3. Capture workflow URL, commit SHA, test counts, failure/success and timestamp. A green workflow confirms the local schema at that commit only; it is not proof of end-to-end production authorization.

## Global revocation exercise (not yet executed)
Prerequisite: **two specifically designated test accounts**, with the *same test account* signed in from two isolated browsers for revocation, plus a different test account for ownership. Use a separate environment or safely designated test setup, not any current production user's login. Never use ordinary users to substitute test identities.

1. Log in test account A on browsers 1 and 2, record sanitized session identifiers (not tokens).
2. Log in account B separately to verify it is not affected.
3. Invoke global sign-out for account A from browser 1 and record server result and timestamp.
4. From browser 2 attempt refresh: it must fail once the refresh token is revoked; separately record how long an already issued access token remains accepted until its `exp`.
5. Check that account B remains signed in, and that A cannot read or mutate B-owned data.
6. Store sanitized request/response status and timestamps, environment, test account provenance, and cleanup evidence.
7. If an assertion fails, record the finding, do not claim revocation complete, and avoid disrupting any real session.

## Status at this checkpoint
- Verified statically: production project `ACTIVE_HEALTHY`, public tables 15/15 RLS, no anonymous direct read/insert grants observed, private image bucket, and only leaked-password protection WARN in Security Advisor.
- Implemented in branch: **global sign-out error handling**, pending CI.
- Not yet verified: actual provider-side Auth switches, dynamic two-account production isolation, multi-browser sign-out, CAPTCHA integration, TOTP enrollment, provider-side password policy.
- Operational backup/restore, rollback, RTO/RPO, incident response and recovery remain in #268.
