# Academia Arcana — P0 #536 | GHCR public OCI metadata preflight

**Status:** isolated development only; DRAFT / NO-GO. **Category:** A — Construction / Security QA. No merge, GHCR publication, Render or Supabase changes, external backups, student publication or paid cost authorization.

## Narrow scope and provenance

- Source baseline: protected `main` at `28014dd3acc147ec00dbf36e023fd2316a2c4221`, subject to preflight before committing.
- Dedicated branch: `work/aa-p0536-oci-public-preflight-20261114`, without a pull request.
- Existing source of truth: `scripts/security/oci_recovery_536.py`, `docs/deployment/ghcr-retention-recovery-536.md`, and issue #594; no replacement or alteration.
- Historical, **not current release** candidate: `ghcr.io/arcana-academy/academiaarcana@sha256:c2d2dd155ddaeab02167c2cb4e064fe2c85d7bcae60b3b2a64f5bc0f6a9e7658`. Historical public metadata proof: [run #40947320733](https://github.com/arcana-academy/academiaarcana/actions/runs/40947320733), completed SUCCESS on 2026-10-29. Today's registry accessibility is **NOT VERIFIED**.

## Verification boundary

`verify-ghcr-public-metadata-536.py` is **offline and standard-library-only**. It accepts *already obtained* public manifest and image config bytes plus an exact digest. It fails closed if:

1. Manifest SHA-256 differs from the explicitly supplied digest, schema/media type is unsupported, or JSON is invalid/oversized.
2. The public config's byte count or SHA-256 differs from its manifest descriptor.
3. A config or layer descriptor has malformed digest, size, type, duplicate digest, missing layer, or unacceptable bounds.
4. Public image config does not specify Linux/AMD64 or has an invalid/root runtime user.
5. Config `Env` contains malformed/duplicate names or names matching server-secret patterns (OpenAI, Parallel, Exa, OAuth, database, tokens, keys). Only the two already-known browser-public key names are exempted from the generic secret-name pattern.

On success, outputs only structural metadata and counts. No environment values or raw parsing errors are printed; on failure, generic `NO-GO` only. The verifier reads no Render or production credentials and does not contact a registry, execute a model, pull layers or write a remote artifact.

## Reproducible, synthetic, free-only test

From the repository root in an authorized online **no-cost** Python 3.10+ executor:

```sh
python3 -m unittest discover -s scripts/security -p 'test_verify_ghcr_public_metadata_536.py' -v
```

This is a synthetic unit-test command, **not** permission to run a GitHub Actions workflow manually. Execute only where run cost is confirmed zero; the code requires no third-party packages, real secrets, or network calls.

Read-only verification of *previously downloaded and explicitly approved* public metadata, without secret values:

```sh
python3 scripts/security/verify-ghcr-public-metadata-536.py \
  --manifest /approved-temporary/public-manifest.json \
  --config /approved-temporary/public-config.json \
  --digest sha256:c2d2dd155ddaeab02167c2cb4e064fe2c85d7bcae60b3b2a64f5bc0f6a9e7658
```

This command is **illustrative and not executed against GHCR or Render in this scope**. These paths are placeholders; there is no implication that those files exist or that any remote image is still publicly downloadable.

## Non-equivalence and stop conditions

- Descriptor hashes/sizes of layers are checked **structurally only**. Layer bytes are **not fetched or hashed**. A PASS **does not** attest to full OCI image integrity, removal of secrets from layers/source maps, or trusted release provenance.
- Runtime secrets are not inspected in Render; neither `NEXT_PUBLIC_*` naming nor Docker metadata alone establishes platform-level secret isolation.
- A GHCR candidate from 2026-10-09 is not the deployed Render revision, current `main`, or approved MVP release.
- No OCI tar is generated or uploaded. Google Drive folder `off-ghcr` is an empty preparatory destination in the last authorized read, not a durable backup or independently governed DR copy.
- Issues #536, #594 and #595 remain open. Actual public registry retrieval, immutable backup/readback, separate custodian/retention, restore to independent registry, authenticated smoke and D1–D4 approvals remain distinct future gates.
- Freeze `main`, PR #866, Render Free, auto-deploy OFF and the student-publication **NO-GO** until separate explicit approvals; stop on SHA, access, workflow, cost or scope divergence.

**Acceptance for this isolated code-only scope:** exactly the two new Python files and this Markdown document; negative synthetic tests including config-hash tampering; no external API calls or dependency installs; one commit max on the dedicated branch after verified preflight. Passing these tests does **not** authorize a PR, merge, deployment or image release.
