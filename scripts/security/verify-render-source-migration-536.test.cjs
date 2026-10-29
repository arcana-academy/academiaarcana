"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  verifyCurrentGitSource, verifyProposedImageSource,
} = require("./verify-render-source-migration-536.cjs");

const image = "ghcr.io/arcana-academy/academiaarcana@sha256:" + "a".repeat(64);
const before = () => ({
  id: "srv-dauor697lnhs739cicag", type: "web_service",
  name: "academiaarcana", ownerId: "tea-daa6v6tg1s2s73cb5gi0",
  environmentId: "evm-dauor697lnhs739cibr0",
  autoDeploy: "no", autoDeployTrigger: "off",
  branch: "main", repo: "https://github.com/arcana-academy/academiaarcana",
  suspended: "not_suspended",
  serviceDetails: {
    runtime: "node", plan: "free", region: "ohio", numInstances: 1,
    healthCheckPath: "/api/health", url: "https://academiaarcana.onrender.com",
    previews: { generation: "off" }, pullRequestPreviewsEnabled: "no",
  },
});
const after = () => ({
  ...before(), serviceDetails: { ...before().serviceDetails, runtime: "image",
    imagePath: image },
});
const rejects = fn => assert.throws(fn, /migration contract rejected/);

describe("P0 #536 read-only migration source guard", () => {
  it("accepts the exact frozen current Git-backed Free service", () => {
    assert.equal(verifyCurrentGitSource(before()), true);
  });
  it("does not confuse a Git-backed service with a migrated image source", () => {
    rejects(() => verifyProposedImageSource(before(), before(), image));
  });
  it("accepts only the original service ID with an exact reviewed digest", () => {
    assert.equal(verifyProposedImageSource(before(), after(), image), true);
    rejects(() => verifyProposedImageSource(before(), { ...after(), id: "srv-another" }, image));
    rejects(() => verifyProposedImageSource(before(), after(), image.replace(/a$/, "b")));
  });
  it("rejects mutable, foreign and malformed image references", () => {
    for (const value of ["ghcr.io/arcana-academy/academiaarcana:latest",
      "docker.io/example/app@sha256:" + "a".repeat(64), "ghcr.io/arcana-academy/academiaarcana@sha256:xyz"]) {
      rejects(() => verifyProposedImageSource(before(), after(), value));
    }
  });
  it("rejects unsafe image metadata (missing, mismatched or conflicting paths)", () => {
    rejects(() => verifyProposedImageSource(before(),
      { ...after(), serviceDetails: { ...after().serviceDetails, imagePath: undefined } }, image));
    rejects(() => verifyProposedImageSource(before(),
      { ...after(), imagePath: "docker.io/unapproved/other" }, image));
    assert.equal(verifyProposedImageSource(before(),
      { ...after(), imagePath: image }, image), true);
  });
  it("rejects any accidental reactivation of automatic deployment", () => {
    for (const trigger of ["commit", "checksPass", undefined]) {
      rejects(() => verifyProposedImageSource(before(), {
        ...after(), autoDeployTrigger: trigger,
      }, image));
    }
    rejects(() => verifyProposedImageSource(before(), {
      ...after(), autoDeploy: "yes",
    }, image));
  });
  it("rejects a different workspace, environment or service name before and after migration", () => {
    const changes = [
      { ownerId: "tea-another-workspace" },
      { ownerId: undefined },
      { environmentId: "evm-another-environment" },
      { environmentId: undefined },
      { name: "unapproved-service" },
      { name: undefined },
    ];
    for (const change of changes) {
      rejects(() => verifyCurrentGitSource({ ...before(), ...change }));
      rejects(() => verifyProposedImageSource(before(), { ...after(), ...change }, image));
    }
  });
  it("refuses paid plans, duplicate instances, different regions and URLs", () => {
    for (const changes of [
      { plan: "starter" }, { numInstances: 2 }, { region: "oregon" },
      { url: "https://different.onrender.com" }, { healthCheckPath: "/wrong" },
    ]) {
      rejects(() => verifyProposedImageSource(before(), {
        ...after(), serviceDetails: { ...after().serviceDetails, ...changes },
      }, image));
    }
  });
  it("refuses previews and missing freeze metadata", () => {
    rejects(() => verifyCurrentGitSource({ ...before(), autoDeployTrigger: undefined }));
    rejects(() => verifyProposedImageSource(before(), {
      ...after(), serviceDetails: { ...after().serviceDetails, previews: { generation: "automatic" } },
    }, image));
    rejects(() => verifyProposedImageSource(before(), {
      ...after(), serviceDetails: { ...after().serviceDetails, pullRequestPreviewsEnabled: "yes" },
    }, image));
  });
  it("rejects another repository, branch or execution platform at baseline", () => {
    rejects(() => verifyCurrentGitSource({ ...before(), branch: "feature" }));
    rejects(() => verifyCurrentGitSource({ ...before(), repo: "https://github.com/other/app" }));
    rejects(() => verifyCurrentGitSource({
      ...before(), serviceDetails: { ...before().serviceDetails, runtime: "image" },
    }));
  });
  it("does not serialize provider metadata or synthetic secret canaries in failures", () => {
    const marker = "AA536_NEVER_PRINT_SYNTHETIC_SECRET";
    let error;
    try { verifyCurrentGitSource({ ...before(), autoDeploy: "yes", secretValue: marker }); }
    catch (e) { error = e; }
    assert.ok(error);
    assert.equal(error.message.includes(marker), false);
    assert.equal(error.message.includes("secretValue"), false);
  });
});
