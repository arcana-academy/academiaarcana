# Code-scanning continuation — 2026-10-26 (third pass)

## Scope and method

Continuation of `codeql-remediation-2026-10-26.md` (PR #832) and
`scorecard-pinned-dependencies-2026-10-26.md` (PR #833). The code-scanning
REST API still returns `403` to the automation token, so the alerts open on
the Security → Code scanning page were reproduced exactly, again with a
temporary workflow (removed in this PR, not merged):

- CodeQL (pinned `github/codeql-action` v4.39.1, CLI 2.27.3) was re-run
  with `upload: false` for both configured languages against the current
  tree and every SARIF result was printed as a check-run annotation.
  Result: **0 results in `javascript-typescript`, 0 in `actions`** — PR #832
  remains fully effective, nothing regressed.
- The OpenSSF Scorecard artifact uploaded from `main` at `c3602e8`
  (run `40399219363`, Scorecard v5.6.0) was downloaded inside a runner and
  read the same way. Result: **7 open alerts**, listed below. This is a
  fuller reading than the second pass recorded: the artifact contains
  several SARIF `runs`, and the first annotation-based reads were truncated
  by GitHub's per-step annotation cap, which hid four of the seven.

| Rule | Score | Disposition |
| --- | ---: | --- |
| `FuzzingID` | 0 | **Fixed in this PR** |
| `SASTID` | 8 (12/30 commits) | **Mitigated in this PR**; measurement caveat below |
| `CITestsID` | 2 (1/4 merged PRs) | Root cause identified; **owner-admin action** |
| `CodeReviewID` | 5 (2/4 changesets) | Process; needs non-author approvals on every PR |
| `LicenseID` | 0 | Owner legal decision — **not made in this PR** |
| `CIIBestPracticesID` | 0 | External registration — **owner action** |
| `MaintainedID` | 0 | Self-resolves with time (repo age) |

## Fixed: `FuzzingID`

Scorecard's Fuzzing check (v5.6.0 `languageFuzzSpecs`) recognises
property-based testing for TypeScript via imports of `fast-check` or
`@fast-check/{ava,jest,vitest}` in `*.ts`/`*.tsx` files.

- `fast-check` was added as a devDependency (pure JS, no install scripts;
  the dependency-lifecycle allowlist verification still passes).
- `src/infrastructure/integrations/oauth-transaction-state.property.test.ts`
  fuzzes the module that parses the attacker-controlled OAuth `state`
  parameter: round-trip acceptance, never-throws/Boolean-only behaviour
  for arbitrary generated strings, rejection of non-canonical nonces,
  tampered nonce/signature segments, wrong subjects, and extra segments.
  These run in the normal Vitest suite, so the Quality Gate exercises them
  on every pull request.

Expected effect: Fuzzing score 0 → 10, alert closes on the next Scorecard
run on `main`.

## Mitigated: `SASTID` — and the check-suite truncation that distorts it

The old explanation ("score trends up as CodeQL-checked PRs land") is
incomplete for this repository. Replicating Scorecard's logic over the
last 30 default-branch commits (4 distinct merged PRs: #821, #831, #832,
#833) with the REST API shows every PR head actually has a completed,
successful `github-advanced-security` (code-scanning) check **and**
successful `github-actions` checks — i.e. SAST 30/30 and CI-Tests 4/4 in
reality.

Scorecard, however, reads check **suites** through GraphQL with
`checkSuites(first: 30)` (`checksToAnalyze = 30`, still unfixed upstream
in v5.6.0/main). Each commit here has **43–44 check suites**, because
roughly 27 installed marketplace apps (abaplint, azure-*, codacy,
mergify, vercel, netlify, codecov, qltysh, socket-security, posthog, …)
create permanently-`queued` suites on every push. For PRs #821/#831/#832
those junk suites were created first, so `github-actions` only appears at
suite index 33–34 and `github-advanced-security` at 42–43 — beyond what
Scorecard ever sees. For PR #833 the race happened to order the real
suites first (indices 2–13). That exactly explains the reported numbers:
SAST "12/30" is precisely the 12 commits belonging to PR #833, and
CI-Tests "1/4" is PR #833 alone.

Changes / actions:

1. **This PR adds a second, genuine SAST surface**: `.github/workflows/hadolint.yml`
   lints the `Dockerfile` with `hadolint/hadolint-action` v3.5.0 pinned by
   full commit SHA (warning/error findings fail). Hadolint is a real
   Dockerfile security linter, and it is one of the SAST workflows
   Scorecard recognises by configuration, which makes the SAST score
   deterministic instead of depending on suite-ordering races. CodeQL
   remains the primary SAST for JS/TS and Actions.
2. **Owner-admin action (also fixes `CITestsID`)**: uninstall or suspend
   the unused GitHub Apps that manufacture queued check suites
   (GitHub → Settings → Integrations → GitHub Apps), keeping only the
   apps actually used (e.g. Sourcery, CodeRabbit, Supabase, pre-commit.ci,
   Render). Once a commit has ≤30 suites, Scorecard can see the real
   `github-actions`/`github-advanced-security` suites again and both
   CI-Tests and the proportional SAST score measure reality. This cannot
   be done from the repository or with the current automation token
   (`GET /user/installations` exposes only the agent's own app).
   Publishing a synthetic commit status or check run just to be counted
   was rejected: it would add `statuses: write`/`checks: write` to a
   workflow token (a Scorecard Token-Permissions regression) to disguise
   what is purely a measurement limitation.

## `CodeReviewID` (2/4)

Scorecard counts a changeset as approved only when an approval (or the
merge itself) comes from someone other than the PR author. This
repository has a single collaborator account, which authors and merges
its own PRs; the two approvals in the current window are Sourcery's
approving reviews on PRs #832/#833. PRs #821/#831 received no approving
review (comments/`skipped` only). No code change fixes history: going
forward, every PR should land an approving non-author review (Sourcery
or, preferably, a second human reviewer) before merge — as required by
the already-proposed ruleset in
`docs/security/rulesets/main-c2-hardening.json`, whose activation remains
an owner-admin step (branch-protection APIs return `403` to automation).

## Remaining alerts (unchanged by this PR, with rationale)

- **`LicenseID` (0)** — no `LICENSE` file exists, and no licence model was
  selected in this round, so none was added. For the record:
  Scorecard gives 9/10 for *any* licence file and 10/10 for an FSF/OSI
  one, and the SARIF policy threshold for License is 9, so an explicit
  proprietary "all rights reserved" notice — which grants no rights and
  merely states the current default legal position — would already close
  this alert if the owners choose it. Choosing the model and the
  copyright holder is a legal decision that must come from the owners.
- **`CIIBestPracticesID` (0)** — requires registering the project with
  the OpenSSF Best Practices Badge program at bestpractices.dev and
  attesting to its criteria. The alert clears at the "Passing" badge
  (score 5 meets the SARIF threshold); Gold is required for 10/10.
  Registration and attestation must be performed by the owners with
  their own account; it cannot be done in a pull request.
- **`MaintainedID` (0)** — the repository was created on 2026-08-30, and
  Scorecard returns the minimum score for any project younger than 90
  days. This self-resolves on **2026-11-28** provided commit/issue
  activity continues (both are far above the required threshold).

## Verification

- Temporary SARIF audit (since removed): CodeQL **0 / 0** results;
  Scorecard main artifact **7 results**, itemised above.
- Local (Node 24 / npm 11.19.1): `lint` ✅ · `typecheck` ✅ ·
  `npm test` ✅ (304 files / 1875 tests, including the 5 new
  property-based ones); `verify-supply-chain-workflows.cjs` passes across
  28 workflow files; `verify-dependency-lifecycle-scripts.cjs` passes
  after adding `fast-check`.
- After this PR merges, the next Scorecard run on `main` should show
  `FuzzingID` closed (10) and `SASTID` at 10 via the configured-tool
  path; the remaining five alerts close via the owner actions and dates
  documented above.
