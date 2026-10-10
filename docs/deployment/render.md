# Academia Arcana — Render Deployment

## Canonical status

**Render is the application hosting and production deployment platform.** GitHub provides source control and CI; Supabase provides authentication and persistence.

The live Render Web Service currently uses the Git-connected Node runtime on `main`, in Ohio on the Free plan. Its active contract remains in `render.yaml` until the prebuilt-image migration is ready.

## Build isolation migration

The image pipeline is being introduced in two stages so production keeps its existing source while the image is built and published:

1. The Quality Gate builds a `linux/amd64` image after lint, typecheck, unit, accessibility, build, and E2E checks pass. It passes only public Supabase browser configuration and the source revision; local `.env` files are excluded from the Docker context.
2. After a successful Quality Gate triggered by a `push` to `main` in the official repository, a separate workflow publishes that exact image artifact to GHCR. Pull-request and fork-originated workflow artifacts cannot activate the privileged publisher. The publishing job does not check out or build repository code. Image deployment remains disabled during this stage.
3. Once the GHCR image exists and is public, migrate the existing Render service to the verified SHA256 image digest while preserving its runtime environment and Secret Files. Each publication uses a unique source-commit plus upstream-run tag for traceability; deployments and rollback evidence reference the returned digest, not a moving tag.
4. Reconcile `render.yaml` only after verifying the existing service's Blueprint ownership and migration constraints. Render's current Blueprint reference permits changes to non-static service runtimes, and its dashboard supports switching the existing web service from a Git source to an existing image. **Saving that source change triggers a deploy**, so do not perform it in this preparation phase. Review whether a Blueprint sync or dashboard source change owns the service, preserve its current service ID and Free plan, avoid accidental duplicate-service creation, validate the actual image-backed runtime, and only then enable the image deploy hook.

### Explicit GHCR publication authorization (P0 #536)

**GitHub Actions image publication is separate from Render Auto Deploy.** Disabling `autoDeploy` on Render does not stop a successful `main` Quality Gate from triggering Image Release. An Image Release workflow can finish successfully with its **publish** job skipped; this is **not** proof that a registry artifact exists.

The GHCR publisher now fails closed unless the repository-level Actions configuration variable `GHCR_PUBLISH_APPROVED_SHA` is **nonempty and exactly matches** the immutable SHA of the successful original `push` Quality Gate on `main`. Trusted source/event, branch, repository, first-attempt, and stale-main checks remain mandatory. A missing, empty, or mismatched variable leaves the privileged publisher **skipped**, without producing a new registry image or triggering a Render image deployment. The separate `RENDER_IMAGE_DEPLOY_ENABLED` switch only gates the downstream Render deployment request.

**Reliable after-the-fact promotion:** when the automated publisher skipped because approval was not preconfigured, an authorized operator can use the `workflow_dispatch` controls of **Academia Arcana Image Release** on `main`. Enter the exact already-approved `main` commit as `approved_revision`, together with `quality_run_id` identifying the original completed-successful `push` Quality Gate. The low-privilege preflight reads GitHub's **Actions run API** and rejects any foreign-repo, PR/fork, manual/rerun, failed, stale, or mismatched artifact before the job with `packages: write` can run. The independent configuration-variable SHA approval is **also required**; a manual dispatch alone cannot authorize publication. The original Quality Gate image artifact is retained for **one day only**, so an expired/missing archive fails closed and a new, independently reviewed pipeline decision is required. Do not rebuild untrusted source inside the publisher.

**Operator procedure — NOT approved or executed by this document:**
1. Obtain independent human review of the exact source commit, build provenance and security controls, plus distinct authorization to publish to GHCR. Document the approver, source SHA, retention plan, backup custodian and recovery path in issue #536.
2. After reviewing the **actual final main push SHA** and its original successful Quality Gate run, only an authorized administrator may set `GHCR_PUBLISH_APPROVED_SHA` to that exact SHA. The merge SHA may differ from the PR SHA. If the initial automatic Image Release already skipped, perform a **separately authorized** manual `workflow_dispatch` promotion with matching `approved_revision` and `quality_run_id` before the original one-day artifact expires. Preflight verifies source, status and provenance using the GitHub API; an invalid or stale selection fails closed. No synthetic push, rerun of untrusted CI, manual rebuild or policy bypass is permitted.
3. Independently verify the publisher actually ran, the immutable GHCR manifest digest, complete OCI blob hashes, provenance, privileges, retention and off-registry backup. Clear the one-commit authorization variable after the approved publication. Removing the variable does not delete a published image, prove retention, or authorize a Render cutover.
4. Obtain a **second** explicit authorization for Render image source migration, deployment and rollback. Keep `RENDER_IMAGE_DEPLOY_ENABLED` disabled and Render Auto Deploy OFF until backup/restore is exercised and production-release gates are satisfied.

The SHA variable is an operational interlock, **not** a substitute for branch protection, independent code review, GHCR deletion protection, or a human release approval. No settings or credentials are changed merely by merging the workflow patch. For the currently recorded NO-GO, **leave the variable unset** and preserve the existing LIVE Render service.

A Render deploy now additionally requires an independent exact **per-workflow-run** authorization `RENDER_DEPLOY_APPROVED_RUN_ID` equal to the numeric `github.run_id` rendered as text, a first-attempt `workflow_dispatch` from main, and the `render-production-approval` GitHub Environment. Operators must separately configure this Environment with mandatory independent reviewers and verify its protection: simply naming an Environment is **not** evidence of any reviewer gate. The run-id authorization must be granted by an authorized human during the window before deploy job evaluation and explicitly revoked afterwards; leaving `RENDER_IMAGE_DEPLOY_ENABLED=true` alone is insufficient. The deploy job is skipped if the run ID is unset, mismatched, the run is a rerun, or the event is an automatic `workflow_run`. **No environment protection, deployment or variable mutation is performed by this patch.**

The Render deploy workflow requires `RENDER_IMAGE_DEPLOY_ENABLED=true` and the `RENDER_DEPLOY_HOOK_URL` secret. The secret is used only by the deploy job. The exact-revision smoke workflow verifies liveness, readiness, public routes, CSP, and integration status after a requested image deployment.

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

- A separate low-privilege preflight rejects manual **Quality Gate** runs, foreign-repository, failed, or rerun Quality Gate events; a manual **Image Release** dispatch can promote only an original successful push-to-main Quality Gate verified using GitHub's Actions API and a separately approved exact source SHA. The privileged GHCR publisher checks that the source SHA still equals the current `main` head before publishing; the deploy job repeats that freshness check before sending the HTTPS-only Render hook.
- Image Release writes the deployment revision to the constant artifact `academiaarcana-deploy-request`, scoped by its GitHub Actions `run-id`, so a new `main` commit cannot change the downstream smoke artifact name.
- The Docker context excludes local private keys and certificates. The final runtime image is copied from a separate builder after dev dependencies are pruned. The PR-only image is built for Linux AMD64 but is not published.
- If browser Honeybadger monitoring is enabled in Render, the **public** `NEXT_PUBLIC_HONEYBADGER_API_KEY` and `NEXT_PUBLIC_HONEYBADGER_ASSETS_URL` must also be configured as GitHub Actions repository variables before an image built on `main` is approved for production. Both are browser-visible configuration; **never** pass server-only API tokens, source-map upload secrets, OAuth credentials, or other runtime-only values as Docker arguments. Verify build-time telemetry separately before cutover.
- The publisher no longer overwrites a moving `main` image tag. A successful trusted run publishes a unique `${source_SHA}-run-${quality_run_id}` tag, extracts the GHCR manifest digest from the push result, and passes a `ghcr.io/arcana-academy/academiaarcana@sha256:...` URL to Render. The hook refuses missing or malformed digests; smoke still verifies the source revision. Preserve exact published digests in release evidence and retain old image manifests in the registry before any rollback. Do not deploy older successful Quality Gate reruns.

### Isolated container runtime acceptance

The Quality Gate includes `bash scripts/smoke-production-container.sh "$GITHUB_SHA"` **after** the Linux AMD64 image build and **before** either release artifact step. It starts the image on loopback port 10080 in the GitHub Actions runner and verifies: the process is non-root, selected runtime-only credentials are absent, and `/api/health` returns `status=ok`, `service=academiaarcana` and the exact SHA. The container is removed even if validation fails.

This is an **ephemeral CI validation only**: no Render deploy, no GHCR publication, no real API keys, no remote Supabase readiness, and no claim about runtime integrations. The actual `/api/ready`, CSP, production integration status and exact image digest remain post-migration gates. If the container check fails, the Quality Gate is red and no main image artifact may be saved.

### P0 #536: containment after the externally merged release (2026-10-09)

**Observed, not authorized:** PR #582 was merged externally into `main` at `cc17653dfe79c44dd83ba1ced8cb065383b11ca9`. GitHub's Quality Gate and isolated container tests passed and the trusted Image Release published a GHCR digest. Its Render deploy job was skipped. The existing Render Free service was still Git-backed, `autoDeployTrigger=checksPass`, with the last observed live revision `17fb81477fbd3eed14b93103641004a766eb9ac1`. This does **not** prove the service is permanently safe from a later Git auto-deploy.

**Read-only smoke fix:** the previous workflow-level `concurrency: production-smoke / cancel-in-progress: true` could cancel an in-flight Git-backed verification when the downstream Image Release started another Production Smoke workflow, even when that second smoke job was skipped. This workflow intentionally has **no concurrency cancellation**: independent read-only smoke attempts complete independently. Their success must still be determined by **exact deployed SHA**, not just the HTTP root response.

**Production freeze workflow (approval required; do not execute implicitly):**

1. Confirm the service is the same `srv-dauor697lnhs739cicag` on Render Free, currently Git-backed `main`. Check Deploys and Events for any running or queued Git build.
2. Reconfirm that Git **Auto-Deploy remains Off** in the existing service (`autoDeploy=no`, `autoDeployTrigger=off`) and re-read the deployment queue. If either setting differs, **stop** and obtain separate operational approval before changing delivery behavior. Do not change runtime environment or secrets.
3. Before merging this smoke fix, determine whether `main` is ahead of production. A passing `main` Quality Gate does not imply the Render `/api/health` revision has advanced.
4. When Git auto-deploy is paused, operators may use manual `Academia Arcana Production Smoke` with `expected_revision` set to the **40-character SHA actually live** on Render. This only verifies the existing service; it does not deploy anything, and a passing result must not be attributed to a new commit.
5. Do not merge more work into `main` until the Git-backed auto-deploy risk is controlled, reviewed and tested. Preserve the exact current stable deploy for rollback.

**GHCR source and retention acceptance (currently unverified):**

- Expected registry reference from the successful main Image Release: `ghcr.io/arcana-academy/academiaarcana@sha256:c2d2dd155ddaeab02167c2cb4e064fe2c85d7bcae60b3b2a64f5bc0f6a9e7658`. This digest is evidence of a successful publisher, **not** evidence that anyone can anonymously pull it.
- GHCR visibility is independent of the repository's visibility. In the package settings, verify **Public** (or arrange an authorized private-registry credential) and confirm in a clean, unauthenticated Docker/OCI client that this **specific digest** resolves to a `linux/amd64` manifest. Never expose tokens in output or logs.
- Verify who can delete package versions and whether automatic cleanup or retention policies might remove the active digest. Preserve the active digest and at least the earlier known-good rollback digests; log the mapping from source SHA → build run → unique provenance tag → manifest digest. If any version is missing or may be pruned, **NO-GO** for image-backed production.
- Do not change package visibility, install credentials, delete images, or modify billing settings during a read-only audit. The image contains publicly deployed application code, but this does not replace inspection of layers and source-map contents before making it public.
- Render pulls the image from the registry for **every deployment** and may pull again on restarts/rescheduling. If a required digest disappears, rollback/recovery can fail. Reference: https://render.com/docs/deploying-an-image
- Only after independent authorization: align Blueprint ownership, reconfirm that Git auto-deploy remains disabled, choose the existing Render service, change its source to the verified digest with an explicitly approved deployment, verify readiness/security/smoke, and retain rollback digests. Do not enable `RENDER_IMAGE_DEPLOY_ENABLED` prematurely.

## Runtime secret boundary

Secrets are never committed to `render.yaml`.

The image build receives public `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values and its source revision. Runtime credentials such as `OPENAI_API_KEY`, `PARALLEL_API_KEY`, `EXA_API_KEY`, OAuth client secrets, `OUTLOOK_CALENDAR_SESSION_SECRET`, and server-only provider keys are not available to the build job.

Runtime credentials remain in Render's runtime environment or Secret Files and are read through the runtime secret resolver, which prefers `/etc/secrets/<KEY>` and uses `process.env` as a compatibility fallback for local development, tests, and the migration window. Do not duplicate a migrated credential in both a Secret File and a normal environment variable after verification. Issue #536 tracks the production isolation evidence.

## Health and rollback

Render checks `/api/health`, a cheap liveness probe. `/api/ready` verifies the canonical Supabase Auth health endpoint without exposing credentials. Production smoke verifies both after an image deployment.

Rollback should target a known healthy immutable image tag and be followed by production smoke verification. A failed deploy must not replace a healthy running deployment.

## Prohibited active delivery targets

No other hosting provider or GitHub Pages workflow may be introduced into the active deployment path. Any future platform change must update this contract, the Render Blueprint, CI/smoke workflows, and the corresponding architecture documentation together.
