# P0 #536 — Fallback-image proof of concept (validation only)

**Status: PROPOSED / NOT APPROVED FOR DEPLOYMENT OR PUBLICATION.**

## Immutable inputs

- Application source at the last Render LIVE commit: `17fb81477fbd3eed14b93103641004a766eb9ac1`.
- Only the build hardening recipe (not the application source) is overlaid from `cc17653dfe79c44dd83ba1ced8cb065383b11ca9`: `Dockerfile`, `.dockerignore` and `scripts/smoke-production-container.sh`.
- These three files did **not** exist in the last-live source. Both checkouts are pinned by full Git SHA; workflow refuses changes to any tracked application files.
- Workflow: `.github/workflows/fallback-validation-536.yml`; scope only push to branch `chore/536-fallback-validation-20261009`; `permissions: contents: read`; no privileged repo/package write token; pinned GitHub Actions; no secret references.

## Controlled one-off test

The runner checks historical dependency lifecycle restrictions, installs with ignored lifecycle scripts and an explicit reviewed rebuild, audits production dependencies, runs lint, typecheck, unit and accessibility suites, builds the secured `linux/amd64` Docker image and smoke-tests the container as non-root on localhost. The smoke test checks `/api/health`, exact **historical** revision and presence/absence (without displaying any secret values) of selected runtime-only names.

**Deliberate limitation:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` use synthetic, correctly formatted **public placeholders**, Honeybadger public fields are empty, and no runtime-only credentials are passed. This must not be mistaken for a deployable equivalent of the current production configuration. A production-ready fallback digest would require separately approved rebuilding with verified production **public** configuration, rechecking the secrets boundary and real integration tests, without any runtime secret supplied at Docker build time.

No Docker image, OCI archive, or workflow artifact is uploaded anywhere. `docker image inspect .Id` yields a **local image config digest**, which is **not** a remote OCI/GHCR manifest digest; registry digest can be recorded only after a separately approved publication. The GitHub Actions job summary provides the source SHA, reviewed recipe SHA and local image ID for this CI run. Runner images are ephemeral and **not** suitable for rollback after the job ends.

## Unresolved rollback / production gates

1. Build and smoke must pass on exactly the pinned source; failures require investigation before considering a fallback.
2. Recheck code/config compatibility with present Supabase database migrations and runtime integration requirements; synthetic credentials prove **no** remote readiness.
3. Review version/permission retention for the production GHCR package, currently **one active tagged version and no recoverable older version**; package actions access is `Admin` (delete/restore). Consider explicitly approved least-privilege `Write` and an independently protected backup archive.
4. Require explicit approval for any upload, GHCR visibility change, retention change, Render source change, runtime secret action, merge or deployment. Preserve Render Free and Git autoDeploy OFF.
5. A genuine production rollback needs at least one **separate**, persistent, retrievable digest tested after publication, plus a documented recovery drill. A local image ID in ephemeral CI is insufficient. Preserve the current Render Git-backed live deployment until migration safety is demonstrated.

## Acceptance tracking

- [ ] Fallback sandbox tests, Docker build, and isolated smoke green
- [ ] Local image ID provenance and security checks recorded
- [ ] Actual production-public browser configuration verified without server secrets
- [ ] Compatibility / remote readiness tested in an authorized nonproduction integration environment
- [ ] Persistent fallback OCI artifact or registry digest stored with controlled retention
- [ ] Rollback drill and GHCR delete/restore governance approved
- [ ] Explicit approval for any future production action

Refer to canonical P0 issue https://github.com/arcana-academy/academiaarcana/issues/536.
