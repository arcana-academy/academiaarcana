# Academia Arcana — Render Deployment

## Canonical status

**Render is the application hosting and production deployment platform.** GitHub provides source control and CI; Supabase provides authentication and persistence.

The live Render Web Service currently uses the Git-connected Node runtime on `main`, in Ohio on the Free plan. Its active contract remains in `render.yaml` until the prebuilt-image migration is ready.

## Build isolation migration

The image pipeline is being introduced in two stages so production keeps its existing source while the image is built and published:

1. The Quality Gate builds a `linux/amd64` image after lint, typecheck, unit, accessibility, build, and E2E checks pass. It passes only public Supabase browser configuration and the source revision; local `.env` files are excluded from the Docker context.
2. After a successful Quality Gate triggered by a `push` to `main` in the official repository, a separate workflow publishes that exact image artifact to GHCR. Pull-request and fork-originated workflow artifacts cannot activate the privileged publisher. The publishing job does not check out or build repository code. Image deployment remains disabled during this stage.
3. Once the GHCR image exists and is public, migrate the existing Render service to the verified SHA256 image digest while preserving its runtime environment and Secret Files. Each publication uses a unique source-commit plus upstream-run tag for traceability; deployments and rollback evidence reference the returned digest, not a moving tag.
4. Reconcile `render.yaml` only after verifying the existing service's Blueprint ownership and migration constraints. Render's current Blueprint reference permits changes to non-static service runtimes, and its dashboard supports switching the existing web service from a Git source to an existing image. **Saving that source change triggers a deploy**, so do not perform it in this preparation phase. Review whether a Blueprint sync or dashboard source change owns the service, preserve its current service ID and Free plan, avoid accidental duplicate-service creation, validate the actual image-backed runtime, and only then enable the gated image deployment API flow.

The Render deploy workflow requires `RENDER_IMAGE_DEPLOY_ENABLED=true`, a designated target, an independently approved dispatch, and the API credentials described below. The workflow uses the authenticated Render Deploy API rather than invoking the deploy hook. The exact-revision smoke workflow verifies liveness, readiness, public routes, CSP, and integration status only after an identified image deployment reaches `live`.

The production release workflow has **additional manual gates** beyond the feature flag and hook. These are requirements for future, explicitly approved releases, **not instructions to activate production now**:

- GitHub Actions **repository variable** `GHCR_PUBLISH_APPROVED_SHA`: the exact independently reviewed, current 40-character `main` commit SHA. Empty/mismatched values prevent publication. Do not set it without separate release authorization.
- GitHub Actions **repository variable** `RENDER_IMAGE_DEPLOY_ENABLED`: keep unset or `false` while release is NO-GO; `true` only after the approved Render migration and production controls are proven.
- GitHub Actions **repository variable** `RENDER_IMAGE_SERVICE_ID`: independently approved production `srv-...` identifier, required to match the independently checked hook URL identity and the live image-backed web service.
- GitHub Actions **repository variable** `RENDER_DEPLOY_APPROVED_RUN_ID`: the exact GitHub Actions dispatch run ID, recorded **after dispatch** and checked **after** the `render-production-approval` environment gate. It must not be pre-entered for an unknown future run.
- GitHub Actions **secret** `RENDER_DEPLOY_HOOK_URL`: currently retained only as a secondary service-ID consistency check by the preflight; the workflow **must not send a request to the hook**. This compatibility input can be retired only by a separately tested guard update.
- GitHub Actions **secret** `RENDER_SERVICE_READ_API_KEY`: credential used for the live fail-closed service metadata and exact deploy-status reads. It is not used to create a deploy.
- GitHub Actions **secret** `RENDER_DEPLOY_API_KEY`: **separately approved**, deploy-authorized Render API credential for one authenticated `POST /v1/services/{serviceId}/deploys` operation with the reviewed immutable `imageUrl`. This new secret is a prerequisite for a future authorized release, **not** an instruction to configure it now.
- Manual promotion uses **`workflow_dispatch` on `main`** with inputs `approved_revision` (the approved current `main` SHA) and `quality_run_id` (the original, completed, successful push-to-`main` Quality Gate run, attempt 1). Independent SHA authorization is required for GHCR publication; the `render-production-approval` environment must require the designated independent approval before the post-dispatch run-ID check permits deployment. Publication and deployment have separate gates; environment approval for deployment does **not** retroactively approve a GHCR publication.
- The Docker image artifact from a trusted `main` Quality Gate is kept for a **30-day promotion window** (`retention-days: 30`, subject to repository/organization retention limits). The image must already exist and be unexpired; download fails closed on expiration. Older artifacts with the previous one-day retention are **not** extended retroactively. Outside the supported window, establish fresh authorized provenance rather than bypassing checks or rebuilding an unreviewed image. CI artifact retention is not an OCI backup or an authorization to publish.

**Render API response contract:** a `201 Created` must include a unique `dep-...` ID and matching immutable image evidence. That ID alone is polled until `live` before a release artifact can be uploaded. The API can also return `202 Queued` without a request-specific ID; never associate such a response with a different deploy by timestamp, image digest, or latest status. Treat it as **BLOCKED / outcome potentially ongoing / manual reconciliation / no retry**. Network failures after a POST are similarly indeterminate. A green CI run does not remove these production concurrency risks; independent Security/Release review is mandatory.

**NO-GO remains in force:** do not set release variables or secrets, modify Render, run GHCR publication, request a deploy, or merge merely to exercise this workflow. Issue #536, independent review, custodian/backup approvals, and authenticated QA gates remain protected.

The GHCR package must be public for Render Free to pull it without registry credentials. The package contains the public application's image, built from the already public source. This design uses the existing Free service and public-repository GitHub Actions; no paid plan is required.

## Transition safeguards and P0 closure evidence

The production smoke workflow keeps both delivery modes distinct:

- **Git-backed Render (current):** successful `push` Quality Gate runs on the official `main` branch trigger production smoke while `RENDER_IMAGE_DEPLOY_ENABLED` is not `true`.
- **Image-backed Render (future):** only after deliberate migration and enabling the flag does a successful Image Release trigger production smoke; it resolves the immutable revision from that exact release's deployment-request artifact.
- Manual `workflow_dispatch` smoke remains available. A workflow run from another repository cannot trigger the automatic smoke job.

Do not enable image deployment merely because the PR checks pass. Before closing issue #536, preserve the Render Free service and record independent evidence that: (a) the GHCR artifact was built by the trusted source revision with public build variables only; (b) the immutable image is publicly pullable; (c) Render actually runs an image-backed source, not its former Git build; (d) runtime-only credential values were not passed to the image builder (without reading or printing them); (e) the active production revision matches the expected image; and (f) `/api/health`, `/api/ready`, required public routes, CSP, integrations, and rollback procedure have been validated. Keep the issue P0/open if any of these controls remains unproven.

### Verified Render platform constraints (2026-10-09)

- Current Render Blueprint specification: non-static service runtimes **can** change after creation. Do not treat an earlier tutorial's immutable-runtime statement as an authoritative prohibition. See [Blueprint specification](https://render.com/docs/blueprint-spec).
- Render announced an in-place backing-source change through **Settings > Build > Source > Edit** on 2026-05-11. Applying the change initiates a deployment. See [Render source-change announcement](https://render.com/changelog/change-your-services-backing-repo-or-image-in-the-render-dashboard).
- Prebuilt public images are supported, including public GHCR images. The actual image URL and reference must be verified as available before changing the service. See [Prebuilt image deployment](https://render.com/docs/deploying-an-image).
- The existing service's Blueprint linkage and post-change declarative state have not been independently verified. The preparatory PR deliberately leaves `render.yaml` and production unchanged.
- Use an immutable commit tag or registry digest; keep old verified images available for rollback. Do not enable `RENDER_IMAGE_DEPLOY_ENABLED` before the production source and smoke strategy have been validated.

### Additional release safeguards

- A separate low-privilege preflight rejects foreign-repository, failed, or rerun Quality Gate events; manual `workflow_dispatch` promotion is accepted only from `main` with an approved SHA and an original successful push-to-`main` Quality Gate run. The privileged GHCR publisher checks that the source SHA still equals the current `main` head before publishing; the deploy job repeats that freshness check before sending the authenticated Render API deploy request.
- Image Release writes the deployment revision to the constant artifact `academiaarcana-deploy-request`, scoped by its GitHub Actions `run-id`, so a new `main` commit cannot change the downstream smoke artifact name.
- The Docker context excludes local private keys and certificates. The final runtime image is copied from a separate builder after dev dependencies are pruned. The PR-only image is built for Linux AMD64 but is not published.
- If browser Honeybadger monitoring is enabled in Render, the **public** `NEXT_PUBLIC_HONEYBADGER_API_KEY` and `NEXT_PUBLIC_HONEYBADGER_ASSETS_URL` must also be configured as GitHub Actions repository variables before an image built on `main` is approved for production. Both are browser-visible configuration; **never** pass server-only API tokens, source-map upload secrets, OAuth credentials, or other runtime-only values as Docker arguments. Verify build-time telemetry separately before cutover.
- The publisher no longer overwrites a moving `main` image tag. A successful trusted run publishes a unique `${source_SHA}-run-${quality_run_id}` tag, extracts the GHCR manifest digest from the push result, and passes a `ghcr.io/arcana-academy/academiaarcana@sha256:...` URL to Render. The guarded API operation refuses missing or malformed digests; smoke still verifies the source revision. Preserve exact published digests in release evidence and retain old image manifests in the registry before any rollback. Do not deploy older successful Quality Gate reruns.

### Isolated container runtime acceptance

The Quality Gate includes `bash scripts/smoke-production-container.sh "$GITHUB_SHA"` **after** the Linux AMD64 image build and **before** either release artifact step. It starts the image on loopback port 10080 in the GitHub Actions runner and verifies: the process is non-root, selected runtime-only credentials are absent, and `/api/health` returns `status=ok`, `service=academiaarcana` and the exact SHA. The container is removed even if validation fails.

This is an **ephemeral CI validation only**: no Render deploy, no GHCR publication, no real API keys, no remote Supabase readiness, and no claim about runtime integrations. The actual `/api/ready`, CSP, production integration status and exact image digest remain post-migration gates. If the container check fails, the Quality Gate is red and no main image artifact may be saved.

## Runtime secret boundary

Secrets are never committed to `render.yaml`.

The image build receives public `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values and its source revision. Runtime credentials such as `OPENAI_API_KEY`, `PARALLEL_API_KEY`, `EXA_API_KEY`, OAuth client secrets, `OUTLOOK_CALENDAR_SESSION_SECRET`, and server-only provider keys are not available to the build job.

Runtime credentials remain in Render's runtime environment or Secret Files and are read through the runtime secret resolver, which prefers `/etc/secrets/<KEY>` and uses `process.env` as a compatibility fallback for local development, tests, and the migration window. Do not duplicate a migrated credential in both a Secret File and a normal environment variable after verification. Issue #536 tracks the production isolation evidence.

## Health and rollback

Render checks `/api/health`, a cheap liveness probe. `/api/ready` verifies the canonical Supabase Auth health endpoint without exposing credentials. Production smoke verifies both after an image deployment.

Rollback should target a known healthy immutable image tag and be followed by production smoke verification. A failed deploy must not replace a healthy running deployment.

## Prohibited active delivery targets

No other hosting provider or GitHub Pages workflow may be introduced into the active deployment path. Any future platform change must update this contract, the Render Blueprint, CI/smoke workflows, and the corresponding architecture documentation together.
