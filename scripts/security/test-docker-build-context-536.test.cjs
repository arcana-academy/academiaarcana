/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

// C133: source-only contract. Docker Engine tests are separate and remain BLOCKED.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "../..");
const ignoreFile = path.join(root, ".dockerignore");
const dockerFile = path.join(root, "Dockerfile");

function activePatterns() {
  return fs.readFileSync(ignoreFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

test("C133 excludes npm and environment credential files at every context depth", () => {
  const rules = activePatterns();
  // Docker documents ** as matching any number of directories, including zero.
  // The filenames below are synthetic; no actual credentials are read.
  for (const expected of ["**/.npmrc", "**/.env", "**/.env.*"]) {
    assert.ok(rules.includes(expected), `Missing build-context exclusion: ${expected}`);
  }
  assert.equal(
    rules.some((line) => line.startsWith("!")),
    false,
    "Review negate/re-include rules before claiming sensitive-file exclusions",
  );
  assert.equal(
    fs.existsSync(path.join(root, "Dockerfile.dockerignore")),
    false,
    "A Dockerfile-specific ignore file overrides the root .dockerignore",
  );
});

test("C133 protects the existing recursive COPY without changing the image recipe", () => {
  const source = fs.readFileSync(dockerFile, "utf8");
  assert.match(source, /^COPY \. \.$/m);
  assert.match(source, /^COPY package\.json package-lock\.json \.\/$/m);
  assert.match(source, /^FROM --platform=linux\/amd64 node:24-bookworm-slim@sha256:/m);
});
