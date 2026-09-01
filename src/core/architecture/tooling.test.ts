import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type PackageJson = {
  scripts?: Record<string, string>;
  engines?: { node?: string };
};

const root = process.cwd();
const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
) as PackageJson;
const nodeVersion = readFileSync(join(root, ".nvmrc"), "utf8").trim();

describe("technical tooling contract", () => {
  it("keeps required quality scripts and Node 22 aligned", () => {
    expect(packageJson.scripts).toEqual(
      expect.objectContaining({
        build: expect.any(String),
        lint: expect.any(String),
        test: expect.any(String),
        typecheck: expect.any(String),
      }),
    );
    expect(nodeVersion).toBe("22");
    expect(packageJson.engines?.node).toBe(">=22 <23");
  });
});
