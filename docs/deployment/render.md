# Academia Arcana — Render Deployment

## Canonical status

**Render is the only application hosting and deployment platform.**

GitHub provides source control and CI. Supabase provides authentication and persistence. Render provides the application runtime and production deployment.

## Render Web Service

The repository is prepared for a Render Web Service using the versioned `render.yaml` contract.

| Setting | Canonical value |
|---|---|
| Service type | Web Service |
| Runtime | Node.js |
| Branch | `main` |
| Build command | `node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts && npm rebuild esbuild unrs-resolver --ignore-scripts=false && npm run build` |
| Start command | `npm start` |
| Health check | `/api/health` |
| Auto-deploy | After CI checks pass |
| Source | GitHub `arcana-academy/academiaarcana` |

## Environment and runtime secret boundary

Secrets are never committed to `render.yaml`.

Public or build-time configuration may remain as normal Render environment variables, including:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_AGENT_MODEL`
- public Honeybadger/browser configuration
- provider base URLs and redirect URIs that are not credentials

Runtime credentials must not remain in the service's normal Environment Variables once the runtime-only migration is complete, because normal service environment variables are available during the build.

The application runtime secret resolver prefers files at:

`/etc/secrets/<KEY>`

and uses `process.env` only as a compatibility fallback for local development, tests and the migration window.

Examples of credentials intended for runtime-only Secret Files include:

- `OPENAI_API_KEY`
- `PARALLEL_API_KEY`
- `EXA_API_KEY`
- OAuth client secrets
- `OUTLOOK_CALENDAR_SESSION_SECRET`
- Dropbox/Airtable/DataCamp access credentials
- provider API keys used by server-only integrations

Render Secret Files should use the exact environment-style key as the filename, for example `/etc/secrets/OPENAI_API_KEY`.

Do not duplicate a migrated secret in both a Secret File and a normal service environment variable after verification. The normal environment variable must be removed so build-time dependency code cannot read the runtime credential.

Issue #536 tracks the production migration and evidence required before the build/runtime secret-isolation P0 can be closed.

## Health and readiness

Render checks `/api/health`, which is intentionally a cheap liveness probe. Render considers an HTTP health check successful for a 2xx or 3xx response.

The application also exposes `/api/ready` as the deep readiness contract. It verifies access to the canonical Supabase Auth health endpoint without exposing credentials. Production smoke tests verify both endpoints after release.

## Release sequence

```text
GitHub
  ↓
Quality / Security Gates
  ↓
Merge to main
  ↓
Render
  ↓
Health / smoke verification
  ↓
Production
```

Render should deploy only after repository CI checks pass.

## Recovery

A failed Render deploy does not replace a healthy running deployment. Rollback must target a known healthy deployment and be followed by smoke verification.

## Prohibited active delivery targets

No other hosting provider or GitHub Pages workflow may be introduced into the active deployment path.

Any future platform change must first modify this contract, the Render Blueprint, CI/smoke workflows and the corresponding architecture documentation in the same change.
