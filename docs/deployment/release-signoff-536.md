# P0 #536 — Release sign-off and DR custody decision packet

**State: HUMAN ACTION REQUIRED / NO-GO.** This record specifies the *minimum actual decisions* to finish the incident. It is neither a human signature nor a production change ticket. Do not infer approval from repository ownership or CI checks.

**Consolidated proposal:** [PR #592](https://github.com/arcana-academy/academiaarcana/pull/592), branch `integration/p0-536-release-train-20261009`, combining #590 (GHCR release guard), #591 (Render Auto Deploy off), #585 (fallback + historical validation) and #584 (smoke concurrency). All must remain unmerged until independent authorization. CI must be inspected on the **latest** exact PR head; results from earlier SHAs cannot be inherited.

## Decisions that require human identity and primary evidence

| Gate | Decision authority | Required signed response in GitHub | Current state |
| --- | --- | --- | --- |
| D1 — secure release | Independent Security/Release reviewer **not identical to the PR author**; GitHub admin coordinates | GitHub reviewer login; `APPROVE` or `REQUEST_CHANGES` with tested HEAD; control of publication variable `GHCR_PUBLISH_APPROVED_SHA`; protected Environment `render-production-approval` configured with required reviewers and audited; merge, publish, deploy are **separate** approvals | **BLOCKED — independent signatory not named** |
| D2a — feedback PII lifecycle | Named Product/Trust owner and distinct Privacy/Legal reviewer | [#588](https://github.com/arcana-academy/academiaarcana/issues/588): choose A/B/C, describe retained PII, legal basis, deadlines, exemptions, deletion testing, owner, and reviewed migration in sandbox | **BLOCKED — no ratified policy** |
| D2b — education-history lifecycle | Named Product and Education owners, Data/Privacy sign-off as applicable | [#530](https://github.com/arcana-academy/academiaarcana/issues/530): scope `Page/Item/Attempt/page_progress`, retention/deletion event, pedagogical purposes, provenance and permitted archive, acceptance criteria | **BLOCKED — no ratified policy** |
| D3 — recoverable immutable OCI | Independent DR custodian, GHCR owner, security reviewer | Approve **off-GHCR** provider/account, owner, distinct deletion authority, bucket/path identifier **without credentials**, at-rest encryption/ACL, approved budget, retention deadline, backup hash receipt and who can access/revoke; authorize separate historical fallback digest publication and nonproduction restore registry | **BLOCKED — no approved durable backup/fallback** |
| D4 — cutover and rollback | Named Render service operator, release approver and independent QA | Preserve existing service ID, Free plan and Auto Deploy OFF. Approve exact image SHA/digest, zero secret leakage, smoke routes and authenticated RLS/Storage, go/no-go threshold, maintenance window, rollback/recovery point and abort authority | **BLOCKED — not a production deployment authorization** |

**Coordination**: GitHub issue #536 is assigned to `@arcana-academy` for triage only. Personal account ownership / CODEOWNERS nomination to the same account is **not** independent review. Automated CodeRabbit comments/status, even green, are not human approval. Do not invent a signer or select a data retention policy from CI evidence.

## Run order once approvals exist

1. **Obtain** named reviewers and D1/D2/D3 decisions; record actual issue comments and protected-environment settings evidence. Do **not** edit remote database or repository variables before these decisions.
2. Build/publish the pinned historical fallback to a specifically approved isolated namespace, recording the **second remote immutable manifest digest**; keep previous GHCR primary digest and retained tags untouched. This is a separate permissioned operation, **not** triggered by this document.
3. From an operator-approved machine, export the primary and fallback OCI bytes to an approved independent store. Pin source digests; record SHA256 receipts, full object/size inventory, provenance, ACL/cipher/retention, independent custodian. Retrieve each archive **from the independent store** and verify with `scripts/security/oci_recovery_536.py` (read-only; `--archive-sha` from original receipt).
4. Restore to a separately approved test registry; verify preserved digest (or seek new explicit approval for a digest mapping), boot actual non-root container; exercise liveness, readiness, CSP, Auth, real multiuser RLS/Storage and rollback from an independently retrieved artifact. Record QA evidence. Synthetic-only tests do not satisfy this step.
5. Confirm approvals for **each** distinct merge/publish/deploy and release window. Verify exact CI SHA again; keep Render Auto Deploy OFF and preserve the current git-backed live deployment until safe cutover.
6. Only then, under explicit operational authorization, deploy/cutover and monitor the real revision. Close [#536](https://github.com/arcana-academy/academiaarcana/issues/536) only after independent readback, rollback drill, privacy ratification and production acceptance evidence are linked.

**Current shortfall cannot be resolved by an automated agent without external human authority:** signer identity, protected environment settings, storage custody/budget, policy ratification and approved production change window. The rest of this packet is ready for review. **Default: NO-GO.**
