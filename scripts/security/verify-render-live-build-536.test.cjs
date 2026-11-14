"use strict";
const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { declaredBuildCommand, verifyLiveBuildContract } = require("./verify-render-live-build-536.cjs");

const canonical = "node scripts/security/assert-build-secret-isolation-536.cjs && node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts && npm rebuild unrs-resolver --ignore-scripts=false && npm run build";
const observed = "node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts && npm rebuild esbuild unrs-resolver --ignore-scripts=false && npm run build";
const yaml = (command = canonical) => `services:\n  - type: web\n    name: academiaarcana\n    autoDeployTrigger: "off"\n    buildCommand: ${command}\n`;
const service = (command = canonical) => ({
  id: "srv-dauor697lnhs739cicag",
  name: "academiaarcana",
  ownerId: "tea-daa6v6tg1s2s73cb5gi0",
  repo: "https://github.com/arcana-academy/academiaarcana",
  branch: "main",
  autoDeploy: "no",
  autoDeployTrigger: "off",
  serviceDetails: {
    runtime: "node",
    plan: "free",
    healthCheckPath: "/api/health",
    envSpecificDetails: { buildCommand: command },
  },
});
const rejects = fn => assert.throws(fn, /NOT VERIFIED/);

describe("P0 #536: actual Render build contract vs versioned blueprint", () => {
  it("accepts the exact canonical build command in synthetic metadata", () => {
    assert.equal(declaredBuildCommand(yaml()), canonical);
    assert.equal(verifyLiveBuildContract(service(), yaml()), true);
  });

  it("rejects the observed live command, even with a correct repository blueprint", () => {
    rejects(() => verifyLiveBuildContract(service(observed), yaml()));
  });

  it("rejects missing, reordered, or ineffective early guards", () => {
    for (const command of [
      canonical.replace("node scripts/security/assert-build-secret-isolation-536.cjs && ", ""),
      `npm ci --ignore-scripts && ${canonical}`,
      canonical.replace("npm ci --ignore-scripts", "npm ci"),
      canonical.replace(" && npm run build", " && echo success"),
    ]) rejects(() => declaredBuildCommand(yaml(command)));
  });

  it("rejects unexpected added shell steps or a different dependency rebuild", () => {
    rejects(() => verifyLiveBuildContract(service(canonical + " && echo unsafe"), yaml()));
    rejects(() => verifyLiveBuildContract(service(observed), yaml(observed)));
  });

  it("requires the release freeze in both metadata and the blueprint", () => {
    rejects(() => declaredBuildCommand(yaml().replace('autoDeployTrigger: "off"', 'autoDeployTrigger: commit')));
    rejects(() => verifyLiveBuildContract({ ...service(), autoDeploy: "yes" }, yaml()));
    rejects(() => verifyLiveBuildContract({ ...service(), autoDeployTrigger: "checksPass" }, yaml()));
  });

  it("rejects a foreign service, branch, workspace, source or paid plan", () => {
    const changes = [
      { id: "srv-other" }, { ownerId: "tea-other" },
      { branch: "feature" }, { repo: "https://github.com/another/repo" },
      { serviceDetails: { ...service().serviceDetails, plan: "starter" } },
      { serviceDetails: { ...service().serviceDetails, runtime: "image" } },
    ];
    for (const delta of changes) rejects(() => verifyLiveBuildContract({ ...service(), ...delta }, yaml()));
  });

  it("rejects malformed input without disclosing synthetic canaries", () => {
    const canary = "AA536_PRIVATE_CANARY_NEVER_PRINT";
    const script = path.join(__dirname, "verify-render-live-build-536.cjs");
    const run = spawnSync(process.execPath, [script], {
      input: JSON.stringify({ ...service(observed), hiddenSecret: canary }),
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(run.status, 1);
    assert.doesNotMatch(run.stdout + run.stderr, /AA536_PRIVATE_CANARY_NEVER_PRINT/);
    assert.doesNotMatch(run.stdout + run.stderr, /hiddenSecret/);
    assert.match(run.stderr, /NO-GO/);
  });
});
