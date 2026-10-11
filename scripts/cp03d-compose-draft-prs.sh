#!/usr/bin/env bash
# CP-03D: Compose two exact upstream draft PR heads on an ephemeral CI checkout.
# No push, merge to shared branches, hosted DB, or deployment is permitted.
set -euo pipefail

readonly PR576_SHA="6166dd8bef69e2432136d45ee1f0b62507249872"
readonly PR583_SHA="db74ee73013ea3b6aa35e684e9f482d4b603cadd"
readonly CP03C_SHA="9d836e05f877a308fec981b0930a889d2dbe5cfd"

test "$(git rev-parse "$CP03C_SHA")" = "$CP03C_SHA"
git merge-base --is-ancestor "$CP03C_SHA" HEAD

git fetch --no-tags origin refs/pull/576/head refs/pull/583/head
git cat-file -e "${PR576_SHA}^{commit}"
git cat-file -e "${PR583_SHA}^{commit}"
git diff --quiet
git diff --cached --quiet

git config user.name "Academia Arcana Isolated Validation"
git config user.email "ci-local@local.invalid"

resolve_sidebar_only() {
  local conflicted
  conflicted="$(git diff --name-only --diff-filter=U)"
  if [[ "$conflicted" != "src/components/layout/Sidebar.tsx" ]]; then
    echo "::error::CP03D BLOCKED: unexpected integration conflicts (no files resolved)" >&2
    git status --short
    return 1
  fi

  python3 - <<'PY'
import subprocess
from pathlib import Path
p = "src/components/layout/Sidebar.tsx"
ours = subprocess.check_output(["git", "show", ":2:" + p], text=True)
theirs = subprocess.check_output(["git", "show", ":3:" + p], text=True)
if "FlontsPortrait" in ours and "FlontsPortrait" in theirs:
    raise SystemExit("CP03D BLOCKED: two different Flonts implementations")
chosen = theirs if "FlontsPortrait" in theirs else ours
if 'className="aa-sidebar"' not in chosen or 'className="aa-sidebar-list"' not in chosen:
    raise SystemExit("CP03D BLOCKED: navigation contract changed")
if 'const Icon = item.icon;' not in chosen:
    anchor = '            const active = item.href === currentPath;'
    if chosen.count(anchor) != 1:
        raise SystemExit("CP03D BLOCKED: active link anchor changed")
    chosen = chosen.replace(anchor, anchor + '\n            const Icon = item.icon;')
    label = '                  <span>{item.label}</span>'
    replacement = ('                  <span className="aa-sidebar-icon" aria-hidden="true">\n'
                   '                    <Icon size={20} />\n'
                   '                  </span>\n'
                   '                  <span>{item.label}</span>')
    if chosen.count(label) != 1:
        raise SystemExit("CP03D BLOCKED: navigation label anchor changed")
    chosen = chosen.replace(label, replacement)
if "FlontsPortrait" not in chosen and ("FlontsPortrait" in ours or "FlontsPortrait" in theirs):
    raise SystemExit("CP03D BLOCKED: lost Flonts content")
if '<Icon size={20} />' not in chosen or 'aria-current={active ? "page" : undefined}' not in chosen:
    raise SystemExit("CP03D BLOCKED: lost accessible icons or current-page semantics")
Path(p).write_text(chosen)
print("CP03D: resolved isolated Sidebar.tsx union using both draft PR contracts")
PY
  git add src/components/layout/Sidebar.tsx
  git diff --cached --check
  git -c core.hooksPath=/dev/null commit --no-verify -m "test(cp03d): combine draft Sidebar changes in isolated checkout"
}

merge_exact_ref() {
  local sha="$1" description="$2"
  echo "CP03D: composing ${description} @ ${sha}"
  if ! git -c core.hooksPath=/dev/null merge --no-ff --no-edit "$sha"; then
    resolve_sidebar_only
  fi
  git diff --quiet
  git diff --cached --quiet
  echo "CP03D: ${description} merged into runner-local HEAD $(git rev-parse HEAD)"
}

merge_exact_ref "$PR576_SHA" "PR576"
merge_exact_ref "$PR583_SHA" "PR583"

git merge-base --is-ancestor "$PR576_SHA" HEAD
git merge-base --is-ancestor "$PR583_SHA" HEAD
git merge-base --is-ancestor "$CP03C_SHA" HEAD
test "$(git rev-parse refs/heads/main 2>/dev/null || true)" != "$(git rev-parse HEAD)"

node --input-type=module - <<'JS'
import { readFileSync } from "node:fs";
const sidebar = readFileSync("src/components/layout/Sidebar.tsx", "utf8");
if (!sidebar.includes("FlontsPortrait") || !sidebar.includes("const Icon = item.icon;") ||
    !sidebar.includes('aria-current={active ? "page" : undefined}') ||
    !sidebar.includes('aa-sidebar-list')) {
  throw new Error("CP03D BLOCKED: merged Sidebar lacks canonical functionality");
}
const css = readFileSync("src/app/globals.css", "utf8");
for (const text of ["overflow-y: auto;", "grid-template-columns: 13rem minmax(0, 1fr);", ".aa-sidebar-list"]) {
  if (!css.includes(text)) throw new Error("CP03D BLOCKED: lost MASTER-008 patch");
}
console.log("CP03D OK: local integration retains Flonts, iconography, selected-page semantics and MASTER-008");
JS

echo "CP03D FINAL RUNNER-LOCAL HEAD: $(git rev-parse HEAD)"
git --no-pager log -4 --format='%h %s'
