# Academia Arcana — Render Deployment

## Canonical status

**Render is the application runtime and production deployment platform.** GitHub provides source control and CI; Supabase provides authentication and persistence; GitHub Container Registry stores the reviewed production image.

## Production image

The Render Web Service consumes the prebuilt image from `ghcr.io/arcana-academy/academiaarcana:main`. The canonical service contract is in `render.yaml`.

| Setting | Canonical value |
|---|---|
| Service type | Web Service |
| Runtime | Prebuilt Docker image |
| Plan and region | Free, Ohio |
| Image source | `ghcr.io/arcana-academy/academiaarcana` |
| Health check | `/api/health` |

The Quality Gate builds the `linux/amd64` image after tests pass. A separate release workflow publishes the exact image artifact only after a successful Quality Gate run on `main`, tagging it with the source commit and `main`. The release job does not check out or build source code.

The image build receives only public Supabase browser configuration and its source revision. Docker ignores local `.env` files. Runtime API keys and OAuth secrets are not available to the build job. Runtime credentials remain in Render's runtime environment or Secret Files and are read through the runtime secret resolver.

The image package must be public for Render to pull it without registry credentials. This matches the public source repository. No paid plan, private registry, or card is required by this delivery design.

## Deployment control

The release workflow publishes images but does not request a production deployment until the repository variable `RENDER_IMAGE_DEPLOY_ENABLED` is set to `true` and the secret `RENDER_DEPLOY_HOOK_URL` is configured. When enabled, the deploy job sends Render the immutable commit-tagged image URL. The smoke workflow then verifies that exact revision, readiness, public routes, CSP, and the integration status contract.

Render image services do not rebuild source on every Git push. Rollback should use a known healthy immutable image tag and be followed by production smoke verification.

## Environment and runtime secret boundary

Secrets are never committed to `render.yaml`.

Public or non-credential configuration includes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_AGENT_MODEL`
- public Honeybadger/browser configuration
- provider base URLs and redirect URIs that are not credentials

Runtime credentials include `OPENAI_API_KEY`, `PARALLEL_API_KEY`, `EXA_API_KEY`, OAuth client secrets, `OUTLOOK_CALENDAR_SESSION_SECRET`, and provider API keys used by server-only integrations. The runtime secret resolver prefers `/etc/secrets/<KEY>` and uses `process.env` as a compatibility fallback for local development, tests, and the migration window.

Do not duplicate a migrated credential in both a Secret File and a normal service environment variable after verification. Issue #536 tracks production secret isolation and its evidence.

## Health and readiness

Render checks `/api/health`, a cheap liveness probe. `/api/ready` verifies the canonical Supabase Auth health endpoint without exposing credentials. Production smoke verifies both after an image deployment.

## Release sequence

```text
GitHub source
  ↓
Quality, security, and E2E gates
  ↓
Build image without runtime secrets
  ↓
Publish immutable image to GHCR
  ↓
Render image deployment (explicitly enabled)
  ↓
Exact-revision production smoke
```

## Prohibited active delivery targets

No other hosting provider or GitHub Pages workflow may be introduced into the active deployment path. Any future platform change must update this contract, the Render Blueprint, CI/smoke workflows, and the corresponding architecture documentation together.
