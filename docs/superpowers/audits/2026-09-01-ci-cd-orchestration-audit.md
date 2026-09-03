# CI/CD Orchestration Audit — 2026-09-01

## Scope

Audit of `.github/workflows/` on `feat/master-06-design-system-foundation` before implementation.

## Inventory

- `quality.yml` — principal application Quality Gate.
- `anti-dark-pattern.yml` — specialized UX safety check.
- `codeql.yml` — security/static analysis.
- `gitleaks.yml` — secret scanning.
- `scorecard.yml` — OpenSSF supply-chain/security posture.
- `claude.yml` — privileged AI automation triggered by PR/issue comments.

## Architecture decision

Maintain one principal Quality Gate. Keep security checks separate. Treat DeepSource, CodeRabbit, qlty, and similar analyzers as auxiliary checks. Do not create duplicate quality workflows.

## Findings

- `quality.yml`: valid principal gate, but missing the repository's dedicated accessibility test command (`npm run test:a11y`).
- `anti-dark-pattern.yml`: specialized check; no direct duplication of the principal gate.
- `codeql.yml`: security workflow; separate from application quality.
- `gitleaks.yml`: security workflow; separate from application quality.
- `scorecard.yml`: security/supply-chain workflow. Global `read-all` is broader than necessary and should be reviewed for least privilege.
- `claude.yml`: privileged automation. The job has write permissions for contents/issues/pull requests and `id-token: write`; because it can potentially create repository changes, it is the main source of possible event cascades. No confirmed loop was established by this audit.

## Corrections approved for implementation

1. Keep `quality.yml` as the only principal application Quality Gate.
2. Add the existing accessibility test command to `quality.yml`; do not create another workflow.
3. Preserve independent security workflows.
4. Harden `scorecard.yml` permissions where the action contract permits, without changing its purpose.
5. Do not introduce automatic code-fixing workflows.
6. Review Claude automation separately and avoid changes that could break its explicitly intended PR interaction without evidence of an actual loop.

## Non-goals

- No application code changes.
- No Design System changes.
- No speculative dependency or lockfile changes.
- No merge.
- No Master 07 advancement.
