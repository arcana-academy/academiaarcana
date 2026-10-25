# Academia Arcana — C99 isolated assistive-technology QA protocol (NO-GO)

## Frozen test target
- Repository: `arcana-academy/academiaarcana`.
- Isolated diagnostic branch: `work/aa-c99-a11y-browser-proof-20261024`.
- Automated browser-proof HEAD before this protocol: `8e77cd23b647a2ad225e59b270111c5649a5b2f1`.
- Baseline: `af012a2d04dd14be734ee234e26aaf201d954ea6`.
- Existing automated proof: GitHub Actions [#40134542094](https://github.com/arcana-academy/academiaarcana/actions/runs/40134542094), **SUCCESS**, 8/8 C99 unit tests, isolated lint and tsc, 1/1 Chrome keyboard/export test. **Do not rerun without a material change.**

This file prepares **manual assistive-technology verification**, not an accessibility certification. The diagnostic URL, test data and scripts must never be merged or deployed. The C99 editor intentionally displays **textual media references**: there are no playable audio files, media uploads, or network media integration to certify.

## Mandatory isolation and operator preconditions
1. An explicitly authorized, functioning test executor must be available. Confirm shell response, not only online status. If all executors are offline: **BLOCKED**, stop without creating alternative production environments.
2. Use a clean, disposable checkout of the frozen branch HEAD, never `main` or a production workspace. First capture `git rev-parse HEAD`, `git status --porcelain`, OS/build, Node/npm, browser and AT versions. Stop on drift or a dirty baseline; do not silently reset.
3. Use Node 24, npm 11.19.1, and `npm ci --ignore-scripts` with reviewed native rebuilds `npm rebuild esbuild unrs-resolver --ignore-scripts=false`. No secrets, external paid calls, hosted Supabase, real users or production tokens.
4. Bind the local fixture only to `127.0.0.1` (not `0.0.0.0`); synthetic values only. No public server, Render, deployment, GHCR, DNS change, uploaded evidence containing personal data or modification of visual baselines.
5. The disposable test fixture is `/c99-accessibility-proof`; start using `npm run dev -- --hostname 127.0.0.1 --port 3000` in the isolated checkout. Confirm that the address is accessible only from the test machine. If port 3000 is occupied, stop, record the conflict and adapt the isolated test setup without changing existing services.
6. If operator or source revision changes, collect a new approved run identity. Previous green results remain historical evidence and cannot substitute for a newly changed implementation.

## Execution matrix — manual observation required
For each available platform record exact **browser version**, **screen-reader version**, OS, device, test timestamp and operator. At least one independent assistive-technology reviewer must perform and sign off; an author checking their own implementation is not independent review.

| ID | Assistive pairing | Test objective | Expected accessible behavior |
| --- | --- | --- | --- |
| C99-AT-01 | Windows / Chrome / NVDA | Navigate headings, regions and block landmarks by screen-reader shortcuts | Page title, editor, preview region and distinct block headings announced in reading order |
| C99-AT-02 | Windows / Chrome / NVDA | Expand block 1 details, select referenced audio, edit transcript | Type selector has accessible name; audio option announced; transcript has specific name; original authored alternative retained when type changes |
| C99-AT-03 | Windows / Chrome / NVDA | Keyboard-only preview, focused elements and TXT download | Tab/Shift+Tab and Enter/Space activation work; keyboard focus remains perceivable; no keyboard trap; preview/TXT identify audio and free-type blocks, omit decorative image |
| C99-AT-04 | macOS / Safari / VoiceOver | Repeat reading-preview and edit workflow | Controls and author text are announced with correct names, roles, states and order; no misleading content labels |
| C99-AT-05 | Android / Chrome / TalkBack | Explore by touch/swipe, transcript and save | Controls can be discovered/activated; transcript announced accurately; local edits do not trigger server save until explicit save |
| C99-AT-06 | Representative supported browser + keyboard | Zoom 200%/400%, reflow and visual focus, viewport variations | No loss of information/function or hidden controls at applicable WCAG 2.2 AA viewport/reflow conditions |
| C99-AT-07 | Representative supported browser + AT | Missing alternatives and free-type edge cases | Missing alternative flagged meaningfully; free type identified as `Tipo livre: …`; long/unusual labels remain understandable, not announced as generic prose |
| C99-AT-08 | Independent accessibility reviewer | Review WCAG 2.2 AA criteria applicable to C99 and authenticated real surface, separately from synthetic fixture | Criterion-by-criterion findings and evidence; no claim of whole-site WCAG conformance from one isolated page |

**C99-AT-01 through 05 need real, running AT.** Automated DOM roles, screenshots and Playwright tests do not count as NVDA/VoiceOver/TalkBack results. An unavailable platform stays BLOCKED rather than being marked PASS, and cross-platform equivalence must not be assumed.

## Ordered manual script (repeat per relevant assistive pairing)
1. Confirm `http://127.0.0.1:3000/c99-accessibility-proof` is local and shows only synthetic fixtures. Record initial heading and explicit save count of 0.
2. Navigate with *keyboard alone* to `Acessibilidade do bloco 1`; expand with Enter/Space; locate the labelled `Tipo do bloco 1` select.
3. Change image to audio, inspect the labelled transcript field and verify the preserved text `Descrição autoral original.`; replace it with `Transcrição autoral revisada após mudança de tipo.`.
4. Open `Ver prévia de leitura acessível (rascunho local)` and traverse the reading flow. Confirm `Áudio — referência textual`, the transcript, `Tipo livre: notation-experimental` and `Três notas ascendentes.`; decorative `moldura-decorativa-ficticia.png` must be absent from the accessible reading flow.
5. Download the accessible TXT with a keyboard activation; verify the text output has audio and free-type labels, includes the transcript and excludes the decorative image. Confirm save count remains 0.
6. Activate `Salvar página` explicitly and confirm the synthetic save count becomes 1; check announcement, focus retention and error feedback if applicable.
7. Run the zoom/reflow/focus and missing-alternative observations; test representative authenticated pages only in a separately approved synthetic and protected environment.
8. Independently record and classify each unexpected behavior with precise reproduction steps. Do not edit source, modify baselines or approve publishing from this protocol.

## Evidence and result recording (no fabricated PASS)
For every row, record:
`case_id | product_SHA | test_SHA | operator/role | OS | browser/version | AT/version | date/time UTC | steps | expected | observed verbatim announcement | PASS/FAIL/BLOCKED | evidence path/hash | issue/PR link`.

Save text logs and synthetic screenshots in the authorized isolated test directory with narrow file permissions; redact names, tokens and personal content. Do not upload sensitive recordings. Record failure type (actual application defect vs environment/AT limitation vs unrelated baseline). Only reproduce-and-prove an application defect before making a scoped patch in a separate isolated branch; then rerun only impacted cases.

## Governance / release gate (historical facts, NOT approval)
- PR [#805](https://github.com/arcana-academy/academiaarcana/pull/805) has product HEAD `b0c0cb841b594b31a2bde13e499f7be8593c5362` and was merged at **2026-10-24 18:21:57 UTC** as `7f88bdaab804bcc1b8f1ffcbe5fba024c700312f`.
- Timeline shows `ready_for_review` at **2026-10-24 17:45:00 UTC** and then merge; **zero formal reviews** and **zero review threads** were returned by the GitHub integration. Bot comments do not constitute independent authorization. Human-independent sign-off therefore **BLOCKED**.
- Branch `main` is shown as protected, but the branch-protection read returned HTTP **403** and active rulesets list was empty. This does *not* establish whether legacy protection, bypass or a particular waiver was in effect. A repository administrator/security reviewer must check archived audit/ruleset evidence and document a justified remediation without retroactively inventing approval.
- Any protected release continues NO-GO pending independent QA/a11y, security/release, custody and operational evidence, including issues #536/#593/#594/#595 and C03/ORG02 where applicable.
- **No merge, GHCR, Render deploy, public publication, infrastructure, hosted data, real-user contact, payment, new subscription or independent-review impersonation.**

## Closure criteria
- **PASS technical baseline**: only previously observed automated C99 outcomes, anchored by GitHub Actions #40134542094. This protocol is not an additional PASS by itself.
- **PASS assistive**: all selected/manual pairings actually executed, exceptions either fixed with fresh evidence or documented as nonapplicable with reviewer justification, and independent sign-off attached.
- **PASS governance**: independent review authority, recorded decision about #805 merge deviation, and applicable release gates evidenced and approved; never extrapolate from CI success.
- Otherwise **BLOCKED/NO-GO**, with next material dependency identified and no redundant tests.

