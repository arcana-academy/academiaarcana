# Academia Arcana — Render Deployment

## Canonical status

**Render is the application hosting and production deployment platform.** GitHub provides source control and CI; Supabase provides authentication and persistence.

The live Render Web Service currently uses the Git-connected Node runtime on `main`, in Ohio on the Free plan. Its active contract remains in `render.yaml` until the prebuilt-image migration is ready.

## Build isolation migration

The image pipeline is being introduced in two stages so production keeps its existing source while the image is built and published:

1. The Quality Gate builds a `linux/amd64` image after lint, typecheck, unit, accessibility, build, and E2E checks pass. It passes only public Supabase browser configuration and the source revision; local `.env` files are excluded from the Docker context.
2. After a successful Quality Gate run on `main`, a separate workflow publishes that exact image artifact to GHCR. The publishing job does not check out or build repository code. Production deployment remains disabled during this stage.
3. Once the GHCR image exists and is public, migrate the existing Render service to the immutable commit-tagged image while preserving its runtime environment and Secret Files.
4. Update `render.yaml` to the image runtime and enable the deploy hook only after the Render service is confirmed healthy on the image.

The Render deploy workflow requires `RENDER_IMAGE_DEPLOY_ENABLED=true` and the `RENDER_DEPLOY_HOOK_URL` secret. The secret is used only by the deploy job. The exact-revision smoke workflow verifies liveness, readiness, public routes, CSP, and integration status after a requested image deployment.

The GHCR package must be public for Render Free to pull it without registry credentials. The package contains the public application's image, built from the already public source. This design uses the existing Free service and public-repository GitHub Actions; no paid plan is required.

## Runtime secret boundary

Secrets are never committed to `render.yaml`.

The image build receives public `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values and its source revision. Runtime credentials such as `OPENAI_API_KEY`, `PARALLEL_API_KEY`, `EXA_API_KEY`, OAuth client secrets, `OUTLOOK_CALENDAR_SESSION_SECRET`, and server-only provider keys are not available to the build job.

Runtime credentials remain in Render's runtime environment or Secret Files and are read through the runtime secret resolver, which prefers `/etc/secrets/<KEY>` and uses `process.env` as a compatibility fallback for local development, tests, and the migration window. Do not duplicate a migrated credential in both a Secret File and a normal environment variable after verification. Issue #536 tracks the production isolation evidence.

## Health and rollback

Render checks `/api/health`, a cheap liveness probe. `/api/ready` verifies the canonical Supabase Auth health endpoint without exposing credentials. Production smoke verifies both after an image deployment.

Rollback should target a known healthy immutable image tag and be followed by production smoke verification. A failed deploy must not replace a healthy running deployment.

## Prohibited active delivery targets

No other hosting provider or GitHub Pages workflow may be introduced into the active deployment path. Any future platform change must update this contract, the Render Blueprint, CI/smoke workflows, and the corresponding architecture documentation together.
