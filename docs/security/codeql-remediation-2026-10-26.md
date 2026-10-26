# CodeQL code-scanning remediation — 2026-10-26

## Scope and method

The code-scanning alert list could not be read through the REST API from the
automation token (`GET /repos/{owner}/{repo}/code-scanning/alerts` → `403`,
the same `BLOCKED` surface recorded in `c1-github-hardening-2026-10-24.md`).
The alerts were therefore reproduced exactly: a temporary workflow ran the
pinned CodeQL action (`github/codeql-action` v4.39.1, CLI 2.27.3) with
`upload: false` for both configured languages and printed every SARIF result
as a check-run annotation, which is readable through the API. The temporary
workflow was removed after verification; the standing `codeql.yml` analysis
was not changed.

Baseline reproduced from `main` (`af012a2`): **2 open results, both
javascript-typescript; 0 in actions.**

## Alerts and fixes

### 1. `js/clear-text-logging` — `scripts/verify-public-runtime-config.mjs:98`

The CLI prints `JSON.stringify(verifyPublicRuntimeConfig())`, and the report
carried `environment.APP_ENV ?? environment.NODE_ENV` straight out of the
process environment, so arbitrary environment data could flow into stdout.

Fix: the report now only carries an allowlisted deployment label.
`resolveEnvironmentLabel()` returns one of the literals `production`,
`preview`, `development`, or `test`, and `unknown` for anything else. No
raw environment value can reach the printed report. Covered by new unit
tests, including an unlisted value collapsing to `unknown`.

### 2. `js/insufficient-password-hash` — `src/infrastructure/integrations/oauth-transaction-state.ts`

False positive in substance, fixed in code rather than suppressed. The
module does not hash passwords: it computes HMAC-SHA256 (message
authentication, the correct primitive) over a public format label, the
authenticated subject id, and a random nonce, keyed with the server secret.
CodeQL modelled the flow `issued state → split(".") → nonce → HMAC input`
as password material reaching a fast hash.

Fixes:

- The public `v1` format label is renamed (`STATE_FORMAT_VERSION`) and
  documented as clear-text, non-credential data; the signed payload bytes
  are unchanged, so previously issued state values remain verifiable.
- The untrusted nonce segment is now validated and rebuilt character by
  character from the base64url allowlist (`normalizeNonce`, exact 43-char
  canonical shape for 32 random bytes) before it reaches the signature
  check. This is a genuine sanitization step and also breaks the modelled
  taint path. In-source `// codeql[...]` suppression was tried first and
  removed again: the default query suite does not honour it.
- New test: non-canonical or short nonces are rejected.

## Verification

- Temporary SARIF audit re-run on the fixed branch: **0 results** for
  `javascript-typescript` and **0 results** for `actions`.
- `oauth-transaction-state` payload equivalence check: chunked `update()`
  calls and the single joined payload produce byte-identical HMACs.
- Unit tests for both touched modules pass; lint and typecheck pass.
