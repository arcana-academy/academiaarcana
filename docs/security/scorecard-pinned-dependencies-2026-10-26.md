# Scorecard code-scanning remediation — 2026-10-26 (continued)

## Scope and method

Continuation of `codeql-remediation-2026-10-26.md` (PR #832). The
code-scanning page aggregates more than CodeQL: the OpenSSF Scorecard
workflow (`.github/workflows/scorecard.yml`) also uploads SARIF there.
Re-running the temporary SARIF audit after PR #832 confirmed **CodeQL is at
0 results** in both languages, while the Scorecard SARIF uploaded from
`main` (run `40388032264`) contained **21 results**:

| Rule | Count | Disposition |
| --- | ---: | --- |
| `PinnedDependenciesID` | 18 | **Fixed in this PR** |
| `LicenseID` (score 0) | 1 | Not fixable in code — see below |
| `FuzzingID` (score 0) | 1 | Not fixable in code — see below |
| `SASTID` (score 7) | 1 | Not fixable in code — see below |

The temporary audit workflow was removed again after verification; the
standing `codeql.yml` and `scorecard.yml` analyses are unchanged.

## Fix: `PinnedDependenciesID`

Scorecard's `isNpmUnpinnedDownload` treats **any** `npm install` (except
`npm ci`, or a git URL pinned to a full commit hash) as unpinned, regardless
of an explicit version. The flagged surface was:

- `npm install --global npm@11.19.1 --ignore-scripts` in 9 workflows, the
  `Dockerfile`, and `.devcontainer/setup.sh`;
- `npm exec -- playwright install --with-deps chromium` in 4 workflows
  (tokenised by Scorecard as an npm install);
- `FROM node:24-bookworm-slim` without a digest in both Dockerfile stages.

Changes:

1. **npm pin via Corepack.** Every global npm install is replaced by
   `corepack enable npm` + `corepack prepare npm@11.19.1 --activate`.
   Corepack ships with Node 24, resolves the exact version already declared
   in `package.json` (`packageManager: npm@11.19.1`), and verifies the
   download signature. Note: bare `corepack enable` does **not** create the
   npm shim in Node 24's Corepack, so the manager is named explicitly
   (verified locally: `npm --version` → `11.19.1` both inside and outside
   the repository, and `npm ci` completes on the pinned npm).
2. **Playwright via the local binary.** `npm exec -- playwright install`
   becomes `./node_modules/.bin/playwright install` (Playwright is a locked
   devDependency installed by `npm ci` before this step in every workflow).
3. **Docker images pinned by digest.** Both stages now use
   `node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205`,
   the digest Scorecard resolved for the tag. Dependabot's docker ecosystem
   already tracks the Dockerfile weekly and updates digest pins.

Verification: Scorecard CLI v5.6.0 in `--local` mode against the fixed
tree reports **Pinned-Dependencies score 10** — "all dependencies are
pinned" (15/15 npmCommand, 2/2 containerImage, 59/59 GitHub-owned and
19/19 third-party actions already pinned). CodeQL remained at 0 results in
the same audit run.

## Remaining Scorecard results (accepted, with rationale)

- **`LicenseID` (0)** — the repository has no `LICENSE` file. Choosing a
  licence is a legal/ownership decision, not an engineering fix; it must
  not be invented by automation. Left for the repository owners.
- **`FuzzingID` (0)** — no fuzzing integration (OSS-Fuzz / ClusterFuzzLite)
  exists. Adopting one is a programme decision (fuzz targets, e.g. Jazzer.js
  over the OAuth-state and payload parsers, plus CI time), recommended as a
  separate, explicitly scoped PR rather than bundled here.
- **`SASTID` (7)** — CodeQL *is* detected; the score reflects SAST coverage
  across recent default-branch commits, which only trends up as
  CodeQL-checked pull requests land. Nothing in the codebase changes this.

These three will remain visible on the code-scanning page until the owners
take the decisions above; they are not defects introduced by this change.
