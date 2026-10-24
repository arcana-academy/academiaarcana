import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/quality.yml"), "utf8").replaceAll("\r\n", "\n");
const triggerSection = workflow.match(/^on:\n([\s\S]*?)^permissions:/m)?.[1] ?? "";

function branchesFor(event: "push" | "pull_request"): string[] {
  const matches = triggerSection.match(new RegExp(`^  ${event}:\\n    branches:\\n((?:      - [^\\n]+\\n)+)`, "m"));
  return matches?.[1].trim().split("\n").map((line) => line.trim().replace(/^- /, "").replace(/^['"]|['"]$/g, "")) ?? [];
}

describe("Quality Gate trigger contract", () => {
  it("avoids duplicate automatic runs for feat/chore PRs without dropping required PR checks", () => {
    expect(triggerSection).toContain("  workflow_dispatch:");
    expect(branchesFor("push")).toEqual(["main"]);
    expect(branchesFor("pull_request")).toEqual(["main"]);
    // A feature or chore branch targeting main is covered by pull_request only.
    for (const sourceBranch of ["feat/lesson", "chore/maintenance"]) {
      expect(branchesFor("push").includes(sourceBranch)).toBe(false);
      expect(branchesFor("pull_request").includes("main")).toBe(true);
    }
  });

  it("retains main push provenance and all essential checks, build, and isolated smoke", () => {
    expect(workflow).toContain("name: Academia Arcana Quality Gate");
    expect(workflow).toContain("  contents: read");
    expect(workflow).toContain("cancel-in-progress: true");
    for (const step of [
      "Verify supply-chain workflow boundary",
      "Verify dependency lifecycle allowlist",
      "Production dependency security audit",
      "Canonical infrastructure guard",
      "Lint",
      "Typecheck",
      "Unit tests",
      "Accessibility tests",
      "Production build",
      "End-to-end tests",
      "Verify production public configuration",
      "Build production image",
      "Smoke test isolated production image",
      "Save production image artifact",
      "Upload production image artifact",
    ]) {
      expect(workflow).toContain(`name: ${step}`);
    }
    expect(workflow).toContain("if: github.event_name == 'push' && github.ref == 'refs/heads/main'");
  });
});
