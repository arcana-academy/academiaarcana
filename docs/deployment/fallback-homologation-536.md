# P0 #536 — Fallback release homologation dossier
Version: 2026-10-09. State: **PROPOSED / REVIEWABLE — NO-GO FOR PUBLICATION OR DEPLOYMENT**.

## 1. Release identity and chain of custody

- Last known Render Free Git-backed LIVE source: `17fb81477fbd3eed14b93103641004a766eb9ac1`.
- Reviewed, isolated Docker build recipe source: `cc17653dfe79c44dd83ba1ced8cb065383b11ca9` (only Dockerfile, .dockerignore, smoke script). This commit is a **direct child** of the historical LIVE source; the three packaging files do not exist at the historical SHA.
- Validation-only branch: `chore/536-fallback-validation-20261009`, committing workflow and documentation only, never overlaying any tracked historical app files.
- Initial historical sandbox run: https://github.com/arcana-academy/academiaarcana/actions/runs/37956990585 `success`, local image config ID `sha256:533a567e704802c92811ede9e3023a3007d7e94d840caf49288445afe4d162d4`, placeholders **only in this first run**.
- Revised run will use **real, public** Supabase browser build variables from GitHub Actions; its job summary must record the resulting local image ID and exact historical revision. A local Docker image config ID is **NOT** a registry OCI manifest digest and does **NOT** persist across GitHub runners.
- No `docker push`, GHCR login, container archive upload, privileged `GITHUB_TOKEN`, Render deploy hook, secret ref, service plan upgrade or main merge in this workflow.

## 2. Public build environment — verified without exposing key bytes

Read-only observations from GitHub repository Actions Variables and Supabase connected project on 2026-10-09:

| Variable | Observation | Acceptance |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Exact match to connected Supabase project's API URL | PASS |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Exact match to active, non-disabled `academia_arcana_web` publishable key, correct `sb_publishable_...` shape | PASS |
| `NEXT_PUBLIC_HONEYBADGER_API_KEY` / `NEXT_PUBLIC_HONEYBADGER_ASSETS_URL` | No repository variables observed in Actions UI; workflow intentionally provides empty strings | NOT PARITY-PROVEN |
| Server-only vars (e.g. `OPENAI_API_KEY`, encryption keys, database admin keys) | Never passed to Docker build or exported as public variables | REQUIRED / P0 |

Public configuration is expected in browser-built JavaScript; it does not make private credentials suitable for `NEXT_PUBLIC_*`. The validation script does not echo key bytes; **GitHub Actions itself records job-level environment values, including the intentionally public `sb_publishable_` key, in the run logs**. This is acceptable only for public client configuration. No runtime/admin token may ever be used in this workflow, and no full key values are copied into this dossier or checkpoint. A **separate** read-only comparison of the actual Render runtime browser configuration (not only GitHub Actions) remains required, because GitHub public variables need not equal live Render values. The new build is not production-equivalent merely because its key matches Supabase.

## 3. Supabase compatibility — read-only evidence

Supabase project ID `fichnalpbcfjywwhixid` (public project reference, not a secret), region `us-west-2`, observed `ACTIVE_HEALTHY`, PostgreSQL 17.

- Exactly the **same 24 migration files** exist in both source SHAs `17fb814` and `cc17653d`. This proves no migration file was added by the image-isolation commit. It does **not** establish that deployed DB schema has identical migrations.
- Supabase applied migration registry: **26** records. **8** applied IDs are absent from the source migration timestamp set and **6** source IDs absent from applied history:
  - Applied-only IDs: `20260929124554`, `20260929142350`, `20260929201711`, `20260929201757`, `20260929202937`, `20261007230656`, `20261007230659`, `20261007230750`.
  - Repo-only IDs: `20260929153000`, `20260929202000`, `20260929210000`, `20261006162332`, `20261007170500`, `20261007230000`.
  - **Classify as MIGRATION HISTORY DRIFT (OPEN)**, not automatically as schema drift or functional failure. Reconcile identical intended DDL and applied histories in a separate read-only review; do not execute or replay migrations against production.
- All **15** observed `public` application tables have RLS enabled, and no `anon` table `SELECT`/ `INSERT` privilege was observed. All 15 have `authenticated SELECT` grants; other grants differ by table intentionally. This is schema-level metadata, not proof of per-user policy isolation.
- The four historical RPC calls explicitly audited — `complete_study_task_with_reward`, `move_workspace_page`, `record_criterion_referenced_practice_attempt`, `record_educational_practice_attempt` — exist in production, are non-`SECURITY DEFINER`, executable by `authenticated`, not by `anon`. Request-specific RLS behavior and runtime responses have NOT been tested.
- Storage bucket `grimoire-covers` exists, is private and has a file-size restriction. Policy correctness and historical upload/read flows remain pending.
- Supabase announced that by **2026-10-30** newly created tables will no longer be automatically granted Data API exposure in existing projects. Existing authenticated table grants are present; **future schema changes** must grant intended roles explicitly and retain RLS. Source: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically .
- Historical app source and its own version-locked `@supabase/ssr`/`@supabase/supabase-js` package-lock are preserved; no authentication, user creation, database write, RLS or schema mutation was performed during this review.

**Compatibility verdict:** **PARTIAL / AMBER** (structural matches, runtime integration/migration-history reconciliation pending). Do not assert production rollback equivalence yet.

## 4. Reproducible local image validation (NO remote publication)

The branch's sandbox workflow checks immutable application SHA, overlaid files and lifecycle allowlist, builds with verified public GitHub variables only, enforces Docker runtime non-root + `linux/amd64`, runs the legacy local smoke `/api/health` on the historical revision and inspects forbidden **variable names** without printing values. Green sandbox CI proves **packaging and liveness only**. Remote `/api/ready`, auth/cookies/RLS/Storage, production Honeybadger configuration, migration behavior and user-facing login/navigation flows remain gated.

Do not upload runner image artifacts by changing this workflow without independent explicit approval: the current image ID is transient and its container layers do not constitute an externally retrievable rollback candidate.

## 5. Persistent backup / rollback by immutable manifest digest — AUTHORIZATION-REQUIRED PLAN

A secure image fallback requires a **second, independently retrievable OCI manifest digest** corresponding to historical application code and real public browser build configuration. Every future publication, archive write, permission or production change is explicitly **outside this approval**.

Proposed gated path:

1. **Approve image build/publish independently**, only after reviewing this dossier and reconciling migration history/runtime public variables. Build exact pinned source `17fb814` with reviewed recipe, build constraints and selected real `NEXT_PUBLIC_*` variables; reject any server secrets in args, ENV, Docker layers or build logs. Verify CI, non-root, signature/provenance, platform and artifact content.
2. **Publish separately only when authorized**, to an agreed registry/version namespace with a unique immutable provenance tag; record image URI, source SHA, recipe SHA, CI run ID, config digest, manifest SHA-256, layer digests and sizes, `linux/amd64` architecture. Publishing is not part of this validation branch.
3. **Test pull without cached credentials** in a clean, isolated client. Confirm the immutable manifest digest and **every compressed layer hash** can be fetched. Ensure GHCR permissions, package ownership, Actions `Admin` privilege, delete/restore authorities and retention policy are reviewed; tags alone or read-only availability do not prevent deletion.
4. **Independent offline backup:** with explicit destination approval, use a pinned and verified OCI archive tool such as `skopeo copy --all --preserve-digests` to copy `docker://ghcr.io/<owner>/<image>@sha256:<digest>` to an `oci-archive:<offline-file>.tar`. Record separate archive SHA-256; inventory manifest digest/layer hashes; store in access-controlled destination outside the single GHCR deletion authority and preferably in a separate failure domain. Do not upload sensitive values or user/database data. The archive must be **verified by reading it back** in isolation. See https://github.com/containers/skopeo/blob/main/docs/skopeo-copy.1.md .
5. **Dry-run restore under separate approval:** demonstrate restoring from that offline archive into an authorized nonproduction registry namespace. `--preserve-digests` must fail closed if manifest digest cannot remain identical. Independently fetch the restored digest, verify bytes and platform, and run isolated smoke against the correct revision. Only this successful drill makes the recovery path credible.
6. **Production cutover separately approved:** preserve existing Free service ID `srv-dauor697lnhs739cicag`, immutable reference to the primary release and at least one **tested fallback digest**, existing runtime secrets only in Render, no Git build carrying secrets. Verify Render source ownership, Blueprint synchronization, URL, exact revision, readiness, CSP and public routes, signed-in RLS/storage/auth, alerting and rollback drill. Keep Git auto-deploy OFF until approved; do not toggle flags or secrets implicitly.
7. **Operating retention:** record who may delete versions, active/rollback digest pinning and monitoring for anonymous pulls; alert on any digest removal before restart. Render re-pulls images on deployments/restarts and rollback, so loss of the registry digest is a P0 availability risk. https://render.com/docs/deploying-an-image and https://render.com/docs/rollbacks .

**Restore example is a procedure, not an executable authorization:** source archive integrity receipt → restore to an independent namespace (authorized change) → verify original digest + platform → smoke test without secrets → submit explicit rollback decision → only then deploy the chosen digest.

### Distinguish risk states

- **Proof of build:** local Docker config hash from ephemeral runner — currently achievable.
- **Proof of persistent fallback:** accessible OCI manifest by digest + independently verified backup — NOT achieved.
- **Proof of rollback:** tested restore and approved deploy path, including Render runtime secret isolation — NOT achieved.
- **Release control:** PR #584 and all production deployments still require independent authorization; #536 stays OPEN.

## 6. Required checkpoint table

| Gate | Required evidence | Current |
|---|---|---|
| Public Supabase project URL/key | Exact direct check against active Supabase key | PASS |
| Historical source provenance | SHA and minimal overlay, local CI | PASS (initial run) |
| Historical build with verified real public vars | Green new workflow run, new local image ID | PENDING NEW CI |
| Supabase schema objects | 15 RLS tables, 4 RPCs, private bucket | PASS structural only |
| Migration history parity | Applied SQL/versions reconciled | PENDING |
| Runtime integration with actual public config | Controlled nonproduction smoke of auth/Storage/ready | PENDING |
| Durable fallback manifest | Separate accessible SHA-256 registry digest | NOT CREATED |
| Independent backup and tested restore | Archive checksum + restored digest equality | NOT CREATED |
| GHCR retention/least privilege | Admin rights and version deletion governance | PENDING POLICY |
| Render image-backed rollback | Explicitly approved, tested cutover/rollback | NOT AUTHORIZED |

**Decision: HOLD / NO-GO for publication, merge, Render source migration, deploy, changed secrets or #536 closure.**
