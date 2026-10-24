"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const root = resolve(__dirname, "../..");
const read = (name) => readFileSync(resolve(root, name), "utf8");

test("the Render/npm Node 24 baseline excludes the vulnerable releases", () => {
  const manifest = JSON.parse(read("package.json"));
  const lockfile = JSON.parse(read("package-lock.json"));

  assert.equal(read(".nvmrc").trim(), "24.22.1");
  assert.equal(manifest.engines.node, ">=24.22.1 <25");
  assert.equal(manifest.devEngines.runtime.version, manifest.engines.node);
  assert.equal(manifest.devEngines.runtime.onFail, "error");
  assert.equal(lockfile.packages[""].engines.node, manifest.engines.node);
});

test("both production Docker stages use patched Node and refresh Debian CA certificates", () => {
  const dockerfile = read("Dockerfile");
  const stages = dockerfile.split(/(?=^FROM --platform=linux\/amd64 )/m).filter(Boolean);
  assert.equal(stages.length, 2);

  for (const stage of ["builder", "runtime"]) {
    const expected = `FROM --platform=linux/amd64 node:24.22.1-bookworm-slim AS ${stage}`;
    const content = stages.find((entry) => entry.startsWith(expected));
    assert.ok(content, `missing patched Docker stage ${stage}`);
    assert.match(content, /RUN apt-get update/);
    assert.match(content, /apt-get install --yes --no-install-recommends ca-certificates/);
    assert.match(content, /update-ca-certificates/);
    assert.match(content, /rm -rf \/var\/lib\/apt\/lists\/\*/);
    assert.ok(content.indexOf("apt-get update") < content.indexOf("WORKDIR /app"));
  }

  assert.match(dockerfile, /USER node/);
  assert.doesNotMatch(dockerfile, /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*0/);
});

test("the canonical Quality Gate installs the approved Node release and runs these checks", () => {
  const workflow = read(".github/workflows/quality.yml");
  assert.match(workflow, /node-version-file:\s*\.nvmrc/);
  assert.match(workflow, /node --test scripts\/security\/node-ca-baseline\.test\.cjs/);
});

test("isolated development rejects unpatched Node versions before installing dependencies", () => {
  const setup = read(".devcontainer/setup.sh");
  assert.match(setup, /minor > 22 \|\| \(minor === 22 && patch >= 1\)/);
  assert.ok(setup.indexOf("process.versions.node") < setup.indexOf("npm ci --ignore-scripts"));
});

test("Docker build context continues to exclude local certificate and private-key files", () => {
  const ignored = read(".dockerignore");
  assert.match(ignored, /^\*\.pem$/m);
  assert.match(ignored, /^\*\*\/\*\.pem$/m);
  assert.match(ignored, /^\*\.key$/m);
});
