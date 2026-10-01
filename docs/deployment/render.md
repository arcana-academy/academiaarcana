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

Render's current documentation supports Next.js applications with server-side rendering and API routes as Node.js Web Services using a production start command. The repository follows that model rather than a static export.

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

## Health

Render checks `/api/health`. A successful 2xx/3xx response is sufficient for an HTTP health check.

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

Render should deploy only after the repository CI checks pass. Render supports an "After CI Checks Pass" auto-deploy mode for connected Git repositories.

## Recovery

A failed Render deploy does not replace a healthy running deployment. The release remains on the most recent successful deployment until the new version is healthy. Rollback uses a known healthy Render deployment and is followed by smoke verification.

## Prohibited active delivery targets

No other hosting provider or GitHub Pages workflow may be introduced into the active deployment path.

Any future platform change must first modify this contract, the Render Blueprint, CI/smoke workflows and the corresponding architecture documentation in the same change.
