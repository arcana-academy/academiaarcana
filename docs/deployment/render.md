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
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check | `/api/health` |
| Auto-deploy | After CI checks pass |
| Source | GitHub `arcana-academy/academiaarcana` |

## Environment

Secrets are never committed to `render.yaml`.

The Blueprint declares environment keys that must be supplied by the Render environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY`
- optional `OPENAI_AGENT_MODEL`
- optional Honeybadger variables
- other provider credentials required by enabled integrations

Secret placeholders use Render's `sync: false` pattern so values remain managed outside Git.

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
