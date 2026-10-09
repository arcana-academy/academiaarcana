# P0 #536 — Historical Next.js browser E2E in a disposable local environment

State: VALIDATION PENDING at creation, no production release authorization. Date: 2026-10-09.

The workflow checks out immutable last-LIVE source 17fb81477fbd3eed14b93103641004a766eb9ac1 and copies ONLY one untracked synthetic browser test. It starts a disposable Supabase on 127.0.0.1:54321, builds Next.js from historical source and starts the real application on 127.0.0.1:3100. It uses the temporary local anonymous/public key, no cloud project access token, hosted database, service role, Render secrets, deploy or registry publishing. The workflow runs exclusively on the draft validation branch with contents:read.

The production prebuild verifier correctly rejects localhost HTTP URLs and the local legacy anonymous JWT key. The sandbox intentionally executes the Next binary directly to build only a NON-RELEASE local test application; the production prebuild verifier is preserved and independently exercised by regular Quality Gate. The Chromium test bypasses CSP *only in isolated browser contexts* because the preserved app CSP disallows cross-port localhost HTTP; it separately checks that the real HTTP response retains its unchanged CSP header. **This does not test production CSP enforcement or HTTPS Secure/SameSite cookie behavior.**

Acceptance: two synthetic GoTrue users, their own RLS-constrained grimoires, the real AuthForm UI, genuine Next.js HTTP redirects for unauthenticated routes, authenticated server-side pages and cookie transport, non-disclosure of another user's grimoire in Next SSR, Playwright-context local Storage HTTP authorization for a synthetic PNG, and cookie revocation for A without impacting B.

If tests fail, investigate without relaxing protected routes or RLS. No production auth, OAuth external provider, actual Render Next.js service, public-domain TLS cookies, remotely applied 26-migration history, or OCI recovery is tested.

P0 #536 remains NO-GO until the Feedback FK retention decision, migration ledger parity, HTTPS/SSO integration evidence and second recoverable OCI digest are separately approved and verified. Do not merge PR #585, deploy, publish, or change Auto Deploy.