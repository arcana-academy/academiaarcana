# P0 #536 — GHCR retention and recoverable fallback: guarded runbook

Date: 2026-10-09. Status: **DISPOSABLE OCI DRY-RUN PASSED / OPERATIONAL BACKUP UNEXECUTED / NO-GO for publication, merge or deploy**.
Owner approval required at **each mutating gate**. This document is a plan, not a scheduled workflow or permission to operate production.

## 1. Current evidence and exact immutable identities

| Item | Observed state |
| --- | --- |
| GitHub owner | Personal account `arcana-academy` (not a GitHub organization) |
| GHCR package | Public `ghcr.io/arcana-academy/academiaarcana`; one tagged active version, zero untagged and zero recoverable deleted versions at the last authenticated inspection |
| Primary release | Source `cc17653dfe79c44dd83ba1ced8cb065383b11ca9`, Quality Gate `37937615857`, Image Release `37938345938` |
| Primary immutable reference | `ghcr.io/arcana-academy/academiaarcana@sha256:c2d2dd155ddaeab02167c2cb4e064fe2c85d7bcae60b3b2a64f5bc0f6a9e7658` |
| Primary content check | Anonymous manifest/config and 7/7 compressed layers retrieved and checked against their SHA-256 hashes; `linux/amd64` |
| Package permission | `academiaarcana` GitHub Actions access role **Admin**, inherited source-repository access enabled; package owner can delete |
| Retention | No administrative anti-delete guarantee verified for active GHCR digest; GitHub Actions artifact history retention is **not** GHCR retention |
| Historical last-LIVE source | `17fb81477fbd3eed14b93103641004a766eb9ac1` |
| Historical fallback recipe | `cc17653dfe79c44dd83ba1ced8cb065383b11ca9` (Dockerfile, .dockerignore, smoke script only) |
| Fallback status | Historical build/isolated smoke validated; no published historical fallback digest, no off-registry archive, no restore drill |
| Render | Existing `srv-dauor697lnhs739cicag`, Free, Git/Node, autoDeploy **OFF**; no source cutover |

Primary package administration: https://github.com/users/arcana-academy/packages/container/academiaarcana/settings .
Authoritative checkpoints: https://github.com/arcana-academy/academiaarcana/issues/536 and the draft https://github.com/arcana-academy/academiaarcana/pull/585 .

## 2. Retention / deletion-threat matrix

| Failure or actor | Observable control required before a cutover | Current verdict |
| --- | --- | --- |
| A publisher workflow receives package Admin and deletes a version | Owner reviews whether **Write** is sufficient for publication; test permission change independently and revoke unnecessary Admin only with separate authorization | **OPEN; no ACL mutation approved** |
| Package owner/admin deletes or changes visibility | Document owner, backups outside the same account and explicit two-person review of high-risk changes; no claim that GitHub supplies immutable deletion protection | **OPEN** |
| Cleanup automation removes old tags/digests | Inventory all workflow and external cleanup automation; deny deletion of active and rollback digests, record exception policy and expiration criteria | **OPEN** |
| Mutable tag unexpectedly changes | Render source uses immutable `@sha256:<digest>`, never `:latest`; record manifest hash and mapping to source SHA/build run | Primary proof **PASS**, fallback **OPEN** |
| GHCR unavailable or image removed | Separate, access-controlled OCI backup with verified SHA-256, independent failure domain and tested restore to a disposable registry | **OPEN** |
| New image cannot start or access runtime | Exact revision /api/health; /api/ready; CSP; integrations; authorized authenticated/RLS/storage regression; tested rollback path | **OPEN** |
| Source swap makes Git-backed Render rollback uncertain | Keep current LIVE intact until a separate digest-backed recovery and cross-source fallback plan is explicitly approved | **OPEN** |

**Acceptance principle:** A valid tag, an image config `sha256` ID, or a green CI build is not a persistent rollback. An old, *independently retrievable OCI manifest* and a tested recovery procedure are required.

## 3. Prepared nonmutating preflight (current authorized scope)

1. Reconfirm PR #585 is draft and PR #584 has not been merged; preserve their canonical choices without mixing domains.
2. Inspect *without changing* GitHub Package Settings / Manage Versions: visibility, version list and digests, repository Actions role, inherited access, owner-delete controls, any cleanup/expiration rules and audit events. Do not expose credentials in comments/logs.
3. Reconcile the historical fallback application SHA, build-recipe SHA and observed CI run. Record that the latest build used verified browser-public Supabase variables but that Render browser parity, Honeybadger parity, migration-history drift and actual authenticated RLS/Storage behavior remain unresolved.
4. For each candidate OCI manifest, read it anonymously, verify the `Docker-Content-Digest` and the **hashes/sizes of all referenced blobs**, and confirm `linux/amd64`; never substitute a local `docker image inspect .Id` for a registry digest.
5. Reconfirm Render `autoDeploy=no`, `autoDeployTrigger=off`, Free, Git/Node, last LIVE revision, source ownership and deployment queue. **STOP** if any fact differs.
6. Record a proposed independent backup owner/location and access model, restore target and retention period. **Do not create/upload any archive or change settings in this phase.**

**Snapshot evidence is time-specific.** A past success of a registry GET or CI workflow does not prove present retention. No assumed GitHub settings should be reported as immutable retention guarantees.

## 3A. Completed disposable OCI archive and filesystem restore dry-run (2026-10-09)

**Technical dry-run ONLY, not the independent backup/restore gate.** A separate ephemeral browser VM downloaded the **already published primary** manifest `sha256:c2d2dd155ddaeab02167c2cb4e064fe2c85d7bcae60b3b2a64f5bc0f6a9e7658` anonymously from GHCR and verified the complete manifest SHA-256. The same exercise streamed **8/8 complete descriptor blobs** (config and 7 compressed layers; total **216,970,542 bytes**), checking full-body SHA-256 and recorded descriptor size for each.

The VM built a local OCI layout with the source Docker schema 2 manifest, packaged it in a **216,995,840-byte tar**, extracted that tar to a separate temporary directory, and verified all **9/9 content-addressed objects** (manifest plus 8 blobs) against digest and size. The archive's complete SHA-256 was `f35b959424b611253be8b958013f8e9eff60988f0ede3a9c51466a215662c069`, unchanged on remeasurement. The negative test flipped one byte of a **temporary restored** 93-byte layer, and SHA verification rejected the corrupted restore. After deleting and restoring the directory again from the untampered tar, 9/9 objects passed. [Full execution receipt and limitations on issue #536](https://github.com/arcana-academy/academiaarcana/issues/536#issuecomment-6090844711).

**Deliberate limitations:** no external persistence of the tar (stored under `/tmp` only); **no independent failure domain or custody/retention control**; no approved destination; no secondary fallback digest; no registry push; no local Docker daemon/container boot, Render rollback or production test. The exercise proves the byte-integrity mechanics of a **disposable OCI filesystem round trip only**. It does **not** authorize or satisfy future Gates A–D, and must not be called an operational backup or tested deployment rollback. The Runbook's nonmutating-preflight prohibition on **persisting or uploading archives** remains in force.

## 4. Future action gates (all separately authorized, NOT executed here)

### Gate A — approve a production-compatible fallback build

- Approval records exact source SHA `17fb814...`, security-only recipe SHA `cc17653d...`, intended registry namespace, source/public variables, CI environment, reviewer and named expiration/rollback owner.
- Validate actual browser-public Supabase/Honeybadger parity with Render, reconcile the migration ledger (26 applied IDs, 24 source SQL files; 8 applied-only and 6 source-only IDs), and run authenticated isolation/storage smoke in a controlled nonproduction environment. Never use or expose production user records.
- Verify no runtime-only secrets in Docker build arguments, env names, layer contents, build logs or source maps; the existing config-name check alone is insufficient.
- Only then, under a **new explicit approval**, publish a uniquely tagged fallback image. Record its **remote manifest digest**, OCI content/size and `linux/amd64`; verify anonymous pull of the complete blob set. No credentials or package writes are approved by this runbook.

### Gate B — approve independent content-addressed backup

- Approve backup destination outside the single GHCR deletion authority, storage owner, access list, encryption-at-rest decision, size/billing/free-tier impact, retention, restore credentials and deletion policy.
- Use a pinned, reviewed OCI transfer tool in a disposable host. A proposed mechanism is `skopeo copy --all --preserve-digests` from `docker://ghcr.io/arcana-academy/academiaarcana@sha256:<FALLBACK_DIGEST>` to an `oci-archive:` destination. **Run only after approval**; if the source media type cannot be preserved, **fail closed**, do not silently transcode and claim equal digests. Tool behavior/destination support must be validated in a nonproduction dry-run.
- Hash the resulting archive with SHA-256; verify its contents independently, preserve original manifest/config/layer digests and sizes, and store a separate receipt including archive bytes, checksum, source SHA, build-recipe SHA, platform, verification time, build run, package version ID and authorized storage location.
- Include the primary published digest in retention governance as well. **Do not overwrite, re-tag or delete any active GHCR version.**

### Gate C — approve a recovery drill before release

- Fetch the archive back from independent storage; recompute its full-file hash and compare to the signed/checkpointed receipt. Fail if it differs.
- Restore to an **approved nonproduction registry namespace** with separate credentials and explicit write authorization; request digest preservation and fail if impossible. Verify recovered registry manifest digest against the original recorded digest, then re-fetch and SHA-256-check each layer.
- Verify container start as non-root, exact historical revision via `/api/health`, readiness, public configuration and authorized integration checks. Record the limitations of any synthetic configuration. **No production deploy.**
- If digest preservation is technically impossible for the approved archive media format, do not call it a successful exact-digest drill. Propose a documented alternate recovery with a *new* digest mapping and obtain separate acceptance; do not weaken a hash comparison.
- Name the on-call operator, rollback decision owner, maximum tolerable recovery time, error conditions, change window and explicit GO/NO-GO report before any Render source migration.

### Gate D — production cutover, NOT in scope

Only after independent human approval, the effective package deletion/retention policy, **two independently recoverable digests**, successful backup/restore evidence, live-equivalent build and runtime isolation are confirmed: preserve the existing Render Free service ID; confirm no queued deploy; switch to a verified immutable image reference under separate authorization; verify revision, readiness, CSP, integrations and rollback. Never enable `RENDER_IMAGE_DEPLOY_ENABLED` as a side effect of a documentation/CI change.

## 5. Audit receipt template (no secrets)

Record one immutable receipt per image and one receipt per restore exercise:

- Timestamp (UTC), request/approval ID, operator, independent reviewer.
- Source SHA, Docker recipe SHA, CI run URL, public-build config version **without key bytes**.
- Registry host/repository, immutable image manifest digest, package version ID, OCI media type and `os/arch`.
- Config digest, layer digest/size manifest, anonymous retrieval result and integrity verifier.
- Backup format, archive SHA-256, byte size, independently controlled location identifier, storage owner, access restrictions, retention deadline and restoration authorization ID.
- Recovery exercise: read-back archive hash, target registry namespace, resulting digest, layer-integrity and smoke results, exact revision, runtime limitations, date and approver.
- Decision: **PASS, BLOCKED or FAIL**, with links to evidence; any unknown mandatory field means **NO-GO**.

## 6. Authoritative operational references

- GitHub Packages permissions: https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions
- GitHub GHCR deletion/restore: https://docs.github.com/en/packages/learn-github-packages/deleting-and-restoring-a-package
- `skopeo copy` and digest-preserving fail-closed mode: https://github.com/containers/skopeo/blob/main/docs/skopeo-copy.1.md
- Render prebuilt-image pull and rollback limitations: https://render.com/docs/deploying-an-image and https://render.com/docs/rollbacks

**FINAL STATUS: LOCAL OCI ARCHIVE/FILESYSTEM RESTORE DRY-RUN PASS; OPERATIONAL BACKUP, FALLBACK DIGEST AND RESTORE TO APPROVED REGISTRY/CONTAINER NOT EXECUTED. GHCR retention and independent disaster recovery remain NOT PROVEN. Issue #536 remains P0/OPEN.**
