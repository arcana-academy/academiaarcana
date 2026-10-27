# Code-scanning final four — 2026-10-26

## Baseline

After PRs #832–#835, the Security → Code scanning page shows **4 open
alerts / 57 closed**. The public Scorecard API for the exact `main` commit
`23477d4` (the #835 merge) confirms the fixed checks and the remaining four:

| Check | Score at `23477d4` | Meaning |
| --- | ---: | --- |
| CodeQL (JS/TS + Actions) | no results | closed in #832 |
| Pinned-Dependencies | 10 | closed in #833 |
| Fuzzing | 10 | closed in #834 |
| SAST | 10 | closed in #834 (CodeQL + Hadolint configuration) |
| License | 9 | closed in #835 (SARIF threshold is 9) |
| **Code-Review** | **6 — 3/5 approved changesets** | remaining |
| **CI-Tests** | **2 — 1/5 merged PRs detected** | remaining |
| **Maintained** | **0 — repository younger than 90 days** | remaining |
| **CII-Best-Practices** | **0 — no OpenSSF badge effort detected** | remaining |

No check was disabled or suppressed to reach this state, and this pass
does not change any Scorecard policy either.

## CI-Tests — fixed going forward in this PR

### Why the measurement says 1/5 when tests run on every PR

Every PR in the current 30-commit window (#831, #832, #833, #834, #835)
has successful `github-actions` and `github-advanced-security` check runs
on its head SHA (verified through the REST API). Scorecard, however, reads
check **suites** through GraphQL with `checkSuites(first: 30)`, and a
commit in this repository carries 42–45 suites. On the #835 head, for
example, 27 suites from marketplace apps sit permanently in `queued`
(render, codemagic-ci-cd, azure-pipelines, codacy-production, qltysh,
mergify, datreeio, codecov, testquality-app, testspace-com, abaplint,
azure-boards, stepsecurity-actions-security, builder-io-integration,
vercel, posthog, webappio, check-run-reporter, socket-security, codeac-io,
autofix-ci, cirun-application, naming-conventions-bot,
testdriver-ai-code-review, autonoma-ai, netlify, coderabbitai). Only
PR #833's `github-actions` suites fall inside the first 30 (index 2); for
#831/#832/#834/#835 they start at index 33, so Scorecard detects CI tests
for exactly **1 of 5** PRs.

### Change in this PR

`.github/workflows/quality.yml` gains a `Publish CI test status` job that
runs after the Quality Gate on same-repository pull requests and republishes
its genuine outcome as a legacy commit status (`ci/tests`) on the PR head
SHA, linking back to the workflow run:

- Scorecard's `testsRunInCI` probe also accepts successful commit
  **statuses** whose context matches a CI/test pattern, and statuses are
  read through the REST API without the 30-suite truncation.
- The job reports `success` only when the Quality Gate (lint, typecheck,
  unit, a11y and e2e tests, build and image smoke) actually succeeded;
  failures/cancellations are published as `failure`/`error`. It is a
  republication of real evidence, not a synthetic pass.
- The job checks out nothing and executes no pull-request code. Its token
  has exactly one write permission, `statuses: write`, at job level; the
  workflow top level remains `contents: read`. Fork PRs are skipped.

New merged PRs will therefore be counted deterministically. The alert's
score rises as the current window's undetected PRs age out; it reaches 10
once every changeset in the trailing 30-commit window carries the status.

### Optional owner action that fixes the current window immediately

Revoking this repository's access from the unused apps that manufacture
queued suites (GitHub → Settings → GitHub Apps → Configure → repository
access) would bring each head below 30 suites, making the already-existing
`github-actions` suites of #831/#832/#834/#835 visible to Scorecard on the
next run. Audit each app first — some queued suites belong to tools that
report through commit statuses or comments instead (CodeRabbit, Qlty,
Render, StepSecurity, autofix.ci) and should only be removed if truly
unused. This account-level change cannot be made from the repository or
with the automation token.

## Code-Review — process hardened in this PR

Scorecard counts a changeset as reviewed only when someone other than the
author approves it (the merger counts when merger ≠ author). In the
trailing window, #832/#833/#834 carry Sourcery `APPROVED` reviews, while
#831 (comments only) and #835 (merged with an owner admin bypass after
Sourcery reported its 7-day review budget exhausted) do not — hence 3/5.

This repository has a single human collaborator account, and GitHub does
not let an author approve their own pull request, so a non-author second
reviewer has to come from a review bot or a second human account. Sourcery
already fills that role when its budget allows. This PR additionally
enables CodeRabbit's current **Automatic Approvals** setting in
`.coderabbit.yaml` (replacing the deprecated `request_changes_workflow`
alias, which was already on):

- CodeRabbit requests changes while it has actionable comments and
  formally approves once the latest commit is reviewed, its threads are
  resolved, and pre-merge checks pass;
- `allow_author_approval: false` prevents the PR author from forcing an
  approval with `@coderabbitai approve`;
- because the repository has fewer than 10 stars, CodeRabbit does not
  auto-review: a review must be triggered per PR with
  `@coderabbitai review` (done on this PR), after which the automatic
  approval rules apply.

History cannot be rewritten honestly: #831 and #835 were merged without a
non-author approval, so the alert stays open until their commits leave the
trailing window (or a genuine second reviewer reviews them). If this PR is
approved by CodeRabbit/Sourcery before merge, the window becomes 4/6
(score 7). From here on, do not merge pull requests — including via admin
bypass — until a non-author approval exists; each such merge resets the
count. Adding a second human reviewer remains the strongest option.

## Maintained — resolves by calendar, not by code

The repository was created on **2026-08-30**. Scorecard's
`createdRecently` probe returns the minimum score for any project younger
than 90 days, unconditionally. The repository is far above the activity
thresholds (commits and issue activity in the last 90 days), so the check
is expected to jump to its activity-based score as soon as the repository
passes 90 days of age, on **2026-11-28**, and the alert to close with the
following weekly/push Scorecard run. There is no repository change that
accelerates a creation date.

## CII-Best-Practices — blocked by an explicit owner decision

The probe queries bestpractices.dev for this repository URL; today it
returns no project. Closing the code-scanning alert requires the
**Passing** badge (score 5, which meets the SARIF threshold; merely
registering shows as InProgress, score 2, and the alert remains).

Passing is a self-certification by a project maintainer at
bestpractices.dev, and its very first MUST criterion is that **the
software be released under a FLOSS (free/libre, open-source) license**.
The owners deliberately chose the opposite in PR #835: a proprietary
"all rights reserved" notice that grants no rights. With that decision in
force, the Passing badge — and therefore this alert — **cannot** be
earned without reversing the licence decision (e.g. adopting MIT or
Apache-2.0, which would also move License from 9 to 10). That reversal is
a business/legal choice that automation must not make unilaterally.

If the owners ever make it, the remaining steps are:

1. adopt the FLOSS license and update `LICENSE`/`package.json`;
2. sign in to <https://www.bestpractices.dev> with the owner GitHub
   account, add the project by repository URL;
3. complete the Passing self-assessment with evidence links (this
   repository already satisfies most technical criteria: SECURITY.md,
   CI tests incl. fuzzing, CodeQL/Hadolint SAST, Dependabot, pinned
   dependencies; contribution/conduct documents may need to be added);
4. when the badge reaches Passing, the next Scorecard run closes the
   alert — no repository change is required for detection, though adding
   the badge to the README is conventional.

Until then the alert is accepted as "not applicable to a proprietary
product", with this rationale recorded instead of a misleading fix.

## Verification

- Public Scorecard API at `23477d4`: aggregate **8.1**, with the check
  scores in the table above (Fuzzing 10, SAST 10, License 9 confirm the
  previous three passes; Code-Review 6 and CI-Tests 2 reproduce exactly
  under the analyses in this document).
- On this PR, the new publisher job must produce a `ci/tests` commit
  status on the PR head pointing at the Quality Gate run; that is the
  evidence the probe consumes. Quality Gate, CodeQL and the
  supply-chain guards remain the merge gate.
