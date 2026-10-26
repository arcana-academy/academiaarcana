import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "apply-f-series-triage.mjs");

function run(...args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: here,
    encoding: "utf8",
    env: { ...process.env, GITHUB_TOKEN: "synthetic-must-not-use", GH_TOKEN: "synthetic-must-not-use" },
  });
}

test("F7 mapping verifies all 95 references without mutations", () => {
  const result = run("--check");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PASS read-only F7 mapping: 95\/95 unique/);
});

test("default invocation is non-mutating dry run with all 95 rows", () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal((result.stdout.match(/\[dry-run\] #/g) ?? []).length, 95);
  assert.match(result.stdout, /#85 LACUNA -> BLOCKED_LACUNA/);
  assert.match(result.stdout, /#168 PARCIAL -> BLOCKED_PARCIAL/);
  assert.match(result.stdout, /#186 DOCUMENTADO -> BLOCKED_KEEP_OPEN/);
  assert.match(result.stdout, /0 comments; 0 issues closed/);
  assert.match(result.stdout, /non-closing reference/);
  assert.doesNotMatch(result.stdout, /still contains auto-closing references/);
});

test("issue write flag fails closed even when CI token variables exist", () => {
  const result = run("--apply");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /issue mutations are disabled/);
  assert.doesNotMatch(result.stdout, /\[dry-run\] #/);
});

test("unknown flags fail closed", () => {
  const result = run("--unexpected");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unsupported arguments/);
});
